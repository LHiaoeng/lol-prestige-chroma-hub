import { describe, expect, it } from "vitest";
import { renderSitemap } from "./sitemap";

describe("SEO sitemap", () => {
  it("renders stable pages and runtime directory shells without runtime entities", () => {
    const xml = renderSitemap();
    expect(xml).toContain(
      'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
    );
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain("<loc>https://chromaart.lol/about/</loc>");
    expect(xml).toContain("<loc>https://chromaart.lol/privacy/</loc>");
    expect(xml).toContain("<loc>https://chromaart.lol/blog/</loc>");
    expect(xml).toContain("<loc>https://chromaart.lol/champions/</loc>");
    expect(xml).toContain("<loc>https://chromaart.lol/zh-cn/champions/</loc>");
    expect(xml).toContain("<loc>https://chromaart.lol/pbe-additions/</loc>");
    expect(xml).toContain(
      "<loc>https://chromaart.lol/zh-cn/pbe-additions/</loc>",
    );
    expect(xml).toContain(
      'hreflang="zh-CN" href="https://chromaart.lol/zh-cn/pbe-additions/"',
    );
    expect(xml).not.toContain("<loc>https://chromaart.lol/skins/</loc>");
    expect(xml).not.toContain("<loc>https://chromaart.lol/zh-cn/skins/</loc>");
    expect(xml).not.toContain("/champions/103/");
    expect(xml).not.toContain("/champions/ahri/");
    expect(xml).not.toContain("/skins/103001/");
    expect(xml).not.toContain("/skinlines/7/");
    expect(xml).not.toContain("/universes/1/");
    expect(xml).not.toContain("/chromas/ahri-cat-eye-1/");
    expect(xml).toContain("<lastmod>2026-07-20</lastmod>");
  });
});
