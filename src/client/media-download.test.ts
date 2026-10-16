import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadMediaFile } from "./media-download";

const anchor = { href: "", download: "", hidden: false, click: vi.fn(), remove: vi.fn() };
const append = vi.fn();
const open = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.stubGlobal("document", { createElement: () => anchor, body: { append } });
  vi.stubGlobal("window", { open });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:media-download");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("media download", () => {
  it.each(["art.webp", "clip.webm"])("saves %s with its filename and releases the object URL", async (filename) => {
    const blob = new Blob(["media"]);
    const fetchFile = vi.fn().mockResolvedValue({ ok: true, blob: async () => blob });
    vi.stubGlobal("fetch", fetchFile);
    const url = `https://example.test/${filename}?version=2#media`;
    await downloadMediaFile(url);
    expect(fetchFile).toHaveBeenCalledExactlyOnceWith(url);
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(anchor.href).toBe("blob:media-download");
    expect(anchor.download).toBe(filename);
    expect(anchor.hidden).toBe(true);
    expect(append).toHaveBeenCalledWith(anchor);
    expect(anchor.click).toHaveBeenCalledOnce();
    expect(anchor.remove).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:media-download");
    expect(open).not.toHaveBeenCalled();
  });

  it.each(["network", "http"])("opens the source as a fallback on %s failure", async (failure) => {
    vi.stubGlobal("fetch", failure === "network"
      ? vi.fn().mockRejectedValue(new Error("Network error"))
      : vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await downloadMediaFile("https://example.test/clip.webm");
    expect(open).toHaveBeenCalledExactlyOnceWith("https://example.test/clip.webm", "_blank", "noopener,noreferrer");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(anchor.click).not.toHaveBeenCalled();
  });

  it("accepts a custom filename and applies the same system rules before saving", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["media"]) }));
    await downloadMediaFile("https://example.test/art.jpg", "CON.png");
    expect(anchor.download).toBe("_CON.jpg");
  });
});
