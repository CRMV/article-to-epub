import type { ResolvedMetadata } from "../../types";

export interface MetadataEditorProps {
  metadata: ResolvedMetadata;
  edits: Partial<ResolvedMetadata>;
  onChange: (edits: Partial<ResolvedMetadata>) => void;
}

const editableFields: Array<["title" | "author" | "publishedDate" | "source", string]> = [
  ["title", "Title"],
  ["author", "Author"],
  ["publishedDate", "Date"],
  ["source", "Source"]
];

export function MetadataEditor({ metadata, edits, onChange }: MetadataEditorProps) {
  return (
    <section className="panel-section" aria-labelledby="metadata-heading">
      <h2 id="metadata-heading">Metadata</h2>
      <div className="field-grid">
        {editableFields.map(([field, label]) => {
          const value = (edits[field] ?? metadata[field] ?? "") as string;
          const candidates = metadata.candidates[field] ?? [];
          return (
            <label key={field} className="field">
              <span>{label}</span>
              <input
                value={value}
                onChange={(event) => onChange({ ...edits, [field]: event.target.value })}
                aria-label={label}
              />
              {candidates.length > 1 ? (
                <select
                  aria-label={`${label} alternatives`}
                  value=""
                  onChange={(event) => {
                    if (event.target.value) onChange({ ...edits, [field]: event.target.value });
                  }}
                >
                  <option value="">Alternatives</option>
                  {candidates.map((candidate) => (
                    <option key={`${candidate.source}-${candidate.value}`} value={candidate.value}>
                      {candidate.value} ({candidate.source})
                    </option>
                  ))}
                </select>
              ) : null}
            </label>
          );
        })}
      </div>
    </section>
  );
}

