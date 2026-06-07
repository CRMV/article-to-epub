import type { PreviewModel } from "../../types";
import { buildCompatibilityKit, compatibilityKitFileName } from "../../diagnostics/compatibilityKit";

export interface CompatibilityExportButtonProps {
  preview: PreviewModel;
  onExport: (payload: string, filename: string) => Promise<void>;
  busy?: boolean;
}

export function CompatibilityExportButton({ preview, onExport, busy = false }: CompatibilityExportButtonProps) {
  const payload = JSON.stringify(buildCompatibilityKit(preview), null, 2);

  return (
    <section className="panel-section compact-section" aria-labelledby="compatibility-heading">
      <h2 id="compatibility-heading">Compatibility kit</h2>
      <details>
        <summary>Preview JSON</summary>
        <pre className="json-preview">{payload}</pre>
      </details>
      <button type="button" onClick={() => onExport(payload, compatibilityKitFileName(preview))} disabled={busy}>
        Export kit
      </button>
    </section>
  );
}
