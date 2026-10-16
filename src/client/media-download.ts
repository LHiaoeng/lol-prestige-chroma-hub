import { mediaDownloadFilename } from "../components/media-download-filename";

export async function downloadMediaFile(url: string, filename?: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed with ${response.status}`);
    const objectUrl = URL.createObjectURL(await response.blob());
    saveBlob(objectUrl, mediaDownloadFilename(url, filename));
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function saveBlob(href: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = mediaDownloadFilename("", filename);
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
