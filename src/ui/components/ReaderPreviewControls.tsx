export interface ReaderPreviewControlsProps {
  density: "comfortable" | "compact";
  showImages: boolean;
  onDensityChange: (density: "comfortable" | "compact") => void;
  onShowImagesChange: (show: boolean) => void;
}

export function ReaderPreviewControls({
  density,
  showImages,
  onDensityChange,
  onShowImagesChange
}: ReaderPreviewControlsProps) {
  return (
    <section className="panel-section compact-section" aria-labelledby="reader-controls-heading">
      <h2 id="reader-controls-heading">Kindle preview</h2>
      <div className="segmented-control" aria-label="Preview density">
        <button
          type="button"
          aria-pressed={density === "comfortable"}
          onClick={() => onDensityChange("comfortable")}
        >
          Comfortable
        </button>
        <button type="button" aria-pressed={density === "compact"} onClick={() => onDensityChange("compact")}>
          Compact
        </button>
      </div>
      <label className="checkbox-field">
        <input type="checkbox" checked={showImages} onChange={(event) => onShowImagesChange(event.target.checked)} />
        <span>Show images in preview</span>
      </label>
    </section>
  );
}
