import type { ConversionReport as ConversionReportModel } from "../../types";

export function ConversionReport({ report }: { report: ConversionReportModel }) {
  const mb = report.estimatedBytes / (1024 * 1024);

  return (
    <section className="panel-section" aria-labelledby="report-heading">
      <h2 id="report-heading">Report</h2>
      <div className="metric-row">
        <span>{report.includedImages} included</span>
        <span>{report.skippedImages} skipped</span>
        <span>{mb.toFixed(1)} MB est.</span>
      </div>
      {report.warnings.length > 0 ? (
        <ul className="warning-list">
          {report.warnings.slice(0, 6).map((warning) => (
            <li key={`${warning.code}-${warning.message}`} data-severity={warning.severity}>
              <strong>{warning.severity}</strong>
              <span>{warning.message}</span>
              {warning.action ? <em>{warning.action}</em> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No blocking warnings for the selected route.</p>
      )}
    </section>
  );
}

