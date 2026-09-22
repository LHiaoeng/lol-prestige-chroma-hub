import type { CommunityDragonLocale } from "../domain/communitydragon-runtime";
import type { RuntimePbeAdditions } from "../domain/pbe-additions";
import {
  communityDragonChannelLabel,
  communityDragonVersionMetadataUrl,
} from "../domain/communitydragon-url";
import type { RuntimeSkinReferenceItem } from "../domain/skin-reference-projection";
import {
  appendMedia,
  appendMissingField,
  appendRarity,
  hrefFor,
  linkWithNavigation,
  runtimeMissingLabel,
  setRuntimeNoindex,
  textNode,
} from "./runtime-reference-view-shared";
import type { RuntimeControllerLike } from "./runtime-reference-view";

export function appendPbeVersion(
  parent: HTMLElement,
  locale: CommunityDragonLocale,
  channel: "pbe" | "latest",
  version: string | undefined,
): void {
  const item = document.createElement("div");
  item.className = "runtime-pbe-version";
  item.appendChild(
    textNode("dt", communityDragonChannelLabel(channel, locale)),
  );
  const value = document.createElement("dd");
  const link = document.createElement("a");
  link.href = communityDragonVersionMetadataUrl(channel);
  link.textContent =
    version ??
    (locale === "zh_cn" ? "版本信息缺失" : "Version unavailable");
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  value.appendChild(link);
  item.appendChild(value);
  parent.appendChild(item);
}
export function appendPbeSkinCard(
  parent: HTMLElement,
  item: RuntimeSkinReferenceItem,
  locale: CommunityDragonLocale,
  controller: RuntimeControllerLike,
): void {
  const card = document.createElement("article");
  card.className = "runtime-pbe-card runtime-pbe-skin-card";
  const name = item.name ?? runtimeMissingLabel(locale, "name");
  const link = linkWithNavigation(
    "",
    hrefFor(
      locale,
      "skins",
      {
        id: item.skinId,
        championId: item.championId,
        stageId: item.stageId,
        channel: "pbe",
      },
      "detail",
      true,
    ),
    controller,
    "runtime-pbe-card-link",
  );
  link.setAttribute("aria-label", name);
  if (item.thumbnailUrl) appendMedia(link, item.thumbnailUrl, name);
  else appendMissingField(link, locale, "thumbnail");
  const meta = document.createElement("span");
  meta.className = "runtime-pbe-card-meta";
  meta.appendChild(textNode("span", name));
  appendRarity(meta, item.rarity);
  link.appendChild(meta);
  card.appendChild(link);

  const owner = document.createElement("p");
  owner.className = "runtime-pbe-card-owner";
  owner.appendChild(
    textNode("span", locale === "zh_cn" ? "所属英雄：" : "Champion: "),
  );
  owner.appendChild(
    (() => {
      const link = linkWithNavigation(
        item.championName ?? runtimeMissingLabel(locale, "name"),
        hrefFor(
          locale,
          "champions",
          { id: item.championId, channel: "pbe" },
          "detail",
          true,
        ),
        controller,
        "runtime-relation-link",
      );
      if (!item.championName) link.classList.add("runtime-missing");
      return link;
    })(),
  );
  card.appendChild(owner);
  parent.appendChild(card);
}

export function appendPbeAdditions(
  parent: HTMLElement,
  additions: RuntimePbeAdditions,
  locale: CommunityDragonLocale,
  controller: RuntimeControllerLike,
): void {
  const versions = document.createElement("dl");
  versions.className = "runtime-pbe-versions";
  appendPbeVersion(versions, locale, "pbe", additions.versions.pbe);
  appendPbeVersion(versions, locale, "latest", additions.versions.latest);
  parent.appendChild(versions);

  const summary = document.createElement("div");
  summary.className = "runtime-pbe-summary";
  const totalLabel = locale === "zh_cn" ? "新增实体总数" : "Total new entities";
  summary.appendChild(textNode("strong", `${totalLabel}: ${additions.total}`));
  const countItems = locale === "zh_cn"
    ? [
        ["英雄", additions.counts.champions],
        ["皮肤", additions.counts.skins],
        ["皮肤系列", additions.counts.skinlines],
        ["皮肤宇宙", additions.counts.universes],
      ]
    : [
        ["Champions", additions.counts.champions],
        ["Skins", additions.counts.skins],
        ["Skinlines", additions.counts.skinlines],
        ["Universes", additions.counts.universes],
      ];
  countItems.forEach(([label, count]) =>
    summary.appendChild(textNode("span", `${label}: ${count}`)),
  );
  parent.appendChild(summary);

  const skinlineNames = new Map<number, string>(
    additions.pbeSkinlines.map(
      (skinline) => [skinline.id, skinline.name] as const,
    ),
  );
  const sections: readonly {
    readonly title: string;
    readonly count: number;
    readonly empty: string;
    readonly render: (grid: HTMLElement) => void;
  }[] = [
    {
      title: locale === "zh_cn" ? "新增英雄" : "New champions",
      count: additions.counts.champions,
      empty: locale === "zh_cn" ? "没有新增英雄。" : "No new champions.",
      render: (grid) =>
        additions.champions.forEach((item) => {
          const card = document.createElement("article");
          card.className = "runtime-pbe-card";
          const link = linkWithNavigation(
            "",
            hrefFor(locale, "champions", { id: item.id, channel: "pbe" }, "detail", true),
            controller,
            "runtime-pbe-card-link",
          );
          if (item.portraitUrl) appendMedia(link, item.portraitUrl, item.name, "runtime-champion-portrait");
          else appendMissingField(link, locale, "portrait");
          link.appendChild(textNode("span", item.name, "runtime-pbe-card-name"));
          card.appendChild(link);
          grid.appendChild(card);
        }),
    },
    {
      title: locale === "zh_cn" ? "新增皮肤" : "New skins",
      count: additions.counts.skins,
      empty: locale === "zh_cn" ? "没有新增皮肤。" : "No new skins.",
      render: (grid) => additions.skins.forEach((item) => appendPbeSkinCard(grid, item, locale, controller)),
    },
    {
      title: locale === "zh_cn" ? "新增皮肤系列" : "New skinlines",
      count: additions.counts.skinlines,
      empty: locale === "zh_cn" ? "没有新增皮肤系列。" : "No new skinlines.",
      render: (grid) =>
        additions.skinlines.forEach((item) => {
          const card = document.createElement("article");
          card.className = "runtime-pbe-card";
          card.appendChild(
            linkWithNavigation(
              item.name,
              hrefFor(locale, "skinlines", { id: item.id, channel: "pbe" }, "detail", true),
              controller,
              "runtime-pbe-card-link runtime-pbe-text-link",
            ),
          );
          grid.appendChild(card);
        }),
    },
    {
      title: locale === "zh_cn" ? "新增皮肤宇宙" : "New universes",
      count: additions.counts.universes,
      empty: locale === "zh_cn" ? "没有新增皮肤宇宙。" : "No new universes.",
      render: (grid) =>
        additions.universes.forEach((item) => {
          const card = document.createElement("article");
          card.className = "runtime-pbe-card";
          card.appendChild(
            linkWithNavigation(
              item.name,
              hrefFor(locale, "universes", { id: item.id, channel: "pbe" }, "detail", true),
              controller,
              "runtime-pbe-card-link runtime-pbe-text-link",
            ),
          );
          const relations = document.createElement("div");
          relations.className = "runtime-pbe-card-relations";
          item.skinlineIds.forEach((skinlineId) => {
            const name = skinlineNames.get(skinlineId);
            if (!name) return;
            relations.appendChild(
              linkWithNavigation(
                name,
                hrefFor(locale, "skinlines", { id: skinlineId, channel: "pbe" }, "detail", true),
                controller,
                "runtime-relation-link",
              ),
            );
          });
          if (relations.children.length) card.appendChild(relations);
          grid.appendChild(card);
        }),
    },
  ];

  sections.forEach((definition) => {
    const section = document.createElement("section");
    section.className = "runtime-pbe-section";
    section.appendChild(textNode("h2", `${definition.title} (${definition.count})`));
    if (!definition.count) {
      section.appendChild(textNode("p", definition.empty, "runtime-empty-state"));
    } else {
      const grid = document.createElement("div");
      grid.className = "runtime-pbe-grid";
      definition.render(grid);
      section.appendChild(grid);
    }
    parent.appendChild(section);
  });
}

export interface RuntimePbeRendererOptions {
  readonly content: HTMLElement;
  readonly status: HTMLElement;
  readonly locale: CommunityDragonLocale;
  readonly getController: () => RuntimeControllerLike;
}

export function createRuntimePbeRenderer(
  options: RuntimePbeRendererOptions,
): { render(additions: RuntimePbeAdditions): void } {
  return {
    render(additions) {
      setRuntimeNoindex(false);
      const article = document.createElement("article");
      article.className = "runtime-pbe-additions";
      appendPbeAdditions(
        article,
        additions,
        options.locale,
        options.getController(),
      );
      options.content.replaceChildren(article);
      options.status.textContent =
        options.locale === "zh_cn"
          ? `已比较 PBE 与正式服，发现 ${additions.total} 个新增实体`
          : `Compared PBE and Live: ${additions.total} new entities`;
    },
  };
}
