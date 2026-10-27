import type { PermissionPreflight, PreviewStage, PreviewTimingMark } from "../../types";

export interface PreviewWorkbenchProps {
  mode: string;
  route: string;
  imageMode: string;
  generatedFileName?: string | undefined;
  stages?: PreviewStage[] | undefined;
  timings?: PreviewTimingMark[] | undefined;
  permissionPreflight?: PermissionPreflight | undefined;
  recipeIds?: string[] | undefined;
  onOpenSettings: () => void;
}

export function PreviewWorkbench({
  mode,
  route,
  imageMode,
  generatedFileName,
  stages = [],
  timings = [],
  permissionPreflight,
  recipeIds = [],
  onOpenSettings
}: PreviewWorkbenchProps) {
  const blockingStages = stages.filter((stage) => stage.status === "blocked" || stage.status === "error");

  return (
    <section className="panel-section workbench-section" aria-labelledby="workbench-heading">
      <div className="section-heading-row">
        <h2 id="workbench-heading">Workbench</h2>
        <button type="button" className="text-button" onClick={onOpenSettings}>
          Settings
        </button>
      </div>
      <div className="workbench-grid">
        <Metric label="Capture" value={mode} />
        <Metric label="Route" value={routeLabel(route)} />
        <Metric label="Images" value={imageModeLabel(imageMode)} />
        <Metric label="Filename" value={generatedFileName ?? "Preview pending"} />
      </div>
      {blockingStages.length > 0 ? (
        <ul className="compact-list" aria-label="Workbench blockers">
          {blockingStages.map((stage) => (
            <li key={stage.name}>
              <strong>{stage.name}</strong>
              <span>{stage.message}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <details>
        <summary>Details</summary>
        <div className="details-grid">
          <div>
            <h3>Stages</h3>
            <ul className="compact-list">
              {stages.map((stage) => (
                <li key={stage.name}>
                  <strong>{stage.status}</strong>
                  <span>{stage.message}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Permissions</h3>
            <p className="muted">
              {permissionPreflight?.missingOrigins.length
                ? `${permissionPreflight.missingOrigins.length} host${permissionPreflight.missingOrigins.length === 1 ? "" : "s"} will be requested on Generate.`
                : "No additional image host access needed."}
            </p>
          </div>
          <div>
            <h3>Timing</h3>
            <ul className="compact-list">
              {timings.map((timing) => (
                <li key={`${timing.stage}-${timing.label}`}>
                  <strong>{timing.stage}</strong>
                  <span>{typeof timing.durationMs === "number" ? `${timing.durationMs} ms` : timing.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Recipes</h3>
            <p className="muted">{recipeIds.length > 0 ? recipeIds.join(", ") : "No site recipe applied."}</p>
          </div>
        </div>
      </details>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function routeLabel(route: string): string {
  if (route === "amazon-web") return "Web upload";
  if (route === "email-handoff") return "Email";
  return "Download";
}

function imageModeLabel(mode: string): string {
  if (mode === "text-only") return "Text";
  if (mode === "cover-only") return "Cover";
  return "Smart";
}
