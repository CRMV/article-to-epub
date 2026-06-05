import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CAPTURE_ACTIVE_TAB_REQUEST,
  isSnapshotMessage,
  loadLatestSnapshot
} from "../../src/capture/snapshotSession";
import { requestCaptureAccess } from "../../src/capture/pageAccess";
import { buildConversionReport } from "../../src/diagnostics/conversionReport";
import { createEmailHandoff } from "../../src/delivery/emailHandoff";
import { openAmazonUpload } from "../../src/delivery/amazonUploadHandoff";
import { downloadEpub } from "../../src/delivery/downloadArticle";
import { buildEpub, buildFileName } from "../../src/ebook/epubBuilder";
import { planImageBudget, type AssetDecision } from "../../src/ebook/imageBudget";
import { resolveArticleAssets } from "../../src/extraction/assetResolver";
import { fetchIncludedImageAssets } from "../../src/extraction/fetchImageAssets";
import { planAssetPermissions, removeAssetOrigins, requestAssetOrigins } from "../../src/extraction/permissionPlanner";
import { saveSettings, loadSettings } from "../../src/storage/settings";
import type { DeliveryRoute, ImageMode, PageSnapshot, PreviewModel, ResolvedMetadata } from "../../src/types";
import { ArticlePreview } from "../../src/ui/components/ArticlePreview";
import { ConversionReport } from "../../src/ui/components/ConversionReport";
import { DeliveryPanel } from "../../src/ui/components/DeliveryPanel";
import { ImageModeControl } from "../../src/ui/components/ImageModeControl";
import { MetadataEditor } from "../../src/ui/components/MetadataEditor";
import { buildPreviewFromSnapshot, metadataWithEdits, openGraphImageFromSnapshot } from "../../src/ui/state/conversionStore";
import "./style.css";

type StatusKind = "idle" | "loading" | "ready" | "warning" | "error" | "done";

interface StatusState {
  kind: StatusKind;
  text: string;
}

function App() {
  const [snapshot, setSnapshot] = useState<PageSnapshot | undefined>();
  const [preview, setPreview] = useState<PreviewModel | undefined>();
  const [metadataEdits, setMetadataEdits] = useState<Partial<ResolvedMetadata>>({});
  const [imageMode, setImageMode] = useState<ImageMode>("smart-images");
  const [route, setRoute] = useState<DeliveryRoute>("amazon-web");
  const [kindleEmail, setKindleEmail] = useState("");
  const [generatedFileName, setGeneratedFileName] = useState<string | undefined>();
  const [status, setStatus] = useState<StatusState>({ kind: "idle", text: "Ready to capture the active article." });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadSettings().then((settings) => {
      setImageMode(settings.imageMode);
      setRoute(settings.route);
      if (settings.kindleEmail) setKindleEmail(settings.kindleEmail);
    });
  }, []);

  useEffect(() => {
    void loadLatestSnapshot().then((storedSnapshot) => {
      if (storedSnapshot) setSnapshot(storedSnapshot);
    });

    const onMessage = (message: unknown) => {
      if (!isSnapshotMessage(message)) return;
      if (message.type === "article-ferry:snapshot-ready") {
        setSnapshot(message.snapshot);
        setMetadataEdits({});
        return;
      }
      setStatus({ kind: "error", text: message.message });
    };

    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    const result = buildPreviewFromSnapshot(snapshot, { imageMode, route });
    if (!result.ok) {
      setPreview(undefined);
      setStatus({ kind: "error", text: result.message });
      return;
    }
    setPreview(result.preview);
    setStatus({ kind: result.preview.report.warnings.some((warning) => warning.severity === "blocking") ? "warning" : "ready", text: "Preview ready." });
  }, [snapshot, imageMode, route]);

  const editedMetadata = useMemo(() => {
    return preview ? metadataWithEdits(preview.metadata, metadataEdits) : undefined;
  }, [metadataEdits, preview]);

  async function captureActiveTab() {
    setBusy(true);
    setGeneratedFileName(undefined);
    setStatus({ kind: "loading", text: "Refreshing capture..." });

    try {
      const granted = await requestCaptureAccess();
      if (!granted) throw new Error("Article Ferry needs site access before it can capture this page.");
      const response = (await chrome.runtime.sendMessage({ type: CAPTURE_ACTIVE_TAB_REQUEST })) as
        | { ok: true }
        | { ok: false; message: string };
      if (!response?.ok) {
        throw new Error(response?.message ?? "Click the Article Ferry toolbar icon from the article tab to refresh access.");
      }
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Click the Article Ferry toolbar icon from the article tab to refresh access."
      });
    } finally {
      setBusy(false);
    }
  }

  async function generateEpub() {
    if (!preview || !editedMetadata) return;

    setBusy(true);
    setStatus({ kind: "loading", text: "Generating EPUB..." });
    let grantedOrigins: string[] = [];

    try {
      const assets = resolveArticleAssets(preview.article, openGraphImageFromSnapshot(preview.snapshot));
      const decisions = planImageBudget(assets, imageMode, route);
      const plannedImageCount = decisions.filter((decision) => decision.include).length;
      const permissionPlan = planAssetPermissions(
        preview.snapshot.url,
        decisions.filter((decision) => decision.include).map((decision) => decision.asset.candidate)
      );
      grantedOrigins = permissionPlan.requiredOrigins;

      const granted = await requestAssetOrigins(grantedOrigins);
      await saveSettings({ imageMode, route, ...(kindleEmail ? { kindleEmail } : {}) });
      const fetchableDecisions = granted
        ? decisions
        : decisions.filter((decision) => decision.include && !requiresOptionalImagePermission(preview.snapshot.url, decision));
      const binaryAssets = await fetchIncludedImageAssets(fetchableDecisions);
      const report = buildConversionReport(reconcileImageDecisions(decisions, binaryAssets, granted, preview.snapshot.url), route);
      const bytes = await buildEpub({
        article: preview.article,
        metadata: editedMetadata,
        assets: binaryAssets
      });
      const filename = buildFileName(editedMetadata);
      await downloadEpub(bytes, filename);
      setGeneratedFileName(filename);
      setPreview({ ...preview, metadata: editedMetadata, report });
      setStatus({
        kind: "done",
        text: granted
          ? `EPUB downloaded with ${binaryAssets.length}/${plannedImageCount} planned images.`
          : "EPUB downloaded without cross-origin images."
      });
      if (route === "amazon-web") await openAmazonUpload();
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "EPUB generation failed." });
    } finally {
      if (grantedOrigins.length > 0) {
        try {
          const removed = await removeAssetOrigins(grantedOrigins);
          if (!removed) {
            setStatus((current) =>
              current.kind === "done"
                ? {
                    kind: "warning",
                    text: `${current.text} Image host permission cleanup was not confirmed.`
                  }
                : current
            );
          }
        } catch {
          setStatus((current) =>
            current.kind === "done"
              ? {
                  kind: "warning",
                  text: `${current.text} Image host permission cleanup failed.`
                }
              : current
          );
        }
      }
      setBusy(false);
    }
  }

  async function showEmailDetails() {
    if (!editedMetadata || !generatedFileName) return;
    try {
      const handoff = createEmailHandoff(kindleEmail, editedMetadata.title ?? "Article Ferry EPUB", generatedFileName);
      await navigator.clipboard?.writeText(`${handoff.recipient}\n${handoff.subject}\n${handoff.body}`);
      setStatus({ kind: "done", text: "Email handoff details copied. Attach the downloaded EPUB before sending." });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Could not prepare email handoff." });
    }
  }

  return (
    <main className="app-shell">
      <header className="top-strip" data-kind={status.kind} aria-live="polite">
        <div>
          <p className="eyebrow">{status.kind}</p>
          <h1>Article Ferry</h1>
          <p className="status-text">{status.text}</p>
        </div>
        <button type="button" onClick={captureActiveTab} disabled={busy}>
          Capture
        </button>
      </header>

      {preview && editedMetadata ? (
        <>
          <MetadataEditor metadata={preview.metadata} edits={metadataEdits} onChange={setMetadataEdits} />
          <ImageModeControl imageMode={imageMode} route={route} onImageModeChange={setImageMode} onRouteChange={setRoute} />
          <ConversionReport report={preview.report} />
          <ArticlePreview article={preview.article} />
          <DeliveryPanel
            route={route}
            generatedFileName={generatedFileName}
            kindleEmail={kindleEmail}
            onKindleEmailChange={setKindleEmail}
            onGenerate={generateEpub}
            onOpenAmazon={openAmazonUpload}
            onEmail={showEmailDetails}
            busy={busy}
          />
        </>
      ) : (
        <section className="panel-section empty-state">
          <h2>Preview</h2>
          <p>Capture an article tab to review metadata, images, size warnings, and EPUB delivery options.</p>
        </section>
      )}
    </main>
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing root element");
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default App;

function requiresOptionalImagePermission(pageUrl: string, decision: AssetDecision): boolean {
  if (!decision.include) return false;
  try {
    const pageOrigin = new URL(pageUrl).origin;
    const asset = new URL(decision.asset.candidate.url);
    return asset.protocol === "https:" && asset.origin !== pageOrigin;
  } catch {
    return false;
  }
}

function reconcileImageDecisions(
  decisions: AssetDecision[],
  assets: Array<{ originalUrl: string }>,
  optionalPermissionGranted: boolean,
  pageUrl: string
): AssetDecision[] {
  const fetchedUrls = new Set(assets.map((asset) => asset.originalUrl));

  return decisions.map((decision) => {
    if (!decision.include || fetchedUrls.has(decision.asset.candidate.url)) return decision;
    return {
      ...decision,
      include: false,
      reason:
        !optionalPermissionGranted && requiresOptionalImagePermission(pageUrl, decision)
          ? "permission-denied"
          : "fetch-failed"
    };
  });
}
