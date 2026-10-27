import type { KindleProfile, KindleProfileId } from "../types";

export const builtInProfiles: KindleProfile[] = [
  {
    id: "default",
    name: "Balanced",
    description: "Current Article to EPUB defaults for web upload.",
    route: "amazon-web",
    imageMode: "smart-images",
    filenamePattern: "standard"
  },
  {
    id: "fast-email",
    name: "Fast email",
    description: "Keeps files conservative for Kindle email handoff.",
    route: "email-handoff",
    imageMode: "cover-only",
    filenamePattern: "standard"
  },
  {
    id: "rich-web-upload",
    name: "Rich web upload",
    description: "Uses Amazon web upload with smart images.",
    route: "amazon-web",
    imageMode: "smart-images",
    filenamePattern: "source-title"
  },
  {
    id: "local-epub-only",
    name: "Local EPUB only",
    description: "Creates a Kindle-compatible local EPUB without handoff.",
    route: "download",
    imageMode: "text-only",
    filenamePattern: "date-title"
  },
  {
    id: "image-heavy",
    name: "Image-heavy article",
    description: "Uses the web-upload budget for image-heavy articles.",
    route: "amazon-web",
    imageMode: "smart-images",
    filenamePattern: "source-title"
  }
];

export const defaultProfileId: KindleProfileId = "default";

export function getProfile(profileId: string | undefined): KindleProfile {
  return builtInProfiles.find((profile) => profile.id === profileId) ?? builtInProfiles[0]!;
}

export function isKindleProfileId(value: unknown): value is KindleProfileId {
  return typeof value === "string" && builtInProfiles.some((profile) => profile.id === value);
}
