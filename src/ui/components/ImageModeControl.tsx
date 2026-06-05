import type { DeliveryRoute, ImageMode } from "../../types";

export interface ImageModeControlProps {
  imageMode: ImageMode;
  route: DeliveryRoute;
  onImageModeChange: (mode: ImageMode) => void;
  onRouteChange: (route: DeliveryRoute) => void;
}

export function ImageModeControl({ imageMode, route, onImageModeChange, onRouteChange }: ImageModeControlProps) {
  return (
    <section className="panel-section controls-section" aria-labelledby="controls-heading">
      <h2 id="controls-heading">Output</h2>
      <label className="field">
        <span>Images</span>
        <select value={imageMode} onChange={(event) => onImageModeChange(event.target.value as ImageMode)}>
          <option value="text-only">Text only</option>
          <option value="cover-only">Cover only</option>
          <option value="smart-images">Smart images</option>
        </select>
      </label>
      <label className="field">
        <span>Route</span>
        <select value={route} onChange={(event) => onRouteChange(event.target.value as DeliveryRoute)}>
          <option value="download">Download</option>
          <option value="amazon-web">Amazon web upload</option>
          <option value="email-handoff">Email handoff</option>
        </select>
      </label>
    </section>
  );
}

