/** Keep download names portable across Windows and byte-limited filesystems. */
export function mediaDownloadFilename(url: string, filename?: string): string {
  let original = url.split(/[?#]/, 1)[0]?.split("/").pop() ?? "";
  try { original = decodeURIComponent(original); } catch { /* Keep malformed URL escapes literal. */ }
  const clean = (value: string): string => value.normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f-\u009f]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-")
    .replace(/^[.\s-]+|[.\s-]+$/g, "");
  const name = clean(filename?.trim() || original) || "media";
  const suppliedExtension = name.match(/\.[a-z0-9]{1,10}$/i)?.[0] ?? "";
  const sourceExtension = clean(original).match(/\.[a-z0-9]{1,10}$/i)?.[0] ?? "";
  const requestedExtension = !sourceExtension || sourceExtension.toLowerCase() === suppliedExtension.toLowerCase()
    || /\.(?:avif|bmp|gif|heic|ico|jfif|jpe?g|png|svg|tiff?|webp|avi|m4v|mkv|mov|mp4|mpe?g|og[gv]|webm)$/i.test(suppliedExtension)
    ? suppliedExtension : "";
  const extension = sourceExtension || suppliedExtension;
  let stem = clean(requestedExtension ? name.slice(0, -requestedExtension.length) : name) || "media";
  // Device names remain reserved even when followed by one or more extensions.
  if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\s*\.|$)/i.test(stem)) stem = `_${stem}`;
  const encoder = new TextEncoder();
  let bytes = encoder.encode(extension).length;
  let shortened = "";
  for (const character of stem) {
    bytes += encoder.encode(character).length;
    if (bytes > 240) break;
    shortened += character;
  }
  return `${shortened.replace(/[.\s]+$/g, "") || "media"}${extension}`;
}
