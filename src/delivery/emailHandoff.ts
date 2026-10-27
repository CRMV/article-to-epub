import { isValidKindleEmail } from "../storage/kindleTargets";

export interface EmailHandoff {
  recipient: string;
  subject: string;
  body: string;
  mailtoUrl: string;
}

export function createEmailHandoff(recipient: string, title: string, filename: string): EmailHandoff {
  if (!isValidKindleEmail(recipient)) {
    throw new Error("Enter a valid @kindle.com address.");
  }

  const subject = title || "Article to EPUB";
  const body = `Attach ${filename} before sending. Amazon requires the sender address to be approved for this Kindle library.`;
  const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { recipient, subject, body, mailtoUrl };
}
