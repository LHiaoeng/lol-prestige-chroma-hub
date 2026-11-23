import { localeConfig, localizedPath, type Locale } from "../i18n/config";
import { SITE } from "./site";
import type { TftCosmeticCatalog } from "../domain/tft-cosmetics";

const catalogLabels = {
  booms: { zh: "进攻特效", en: "Booms" },
  portals: { zh: "传送门", en: "Portals" },
} as const;

export function createTftCosmeticSeo(locale: Locale, catalog: TftCosmeticCatalog) {
  const isZh = locale === "zh-cn";
  const title = catalogLabels[catalog][isZh ? "zh" : "en"];
  const name = isZh ? "云顶之弈" + title : "Teamfight Tactics " + title;
  const description = isZh
    ? "浏览" + name + "，按名称、稀有度和功能标签查找。"
    : "Browse Teamfight Tactics " + title.toLowerCase() + " by name, cosmetic tier, and feature.";
  const path = "/tft/" + catalog + "/";
  const canonical = new URL(localizedPath(locale, path), SITE.origin).toString();
  const homeUrl = new URL(localizedPath(locale, "/"), SITE.origin).toString();
  const tftUrl = "https://teamfighttactics.leagueoflegends.com/en-us/index/";

  return {
    title: name + " | " + SITE.name,
    description,
    canonical,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name,
        description,
        url: canonical,
        inLanguage: localeConfig[locale].htmlLang,
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: isZh ? "首页" : "Home", item: homeUrl },
          { "@type": "ListItem", position: 2, name: isZh ? "云顶之弈" : "Teamfight Tactics", item: tftUrl },
          { "@type": "ListItem", position: 3, name: title, item: canonical },
        ],
      },
    ],
  };
}
