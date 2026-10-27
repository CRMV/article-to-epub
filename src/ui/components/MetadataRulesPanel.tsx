import type { MetadataEditRule } from "../../storage/recentMetadataEdits";

export interface MetadataRulesPanelProps {
  rules: MetadataEditRule[];
  onDelete: (rule: MetadataEditRule) => void;
}

export function MetadataRulesPanel({ rules, onDelete }: MetadataRulesPanelProps) {
  return (
    <section className="settings-group" aria-labelledby="rules-heading">
      <h3 id="rules-heading">Remembered metadata</h3>
      {rules.length === 0 ? (
        <p className="muted">No remembered metadata corrections.</p>
      ) : (
        <ul className="compact-list">
          {rules.map((rule) => (
            <li key={`${rule.site}-${rule.pathPrefix ?? ""}-${rule.field}`}>
              <span>
                <strong>{rule.field}</strong> for {rule.site}
                {rule.pathPrefix ? rule.pathPrefix : ""}
              </span>
              <button type="button" className="text-button" onClick={() => onDelete(rule)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
