import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { buildConversionReport } from "../../src/diagnostics/conversionReport";
import { createEmailHandoff } from "../../src/delivery/emailHandoff";
import { openAmazonUpload } from "../../src/delivery/amazonUploadHandoff";
import { downloadEpub } from "../../src/delivery/downloadArticle";
import { buildEpub, buildFileName } from "../../src/ebook/epubBuilder";
import { planImageBudget } from "../../src/ebook/imageBudget";
import { resolveArticleAssets } from "../../src/extraction/assetResolver";
import { fetchIncludedImageAssets } from "../../src/extraction/fetchImageAssets";
import { collectPageSnapshot } from "../../src/extraction/injectedSnapshot";
import { planAssetPermissions, removeAssetOrigins, requestAssetOrigins } from "../../src/extraction/permissionPlanner";
import { saveSettings, loadSettings } from "../../src/storage/settings";
import type { DeliveryRoute, ImageMode, PageSnapshot, PreviewModel, ResolvedMetadata } from "../../src/types";
import { ArticlePreview } from "../../src/ui/components/ArticlePreview";
import { ConversionReport } from "../../src/ui/components/ConversionReport";
import { DeliveryPanel } from "../../src/ui/components/DeliveryPanel";
import { ImageModeControl } from "../../src/ui/components/ImageModeControl";
import { MetadataEditor } from "../../src/ui/components/MetadataEditor";
import { buildPreviewFromSnapshot, metadataWithEdits } from "../../src/ui/state/conversionStore";
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
    setStatus({ kind: "loading", text: "Capturing the active tab..." });

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0]?.id;
      if (!tabId) throw new Error("No active tab is available.");
      const results = (await chrome.scripting.executeScript({
        target: { tabId },
        func: collectPageSnapshot
      })) as Array<{ result?: PageSnapshot }>;
      const nextSnapshot = results[0]?.result;
      if (!nextSnapshot) throw new Error("The active page did not return a snapshot.");
      setSnapshot(nextSnapshot);
      setMetadataEdits({});
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Could not capture the active page." });
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
      await saveSettings({ imageMode, route, ...(kindleEmail ? { kindleEmail } : {}) });
      const assets = resolveArticleAssets(preview.article);
      const decisions = planImageBudget(assets, imageMode, route);
      const permissionPlan = planAssetPermissions(preview.snapshot.url, decisions.filter((decision) => decision.include).map((decision) => decision.asset.candidate));
      grantedOrigins = permissionPlan.requiredOrigins;

      const granted = await requestAssetOrigins(grantedOrigins);
      const binaryAssets = granted ? await fetchIncludedImageAssets(decisions) : [];
      const report = buildConversionReport(decisions, route);
      const bytes = await buildEpub({
        article: preview.article,
        metadata: editedMetadata,
        assets: binaryAssets
      });
      const filename = buildFileName(editedMetadata);
      await downloadEpub(bytes, filename);
      setGeneratedFileName(filename);
      setPreview({ ...preview, metadata: editedMetadata, report });
      setStatus({ kind: "done", text: granted ? "EPUB downloaded." : "EPUB downloaded without cross-origin images." });
      if (route === "amazon-web") await openAmazonUpload();
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "EPUB generation failed." });
    } finally {
      if (grantedOrigins.length > 0) void removeAssetOrigins(grantedOrigins);
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

