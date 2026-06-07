import type { KindleProfileId } from "../../types";
import { builtInProfiles } from "../../storage/kindleProfiles";

export interface ProfileSelectorProps {
  selectedProfileId: string;
  onChange: (profileId: KindleProfileId) => void;
}

export function ProfileSelector({ selectedProfileId, onChange }: ProfileSelectorProps) {
  return (
    <section className="panel-section compact-section" aria-labelledby="profile-heading">
      <h2 id="profile-heading">Profile</h2>
      <label className="field">
        <span>Kindle profile</span>
        <select
          value={selectedProfileId}
          onChange={(event) => onChange(event.target.value as KindleProfileId)}
          aria-label="Kindle profile"
        >
          {builtInProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
      </label>
      <p className="muted">{builtInProfiles.find((profile) => profile.id === selectedProfileId)?.description}</p>
    </section>
  );
}
