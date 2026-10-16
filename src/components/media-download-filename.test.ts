import { describe, expect, it } from "vitest";
import { mediaDownloadFilename } from "./media-download-filename";

describe("media download filenames", () => {
  it.each([
    ["https://example.test/art.jpg?version=2#preview", undefined, "art.jpg"],
    ["/media/%E9%98%BF%E7%8B%B8%20%E5%8E%9F%E7%94%BB.webp", undefined, "阿狸 原画.webp"],
    ["/media/bad%2.jpg", undefined, "bad%2.jpg"],
    ["/media/art.jpg", "联盟不朽 阿狸", "联盟不朽 阿狸.jpg"],
    ["/media/clip.webm", "阿狸 动态原画.webm", "阿狸 动态原画.webm"],
    ["/media/art.jpg", "自定义.PNG", "自定义.jpg"],
    ["/media/art.JPEG", "custom.jpeg", "custom.JPEG"],
    ["/media/art.jpg", " .K/DA: 阿狸<>\"\\|?*\u0000\u001f\u007f.. ", "K-DA- 阿狸.jpg"],
    ["/media/art.jpg", "ＣＯＭ¹", "_COM1.jpg"],
    ["/media/art.jpg", "CON", "_CON.jpg"],
    ["/media/art.jpg", "aux.png", "_aux.jpg"],
    ["/media/art.jpg", "NUL.tar.gz", "_NUL.tar.gz.jpg"],
    ["/media/art.jpg", "阿狸.v2", "阿狸.v2.jpg"],
    ["/media/art.jpg", "原画.2026", "原画.2026.jpg"],
    ["/media/art.jpg", "CON .tar.jpg", "_CON .tar.jpg"],
    ["/media/art.jpg", "con artist", "con artist.jpg"],
    ["/media/art.jpg", "COM10", "COM10.jpg"],
    ["/media/art.jpg", "<>:*?", "media.jpg"],
    ["/media/art.jpg", "..", "media.jpg"],
    ["/media/art.jpg", "   ", "art.jpg"],
    ["", undefined, "media"],
    ["", "合成图.png", "合成图.png"],
  ])("resolves %s and %s to %s", (url, filename, expected) => {
    expect(mediaDownloadFilename(url, filename)).toBe(expected);
  });

  it.each(["CON", "PRN", "AUX", "NUL", ...Array.from({ length: 9 }, (_, i) => `COM${i + 1}`), ...Array.from({ length: 9 }, (_, i) => `LPT${i + 1}`)])("protects the reserved device name %s with or without an extension", (name) => {
    expect(mediaDownloadFilename("/image.png", name.toLowerCase())).toBe(`_${name.toLowerCase()}.png`);
    expect(mediaDownloadFilename("/clip.webm", `${name}.webm`)).toBe(`_${name}.webm`);
  });

  it("limits Chinese names by UTF-8 bytes while preserving the source extension", () => {
    const filename = mediaDownloadFilename("/art.jpg", "原".repeat(200));
    expect(filename).toBe(`${"原".repeat(78)}.jpg`);
    expect(new TextEncoder().encode(filename).length).toBeLessThanOrEqual(240);
  });

  it("does not split emoji when shortening names and keeps the video extension", () => {
    const filename = mediaDownloadFilename("/clip.webm", `${"🎨".repeat(100)}.mp4`);
    expect(filename).toBe(`${"🎨".repeat(58)}.webm`);
    expect(new TextEncoder().encode(filename).length).toBeLessThanOrEqual(240);
  });

  it("leaves the extension intact when shortening an ASCII name", () => {
    expect(mediaDownloadFilename("/art.jpeg", `${"a".repeat(400)}.png`)).toBe(`${"a".repeat(235)}.jpeg`);
  });

  it("keeps resolved names stable when saving an already named blob", () => {
    const filename = mediaDownloadFilename("/clip.webm", `${"阿狸".repeat(100)}.mp4`);
    expect(mediaDownloadFilename("", filename)).toBe(filename);
  });
});
