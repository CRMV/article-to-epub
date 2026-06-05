export async function downloadEpub(bytes: Uint8Array, filename: string): Promise<number> {
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([body], { type: "application/epub+zip" });
  const url = URL.createObjectURL(blob);
  try {
    return await chrome.downloads.download({
      url,
      filename,
      saveAs: true
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}
