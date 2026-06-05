export const AMAZON_UPLOAD_URL = "https://www.amazon.com/sendtokindle";

export async function openAmazonUpload(url = AMAZON_UPLOAD_URL): Promise<void> {
  await chrome.tabs.create({ url });
}

