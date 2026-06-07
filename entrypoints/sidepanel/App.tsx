import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CAPTURE_ACTIVE_TAB_REQUEST,
  isSnapshotMessage,
  loadLatestSnapshot
} from "../../src/capture/snapshotSession";
import { buildConversionReport } from "../../src/diagnostics/conversionReport";
import { createEmailHandoff } from "../../src/delivery/emailHandoff";
import { openAmazonUpload } from "../../src/delivery/amazonUploadHandoff";
import { downloadEpub } from "../../src/delivery/downloadArticle";
import { buildEpub, buildFileName } from "../../src/ebook/epubBuilder";
import { planImageBudget, type AssetDecision } from "../../src/ebook/imageBudget";
import { resolveArticleAssets } from "../../src/extraction/assetResolver";
import { fetchIncludedImageAssets } from "../../src/extraction/fetchImageAssets";
import { checkAssetOriginGrants, planAssetPermissions, removeAssetOrigins, requestAssetOrigins } from "../../src/extraction/permissionPlanner";
import { clearSettings, saveSettings, loadSettings } from "../../src/storage/settings";
import { isValidKindleEmail } from "../../src/storage/kindleTargets";
import {
  clearMetadataEditRules,
  deleteMetadataEditRule,
  loadMetadataEditRules,
  ruleScopeFromUrl,
  saveMetadataEditRule,
  type MetadataEditRule
} from "../../src/storage/recentMetadataEdits";
import { getProfile } from "../../src/storage/kindleProfiles";
import type { DeliveryRoute, ImageMode, KindleProfileId, PageSnapshot, PreviewModel, ResolvedMetadata } from "../../src/types";
import { ArticlePreview } from "../../src/ui/components/ArticlePreview";
import { CompatibilityExportButton } from "../../src/ui/components/CompatibilityExportButton";
import { ConversionReport } from "../../src/ui/components/ConversionReport";
import { DeliveryPanel } from "../../src/ui/components/DeliveryPanel";
import { ImageModeControl } from "../../src/ui/components/ImageModeControl";
import { MetadataEditor } from "../../src/ui/components/MetadataEditor";
import { PreviewWorkbench } from "../../src/ui/components/PreviewWorkbench";
import { ReaderPreviewControls } from "../../src/ui/components/ReaderPreviewControls";
import { SettingsPanel } from "../../src/ui/components/SettingsPanel";
import { buildWorkbenchPreviewFromSnapshot, metadataWithEdits, openGraphImageFromSnapshot } from "../../src/ui/state/conversionStore";
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
  const [selectedProfileId, setSelectedProfileId] = useState<KindleProfileId>("default");
  const [metadataRules, setMetadataRules] = useState<MetadataEditRule[]>([]);
  const [kindleEmail, setKindleEmail] = useState("");
  const [generatedFileName, setGeneratedFileName] = useState<string | undefined>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [readerDensity, setReaderDensity] = useState<"comfortable" | "compact">("comfortable");
  const [showPreviewImages, setShowPreviewImages] = useState(true);
  const [status, setStatus] = useState<StatusState>({ kind: "idle", text: "Ready to capture the active article." });
  const [busy, setBusy] = useState(false);

  const selectedProfile = useMemo(() => getProfile(selectedProfileId), [selectedProfileId]);

  useEffect(() => {
    void loadSettings().then((settings) => {
      const profileId = settings.selectedProfileId ?? "default";
      setSelectedProfileId(profileId);
      setImageMode(settings.imageMode);
      setRoute(settings.route);
      if (settings.kindleEmail) setKindleEmail(settings.kindleEmail);
    });
    void loadMetadataEditRules().then(setMetadataRules);
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
    let cancelled = false;
    setStatus({ kind: "loading", text: "Building preview..." });
    void buildWorkbenchPreviewFromSnapshot(snapshot, { imageMode, route, profileId: selectedProfileId, metadataRules })
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setPreview(undefined);
          setStatus({ kind: "error", text: result.message });
          return;
        }
        setPreview(result.preview);
        setStatus({
          kind: result.preview.report.warnings.some((warning) => warning.severity === "blocking") ? "warning" : "ready",
          text: "Preview ready."
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPreview(undefined);
        setStatus({
          kind: "error",
          text: error instanceof Error ? error.message : "Preview failed."
        });
      });
    return () => {
      cancelled = true;
    };
  }, [snapshot, imageMode, route, selectedProfileId, metadataRules]);

  useEffect(() => {
    setGeneratedFileName(undefined);
  }, [snapshot, metadataEdits, imageMode, route, selectedProfileId]);

  const editedMetadata = useMemo(() => {
    return preview ? metadataWithEdits(preview.metadata, metadataEdits) : undefined;
  }, [metadataEdits, preview]);

  const filenamePreview = useMemo(() => {
    return editedMetadata ? buildFileName(editedMetadata, selectedProfile.filenamePattern) : undefined;
  }, [editedMetadata, selectedProfile.filenamePattern]);

  async function captureActiveTab() {
    setBusy(true);
    setGeneratedFileName(undefined);
    setStatus({ kind: "loading", text: "Refreshing capture..." });

    try {
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
    let cleanupOrigins: string[] = [];

    try {
      const assets = resolveArticleAssets(preview.article, openGraphImageFromSnapshot(preview.snapshot), preview.snapshot);
      const decisions = planImageBudget(assets, imageMode, route);
      const plannedImageCount = decisions.filter((decision) => decision.include).length;
      const permissionPlan = planAssetPermissions(
        preview.snapshot.url,
        decisions.filter((decision) => decision.include).map((decision) => decision.asset.candidate)
      );
      const preExistingGrants = await checkAssetOriginGrants(permissionPlan.requiredOrigins);
      const newlyNeededOrigins = permissionPlan.requiredOrigins.filter((origin) => !preExistingGrants.includes(origin));
      const granted = await requestAssetOrigins(newlyNeededOrigins);
      cleanupOrigins = granted ? newlyNeededOrigins : [];
      await saveCurrentSettings();
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
      const filename = buildFileName(editedMetadata, selectedProfile.filenamePattern);
      await downloadEpub(bytes, filename);
      setGeneratedFileName(filename);
      setPreview({ ...preview, metadata: editedMetadata, report, generatedFileName: filename });
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
      if (cleanupOrigins.length > 0) {
        try {
          const removed = await removeAssetOrigins(cleanupOrigins);
          if (!removed) {
            setStatus((current) =>
              current.kind === "done" || current.kind === "error"
                ? { kind: "warning", text: `${current.text} Image host permission cleanup was not confirmed.` }
                : { kind: "warning", text: "Image host permission cleanup was not confirmed." }
            );
          }
        } catch {
          setStatus((current) =>
            current.kind === "done" || current.kind === "error"
              ? { kind: "warning", text: `${current.text} Image host permission cleanup failed.` }
              : { kind: "warning", text: "Image host permission cleanup failed." }
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

  async function rememberMetadata(field: "title" | "author" | "publishedDate" | "source", scopeMode: "domain" | "path") {
    if (!preview) return;
    const value = metadataEdits[field];
    const scope = ruleScopeFromUrl(preview.snapshot.canonicalUrl ?? preview.snapshot.url, scopeMode);
    if (!scope || typeof value !== "string" || !value.trim()) return;
    const rules = await saveMetadataEditRule({ ...scope, field, value });
    setMetadataRules(rules);
    setStatus({ kind: "done", text: "Metadata correction remembered locally." });
  }

  async function deleteMetadataRule(rule: MetadataEditRule) {
    setMetadataRules(await deleteMetadataEditRule(rule));
  }

  async function clearLocalPersistence() {
    await clearMetadataEditRules();
    await clearSettings();
    setMetadataRules([]);
    setSelectedProfileId("default");
    setImageMode("smart-images");
    setRoute("amazon-web");
    setKindleEmail("");
    setStatus({ kind: "done", text: "Local settings cleared." });
  }

  async function exportCompatibilityKit(payload: string, filename: string) {
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    try {
      await chrome.downloads.download({ url, filename, saveAs: true });
      setStatus({ kind: "done", text: "Compatibility kit exported." });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Compatibility kit export failed." });
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    }
  }

  async function saveCurrentSettings() {
    await saveSettings({
      imageMode,
      route,
      selectedProfileId,
      ...validKindleEmailSetting(kindleEmail)
    });
  }

  function selectProfile(profileId: KindleProfileId) {
    const profile = getProfile(profileId);
    setSelectedProfileId(profileId);
    setImageMode(profile.imageMode);
    setRoute(profile.route);
    setGeneratedFileName(undefined);
    void saveSettings({
      imageMode: profile.imageMode,
      route: profile.route,
      selectedProfileId: profileId,
      ...validKindleEmailSetting(kindleEmail)
    }).catch((error: unknown) => {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not save profile selection."
      });
    });
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

      {settingsOpen ? (
        <SettingsPanel
          selectedProfileId={selectedProfileId}
          rules={metadataRules}
          onProfileChange={selectProfile}
          onRuleDelete={deleteMetadataRule}
          onClear={clearLocalPersistence}
          onClose={() => setSettingsOpen(false)}
        />
      ) : preview && editedMetadata ? (
        <>
          <PreviewWorkbench
            mode={preview.snapshot.mode}
            route={route}
            imageMode={imageMode}
            generatedFileName={generatedFileName ?? filenamePreview ?? preview.generatedFileName}
            stages={preview.stages}
            timings={preview.timings}
            permissionPreflight={preview.permissionPreflight}
            recipeIds={preview.recipeIds}
            onOpenSettings={() => setSettingsOpen(true)}
          />
          <MetadataEditor metadata={preview.metadata} edits={metadataEdits} onChange={setMetadataEdits} onRemember={rememberMetadata} />
          <ImageModeControl imageMode={imageMode} route={route} onImageModeChange={setImageMode} onRouteChange={setRoute} />
          <ConversionReport report={preview.report} />
          <ReaderPreviewControls
            density={readerDensity}
            showImages={showPreviewImages}
            onDensityChange={setReaderDensity}
            onShowImagesChange={setShowPreviewImages}
          />
          <ArticlePreview article={preview.article} density={readerDensity} showImages={showPreviewImages} />
          <CompatibilityExportButton preview={{ ...preview, metadata: editedMetadata }} onExport={exportCompatibilityKit} busy={busy} />
          <DeliveryPanel
            route={route}
            generatedFileName={generatedFileName}
            filenamePreview={filenamePreview ?? preview.generatedFileName}
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

function validKindleEmailSetting(kindleEmail: string): { kindleEmail: string } | Record<string, never> {
  const trimmed = kindleEmail.trim();
  return isValidKindleEmail(trimmed) ? { kindleEmail: trimmed } : {};
}

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
