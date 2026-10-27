import type { KindleProfileId } from "../../types";
import type { MetadataEditRule } from "../../storage/recentMetadataEdits";
import { ProfileSelector } from "./ProfileSelector";
import { MetadataRulesPanel } from "./MetadataRulesPanel";

export interface SettingsPanelProps {
  selectedProfileId: string;
  rules: MetadataEditRule[];
  onProfileChange: (profileId: KindleProfileId) => void;
  onRuleDelete: (rule: MetadataEditRule) => void;
  onClear: () => void;
  onClose: () => void;
}

export function SettingsPanel({
  selectedProfileId,
  rules,
  onProfileChange,
  onRuleDelete,
  onClear,
  onClose
}: SettingsPanelProps) {
  return (
    <section className="settings-panel" aria-labelledby="settings-heading">
      <div className="section-heading-row">
        <h2 id="settings-heading">Settings</h2>
        <button type="button" onClick={onClose}>
          Back
        </button>
      </div>
      <ProfileSelector selectedProfileId={selectedProfileId} onChange={onProfileChange} />
      <MetadataRulesPanel rules={rules} onDelete={onRuleDelete} />
      <section className="settings-group" aria-labelledby="persistence-heading">
        <h3 id="persistence-heading">Persistence</h3>
        <p className="muted">Clears profile overrides, remembered metadata rules, and Kindle email.</p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Clear Article to EPUB local settings and remembered metadata rules?")) onClear();
          }}
        >
          Clear local settings
        </button>
      </section>
    </section>
  );
}
