import { describe, expect, it } from "vitest";
import { createTftCosmeticSeo } from "./tft-cosmetics-seo";

describe("TFT cosmetics SEO", () => {
  it("provides canonical localized collection metadata for both catalogs", () => {
    const booms = createTftCosmeticSeo("en", "booms");
    const portals = createTftCosmeticSeo("zh-cn", "portals");

    expect(booms.title).toBe("Teamfight Tactics Booms | LoL Chroma Art");
    expect(booms.canonical).toBe("https://chromaart.lol/tft/booms/");
    expect(booms.jsonLd).toEqual(expect.arrayContaining([
      expect.objectContaining({ "@type": "CollectionPage", name: "Teamfight Tactics Booms", inLanguage: "en" }),
      expect.objectContaining({
        "@type": "BreadcrumbList",
        itemListElement: expect.arrayContaining([
          expect.objectContaining({ position: 3, name: "Booms", item: "https://chromaart.lol/tft/booms/" }),
        ]),
      }),
    ]));

    expect(portals.title).toBe("云顶之弈传送门 | LoL Chroma Art");
    expect(portals.canonical).toBe("https://chromaart.lol/zh-cn/tft/portals/");
    expect(portals.jsonLd).toEqual(expect.arrayContaining([
      expect.objectContaining({ "@type": "CollectionPage", name: "云顶之弈传送门", inLanguage: "zh-CN" }),
      expect.objectContaining({
        "@type": "BreadcrumbList",
        itemListElement: expect.arrayContaining([
          expect.objectContaining({ position: 3, name: "传送门", item: "https://chromaart.lol/zh-cn/tft/portals/" }),
        ]),
      }),
    ]));
  });
});
