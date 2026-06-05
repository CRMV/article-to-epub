import type { DeliveryRoute } from "../../types";

export interface DeliveryPanelProps {
  route: DeliveryRoute;
  generatedFileName: string | undefined;
  kindleEmail: string;
  onKindleEmailChange: (value: string) => void;
  onGenerate: () => void;
  onOpenAmazon: () => void;
  onEmail: () => void;
  busy: boolean;
}

export function DeliveryPanel({
  route,
  generatedFileName,
  kindleEmail,
  onKindleEmailChange,
  onGenerate,
  onOpenAmazon,
  onEmail,
  busy
}: DeliveryPanelProps) {
  return (
    <section className="delivery-panel" aria-labelledby="delivery-heading">
      <div>
        <h2 id="delivery-heading">Delivery</h2>
        <p className="muted">{generatedFileName ? generatedFileName : "Generate an EPUB before handoff."}</p>
      </div>
      {route === "email-handoff" ? (
        <label className="field compact-field">
          <span>Kindle email</span>
          <input value={kindleEmail} onChange={(event) => onKindleEmailChange(event.target.value)} placeholder="name@kindle.com" />
        </label>
      ) : null}
      <div className="button-row">
        <button type="button" className="primary-button" onClick={onGenerate} disabled={busy}>
          {busy ? "Generating..." : "Generate EPUB"}
        </button>
        {route === "amazon-web" ? (
          <button type="button" onClick={onOpenAmazon} disabled={!generatedFileName}>
            Open upload
          </button>
        ) : null}
        {route === "email-handoff" ? (
          <button type="button" onClick={onEmail} disabled={!generatedFileName}>
            Email details
          </button>
        ) : null}
      </div>
    </section>
  );
}
