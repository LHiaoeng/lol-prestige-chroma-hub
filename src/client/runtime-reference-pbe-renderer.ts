import type { CommunityDragonLocale } from "../domain/communitydragon-runtime";
import type {
  RuntimeEmoteTag,
  RuntimePbeAdditionsStream,
  RuntimePbeChroma,
  RuntimePbeModuleItems,
  RuntimePbeModuleKind,
} from "../domain/pbe-additions";
import {
  communityDragonChannelLabel,
  communityDragonVersionMetadataUrl,
} from "../domain/communitydragon-url";
import type { RuntimeSkinReferenceItem } from "../domain/skin-reference-projection";
import {
  appendChromaColorCircle,
  appendMedia,
  appendMissingField,
  appendRarity,
  hrefFor,
  linkWithNavigation,
  runtimeMissingLabel,
  setRuntimeNoindex,
  textNode,
} from "./runtime-reference-view-shared";
import { createChromaCard } from "../components/chroma-card/chroma-card";
import type { RuntimeControllerLike } from "./runtime-reference-view";

function createPbeVersionItem(
  locale: CommunityDragonLocale,
  channel: "pbe" | "latest",
): { readonly item: HTMLDivElement; readonly link: HTMLAnchorElement } {
  const item = document.createElement("div");
  item.className = "runtime-pbe-version";
  item.appendChild(
    textNode("dt", communityDragonChannelLabel(channel, locale)),
  );
  const value = document.createElement("dd");
  const link = document.createElement("a");
  link.href = communityDragonVersionMetadataUrl(channel);
  link.textContent =
    locale === "zh_cn" ? "版本加载中…" : "Loading version…";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  value.appendChild(link);
  item.appendChild(value);
  return { item, link };
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
  const nameLabel = textNode("span", name);
  if (!item.name) nameLabel.classList.add("runtime-missing");
  meta.appendChild(nameLabel);
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

export function appendPbeChromaCard(
  parent: HTMLElement,
  item: RuntimePbeChroma,
  locale: CommunityDragonLocale,
  controller: RuntimeControllerLike,
): void {
  const name = item.name ?? runtimeMissingLabel(locale, "name");
  const link = linkWithNavigation(
    "",
    hrefFor(
      locale,
      "skins",
      { id: item.skinId, championId: item.championId, channel: "pbe" },
      "detail",
      true,
    ),
    controller,
    "runtime-chroma-link",
  );
  const skinUrl = hrefFor(
    locale,
    "skins",
    { id: item.skinId, championId: item.championId, channel: "pbe" },
    "detail",
    true,
  );
  const ownerLink = linkWithNavigation(
    item.skinName ?? runtimeMissingLabel(locale, "name"),
    skinUrl,
    controller,
    "runtime-relation-link",
  );
  if (!item.skinName) ownerLink.classList.add("runtime-missing");
  const card = createChromaCard({
    name,
    nameMissing: !item.name,
    imageUrl: item.imageUrl,
    imageAlt: name,
    colors: item.colors,
    locale,
    missingKind: "artwork",
    link,
    ownerLink,
  });
  parent.appendChild(card);
}

export function appendPbeMediaCard(
  parent: HTMLElement,
  options: {
    readonly name?: string;
    readonly iconUrl?: string;
    readonly tags?: readonly RuntimeEmoteTag[];
    readonly locale: CommunityDragonLocale;
    readonly controller: RuntimeControllerLike;
  },
): void {
  const card = document.createElement("article");
  card.className = "runtime-pbe-card";
  const name = options.name ?? runtimeMissingLabel(options.locale, "name");
  const media = document.createElement("div");
  media.className = "runtime-pbe-card-media";
  if (options.iconUrl) appendMedia(media, options.iconUrl, name);
  else appendMissingField(media, options.locale, "portrait");
  card.appendChild(media);
  const nameLabel = textNode("span", name, "runtime-pbe-card-name");
  if (!options.name) nameLabel.classList.add("runtime-missing");
  card.appendChild(nameLabel);
  if (options.tags?.length) {
    const relations = document.createElement("div");
    relations.className = "runtime-pbe-card-relations";
    options.tags.forEach((tag) => {
      const link = linkWithNavigation(
        tag.name ?? runtimeMissingLabel(options.locale, "name"),
        hrefFor(
          options.locale,
          "champions",
          { id: tag.id, channel: "pbe" },
          "detail",
          true,
        ),
        options.controller,
        "runtime-relation-link",
      );
      if (!tag.name) link.classList.add("runtime-missing");
      relations.appendChild(link);
    });
    card.appendChild(relations);
  }
  parent.appendChild(card);
}

type PbeModuleText = Record<
  RuntimePbeModuleKind,
  { readonly title: string; readonly empty: string; readonly label: string }
>;

function renderModuleItems(
  grid: HTMLElement,
  result: RuntimePbeModuleItems,
  locale: CommunityDragonLocale,
  controller: RuntimeControllerLike,
): void {
  switch (result.kind) {
    case "champions":
      result.items.forEach((item) => {
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
      });
      return;
    case "skins":
      result.items.forEach((item) => appendPbeSkinCard(grid, item, locale, controller));
      return;
    case "skinlines":
      result.items.forEach((item) => {
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
      });
      return;
    case "universes":
      result.items.forEach(({ universe, skinlines }) => {
        const card = document.createElement("article");
        card.className = "runtime-pbe-card";
        card.appendChild(
          linkWithNavigation(
            universe.name,
            hrefFor(locale, "universes", { id: universe.id, channel: "pbe" }, "detail", true),
            controller,
            "runtime-pbe-card-link runtime-pbe-text-link",
          ),
        );
        if (skinlines.length) {
          const relations = document.createElement("div");
          relations.className = "runtime-pbe-card-relations";
          skinlines.forEach(({ id, name }) => {
            relations.appendChild(
              linkWithNavigation(
                name,
                hrefFor(locale, "skinlines", { id, channel: "pbe" }, "detail", true),
                controller,
                "runtime-relation-link",
              ),
            );
          });
          card.appendChild(relations);
        }
        grid.appendChild(card);
      });
      return;
    case "icons":
      result.items.forEach((item) =>
        appendPbeMediaCard(grid, {
          name: item.title,
          iconUrl: item.iconUrl,
          locale,
          controller,
        }),
      );
      return;
    case "emotes":
      result.items.forEach((item) =>
        appendPbeMediaCard(grid, {
          name: item.name,
          iconUrl: item.iconUrl,
          tags: item.tags,
          locale,
          controller,
        }),
      );
      return;
    case "chromas":
      result.items.forEach((item) =>
        appendPbeChromaCard(grid, item, locale, controller),
      );
      return;
    case "borders":
    case "wards":
    case "finishers":
      result.items.forEach((item) =>
        appendPbeMediaCard(grid, {
          name: item.name,
          iconUrl: item.iconUrl,
          locale,
          controller,
        }),
      );
      return;
  }
}

function createSkeletonCard(): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "runtime-skeleton-card";
  card.setAttribute("aria-hidden", "true");
  return card;
}

function fillWithSkeleton(grid: HTMLElement): void {
  grid.replaceChildren();
  for (let index = 0; index < 6; index += 1) grid.appendChild(createSkeletonCard());
}

const EXPAND_SVG =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';

function measurePbeRowHeight(grid: HTMLElement): number {
  const card = grid.querySelector<HTMLElement>(
    ".runtime-pbe-card, .runtime-chroma-card",
  );
  const height = card ? card.offsetHeight : 0;
  if (height) grid.style.setProperty("--pbe-row-height", `${height}px`);
  return height || 280;
}

function applyCollapsible(
  grid: HTMLElement,
  locale: CommunityDragonLocale,
): void {
  grid.classList.remove("has-overflow");
  grid.removeAttribute("data-expanded");
  const section = grid.parentElement;
  section?.querySelector(".runtime-pbe-expand")?.remove();
  if (!section) return;

  const rowHeight = measurePbeRowHeight(grid);
  const twoRowThreshold = rowHeight * 2 + 14 + 84;
  if (grid.scrollHeight <= twoRowThreshold) return;

  grid.classList.add("has-overflow");
  grid.dataset.expanded = "false";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "runtime-pbe-expand";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute(
    "aria-label",
    locale === "zh_cn" ? "展开全部" : "Expand all",
  );
  button.innerHTML = EXPAND_SVG;
  button.addEventListener("click", () => {
    const expanded = grid.dataset.expanded === "true";
    grid.dataset.expanded = expanded ? "false" : "true";
    button.setAttribute("aria-expanded", String(!expanded));
    button.classList.toggle("is-open", !expanded);
  });
  section.appendChild(button);

  if (!grid.dataset.collapsibleInited) {
    grid.dataset.collapsibleInited = "true";
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => measurePbeRowHeight(grid)).observe(grid);
    }
  }
}

export interface RuntimePbeRendererOptions {
  readonly content: HTMLElement;
  readonly status: HTMLElement;
  readonly locale: CommunityDragonLocale;
  readonly getController: () => RuntimeControllerLike;
}

export function createRuntimePbeRenderer(
  options: RuntimePbeRendererOptions,
): { render(stream: RuntimePbeAdditionsStream): void } {
  const { locale } = options;
  const moduleText: PbeModuleText = locale === "zh_cn"
    ? {
        champions: { title: "新增英雄", empty: "没有新增英雄。", label: "英雄" },
        skins: { title: "新增皮肤", empty: "没有新增皮肤。", label: "皮肤" },
        skinlines: { title: "新增皮肤系列", empty: "没有新增皮肤系列。", label: "皮肤系列" },
        universes: { title: "新增皮肤宇宙", empty: "没有新增皮肤宇宙。", label: "皮肤宇宙" },
        icons: { title: "新增图标", empty: "没有新增图标。", label: "图标" },
        emotes: { title: "新增表情", empty: "没有新增表情。", label: "表情" },
        chromas: { title: "新增炫彩", empty: "没有新增炫彩。", label: "炫彩" },
        borders: { title: "新增皮肤边框", empty: "没有新增皮肤边框。", label: "边框" },
        wards: { title: "新增守卫皮肤", empty: "没有新增守卫皮肤。", label: "守卫皮肤" },
        finishers: { title: "新增终结特效", empty: "没有新增终结特效。", label: "终结特效" },
      }
    : {
        champions: { title: "New champions", empty: "No new champions.", label: "Champions" },
        skins: { title: "New skins", empty: "No new skins.", label: "Skins" },
        skinlines: { title: "New skinlines", empty: "No new skinlines.", label: "Skinlines" },
        universes: { title: "New universes", empty: "No new universes.", label: "Universes" },
        icons: { title: "New icons", empty: "No new icons.", label: "Icons" },
        emotes: { title: "New emotes", empty: "No new emotes.", label: "Emotes" },
        chromas: { title: "New chromas", empty: "No new chromas.", label: "Chromas" },
        borders: { title: "New borders", empty: "No new borders.", label: "Borders" },
        wards: { title: "New ward skins", empty: "No new ward skins.", label: "Ward skins" },
        finishers: {
          title: "New nexus finishers",
          empty: "No new nexus finishers.",
          label: "Nexus finishers",
        },
      };

  return {
    render(stream) {
      setRuntimeNoindex(false);
      const controller = options.getController();
      let disposed = stream.signal.aborted;
      stream.signal.addEventListener(
        "abort",
        () => {
          disposed = true;
        },
        { once: true },
      );

      const article = document.createElement("article");
      article.className = "runtime-pbe-additions";

      const versions = document.createElement("dl");
      versions.className = "runtime-pbe-versions";
      const versionLinks = (["pbe", "latest"] as const).map((channel) => {
        const { item, link } = createPbeVersionItem(locale, channel);
        versions.appendChild(item);
        return [channel, link] as const;
      });
      article.appendChild(versions);
      stream.versions
        .then((metadata) => {
          if (disposed) return;
          versionLinks.forEach(([channel, link]) => {
            const version = metadata[channel];
            if (version) link.textContent = version;
          });
        })
        .catch(() => {
          if (disposed) return;
          versionLinks.forEach(([, link]) => {
            link.textContent =
              locale === "zh_cn" ? "版本信息缺失" : "Version unavailable";
          });
        });

      const summary = document.createElement("div");
      summary.className = "runtime-pbe-summary";
      const totalLabel = locale === "zh_cn" ? "新增实体总数" : "Total new entities";
      const totalElement = textNode("strong", `${totalLabel}: …`);
      summary.appendChild(totalElement);
      const countElements = new Map<RuntimePbeModuleKind, HTMLSpanElement>();
      stream.modules.forEach((module) => {
        const countElement = textNode(
          "span",
          `${moduleText[module.kind].label}: …`,
        );
        countElements.set(module.kind, countElement);
        summary.appendChild(countElement);
      });
      article.appendChild(summary);

      let total = 0;
      let failures = 0;
      const pending = new Set(stream.modules.map((module) => module.kind));
      const refreshStatus = () => {
        if (disposed) return;
        if (pending.size > 0) {
          options.status.textContent = locale === "zh_cn"
            ? `正在比较 PBE 与正式服…（剩余 ${pending.size} 个分类）`
            : `Comparing PBE and Live… (${pending.size} categories remaining)`;
          return;
        }
        options.status.textContent = failures === 0
          ? locale === "zh_cn"
            ? `已比较 PBE 与正式服，发现 ${total} 个新增实体`
            : `Compared PBE and Live: ${total} new entities`
          : locale === "zh_cn"
            ? `已加载 ${total} 个新增实体，${failures} 个分类加载失败，可单独重试。`
            : `Loaded ${total} new entities; ${failures} categories failed and can be retried.`;
        totalElement.textContent = `${totalLabel}: ${total}`;
      };

      stream.modules.forEach((module) => {
        const text = moduleText[module.kind];
        const countElement = countElements.get(module.kind)!;
        const section = document.createElement("section");
        section.className = "runtime-pbe-section";
        const heading = textNode("h2", text.title);
        const grid = document.createElement("div");
        grid.className = "runtime-pbe-grid";
        section.append(heading, grid);
        article.appendChild(section);

        let counted = false;
        let failed = false;
        const settle = () => {
          pending.delete(module.kind);
          refreshStatus();
        };
        const showFailure = () => {
          heading.textContent =
            locale === "zh_cn"
              ? `${text.title}（加载失败）`
              : `${text.title} (failed)`;
          grid.replaceChildren();
          grid.appendChild(
            textNode(
              "p",
              locale === "zh_cn"
                ? "该分类加载失败，可重试。"
                : "This category failed to load and can be retried.",
              "runtime-empty-state",
            ),
          );
          const retry = document.createElement("button");
          retry.type = "button";
          retry.className = "runtime-retry";
          retry.textContent = locale === "zh_cn" ? "重试" : "Retry";
          retry.addEventListener(
            "click",
            () => {
              if (disposed) return;
              fillWithSkeleton(grid);
              attempt();
            },
            { once: true },
          );
          grid.appendChild(retry);
        };
        const attempt = () => {
          module.load().then(
            (result) => {
              if (disposed) return;
              heading.textContent = `${text.title} (${result.items.length})`;
              countElement.textContent = `${text.label}: ${result.items.length}`;
              grid.replaceChildren();
              if (result.items.length) {
                renderModuleItems(grid, result, locale, controller);
                applyCollapsible(grid, locale);
              } else {
                grid.appendChild(textNode("p", text.empty, "runtime-empty-state"));
              }
              if (!counted) {
                counted = true;
                total += result.items.length;
              }
              if (failed) {
                failed = false;
                failures -= 1;
              }
              settle();
            },
            () => {
              if (disposed) return;
              if (!failed) {
                failed = true;
                failures += 1;
              }
              showFailure();
              settle();
            },
          );
        };
        fillWithSkeleton(grid);
        attempt();
      });

      options.content.replaceChildren(article);
      refreshStatus();
    },
  };
}
