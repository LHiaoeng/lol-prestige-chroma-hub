import type { CommunityDragonLocale } from "../domain/communitydragon-runtime";
import type {
  RuntimeEmoteTag,
  RuntimePbeAdditionsStream,
  RuntimePbeChroma,
  RuntimePbeModuleItems,
  RuntimePbeModuleKind,
} from "../domain/pbe-additions";
import type { RuntimeSkinReferenceItem } from "../domain/skin-reference-projection";
import {
  appendMedia,
  appendMissingField,
  appendSkinReferenceCard,
  hrefFor,
  linkWithNavigation,
  runtimeMissingLabel,
  setRuntimeNoindex,
  textNode,
} from "./runtime-reference-view-shared";
import { createChromaCard } from "../components/chroma-card/chroma-card";
import { createDivider } from "../components/Divider";
import { createDomainHeading, createDomainIcon, type DomainIconName } from "../components/domain-icons";
import { createIcon } from "../components/icons/create-icon";
import type { RuntimeControllerLike } from "./runtime-reference-view";

export function appendPbeSkinCard(
  parent: HTMLElement,
  item: RuntimeSkinReferenceItem,
  locale: CommunityDragonLocale,
  controller: RuntimeControllerLike,
): void {
  appendSkinReferenceCard(parent, item, locale, "pbe", controller, true);
}

export function appendPbeChromaCard(
  parent: HTMLElement,
  item: RuntimePbeChroma,
  locale: CommunityDragonLocale,
  controller: RuntimeControllerLike,
): void {
  const name = item.name ?? runtimeMissingLabel(locale, "name");
  const skinUrl = hrefFor(
    locale,
    "skins",
    { id: item.skinId, championId: item.championId, channel: "pbe" },
    "detail",
    true,
  );
  skinUrl.hash = "runtime-skin-chromas";
  const link = linkWithNavigation(
    "",
    skinUrl,
    controller,
    "runtime-chroma-link",
  );
  const card = createChromaCard({
    name,
    nameMissing: !item.name,
    imageUrl: item.imageUrl,
    imageAlt: name,
    colors: item.colors,
    locale,
    missingKind: "artwork",
    link,
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

const pbeModuleIcons: Record<RuntimePbeModuleKind, DomainIconName> = {
  champions: "champions",
  skins: "skins",
  skinlines: "skinlines",
  universes: "universes",
  icons: "pbe-additions",
  emotes: "pbe-additions",
  chromas: "prestige-chromas",
  borders: "skins",
  wards: "skins",
  finishers: "pbe-additions",
};
const pbeModuleGroups: readonly (readonly RuntimePbeModuleKind[])[] = [
  ["champions"], ["skins", "chromas"], ["skinlines"], ["universes"],
  ["icons"], ["emotes"], ["borders"], ["wards"], ["finishers"],
];
const pbeModuleOrder = pbeModuleGroups.flat();

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

function createSkeletonCard(kind: RuntimePbeModuleKind): HTMLDivElement {
  const card = document.createElement("div");
  const textOnly = kind === "skinlines" || kind === "universes";
  card.className = textOnly
    ? "runtime-skeleton-card runtime-skeleton-card--pbe-text"
    : "runtime-skeleton-card runtime-skeleton-card--skin runtime-skeleton-card--pbe-media";
  card.setAttribute("aria-hidden", "true");
  if (!textOnly) {
    const media = document.createElement("div");
    media.className = "runtime-skeleton-media";
    card.appendChild(media);
  }
  const meta = document.createElement("div");
  meta.className = textOnly ? "runtime-skeleton-line runtime-skeleton-line--title" : "runtime-skeleton-meta";
  if (!textOnly) {
    const title = document.createElement("span");
    title.className = "runtime-skeleton-line runtime-skeleton-line--title";
    meta.appendChild(title);
  }
  card.appendChild(meta);
  if (!textOnly) {
    const owner = document.createElement("div");
    owner.className = "runtime-skeleton-pbe-owner";
    const line = document.createElement("span");
    line.className = "runtime-skeleton-line runtime-skeleton-line--secondary";
    owner.appendChild(line);
    card.appendChild(owner);
  }
  return card;
}

function fillWithSkeleton(grid: HTMLElement, kind: RuntimePbeModuleKind): void {
  grid.replaceChildren();
  for (let index = 0; index < 6; index += 1) grid.appendChild(createSkeletonCard(kind));
}

function measurePbeTwoRowHeight(grid: HTMLElement): number {
  const gridTop = grid.getBoundingClientRect().top;
  const rowBottoms = new Map<number, number>();
  grid
    .querySelectorAll<HTMLElement>(
      ".runtime-pbe-card, .runtime-chroma-card, .runtime-skin-reference-card",
    )
    .forEach((card) => {
      const rect = card.getBoundingClientRect();
      const top = Math.round(rect.top - gridTop);
      rowBottoms.set(top, Math.max(rowBottoms.get(top) ?? 0, rect.bottom - gridTop));
    });
  const rows = [...rowBottoms.values()];
  const height = rows[1] ?? (rows.length === 1 ? rows[0] : 0);
  if (height) grid.style.setProperty("--pbe-two-row-height", `${height}px`);
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

  const twoRowHeight = measurePbeTwoRowHeight(grid);
  if (grid.scrollHeight <= twoRowHeight + 84) return;

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
  button.title = locale === "zh_cn" ? "展开全部" : "Expand all";
  button.append(createIcon("DownOutlined"));
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
      new ResizeObserver(() => measurePbeTwoRowHeight(grid)).observe(grid);
    }
  }
}

export interface RuntimePbeRendererOptions {
  readonly content: HTMLElement;
  readonly summary: HTMLElement | null;
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
      if (!options.summary) throw new Error("PBE summary slot is missing");
      setRuntimeNoindex(false);
      const controller = options.getController();
      const modules = [...stream.modules].sort(
        (left, right) => pbeModuleOrder.indexOf(left.kind) - pbeModuleOrder.indexOf(right.kind),
      );
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

      const summary = document.createElement("nav");
      summary.className = "runtime-pbe-summary";
      summary.setAttribute("aria-label", locale === "zh_cn" ? "PBE 新增摘要" : "PBE additions summary");
      const totalLabel = locale === "zh_cn" ? "新增实体总数" : "Total new entities";
      const totalElement = textNode("strong", `${totalLabel}: …`);
      summary.appendChild(totalElement);
      const countElements = new Map<RuntimePbeModuleKind, HTMLSpanElement>();
      const summaryLinks = new Map<RuntimePbeModuleKind, HTMLAnchorElement>();
      modules.forEach((module) => {
        const link = document.createElement("a");
        link.className = "runtime-pbe-summary-link";
        link.href = `#runtime-pbe-${module.kind}`;
        link.appendChild(createDomainIcon(pbeModuleIcons[module.kind]));
        const countElement = textNode(
          "span",
          `${moduleText[module.kind].label}: …`,
        );
        countElements.set(module.kind, countElement);
        summaryLinks.set(module.kind, link);
        link.appendChild(countElement);
        summary.appendChild(createDivider({ type: "vertical" }));
        summary.appendChild(link);
      });
      options.summary.removeAttribute("hidden");
      options.summary.replaceChildren(summary);

      let total = 0;
      let failures = 0;
      const pending = new Set(modules.map((module) => module.kind));
      const moduleCounts = new Map<RuntimePbeModuleKind, number>();
      const sections = new Map<RuntimePbeModuleKind, HTMLElement>();
      const reorderContent = () => {
        const ordered = pbeModuleGroups
          .map((group) => modules.filter((module) => group.includes(module.kind)))
          .filter((group) => group.length > 0)
          .sort((left, right) => {
            const groupRank = (group: readonly { readonly kind: RuntimePbeModuleKind }[]) =>
              group.some((module) => (moduleCounts.get(module.kind) ?? 0) > 0)
                ? 0
                : group.some((module) => !moduleCounts.has(module.kind))
                  ? 1
                  : 2;
            return groupRank(left) - groupRank(right);
          })
          .flat();
        summary.replaceChildren(totalElement);
        article.replaceChildren();
        ordered.forEach((module, index) => {
          if (index > 0) {
            summary.appendChild(createDivider({ type: "vertical" }));
            article.appendChild(createDivider({ dashed: true, className: "runtime-pbe-divider" }));
          }
          summary.appendChild(summaryLinks.get(module.kind)!);
          article.appendChild(sections.get(module.kind)!);
        });
      };
      const refreshStatus = () => {
        if (disposed) return;
        if (pending.size > 0) {
          options.status.textContent = locale === "zh_cn"
            ? `正在比较 PBE 与正式服…（剩余 ${pending.size} 个分类）`
            : `Comparing PBE and Live… (${pending.size} categories remaining)`;
          return;
        }
        options.status.textContent = failures === 0
          ? ""
          : locale === "zh_cn"
            ? `已加载 ${total} 个新增实体，${failures} 个分类加载失败，可单独重试。`
            : `Loaded ${total} new entities; ${failures} categories failed and can be retried.`;
        totalElement.textContent = `${totalLabel}: ${total}`;
        reorderContent();
      };

      modules.forEach((module, index) => {
        const text = moduleText[module.kind];
        const countElement = countElements.get(module.kind)!;
        const section = document.createElement("section");
        section.className = "runtime-pbe-section";
        section.id = `runtime-pbe-${module.kind}`;
        const headingLabel = textNode("span", text.title);
        const heading = createDomainHeading(pbeModuleIcons[module.kind], headingLabel);
        const grid = document.createElement("div");
        grid.className = "runtime-pbe-grid";
        section.append(heading, grid);
        sections.set(module.kind, section);
        if (index > 0) article.appendChild(createDivider({ dashed: true, className: "runtime-pbe-divider" }));
        article.appendChild(section);

        let counted = false;
        let failed = false;
        const settle = () => {
          pending.delete(module.kind);
          refreshStatus();
        };
        const showFailure = () => {
          countElement.textContent = locale === "zh_cn" ? `${text.label}: 加载失败` : `${text.label}: failed`;
          headingLabel.textContent =
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
              pending.add(module.kind);
              refreshStatus();
              countElement.textContent = `${text.label}: …`;
              fillWithSkeleton(grid, module.kind);
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
              moduleCounts.set(module.kind, result.items.length);
              headingLabel.textContent = `${text.title} (${result.items.length})`;
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
        fillWithSkeleton(grid, module.kind);
        attempt();
      });

      options.content.replaceChildren(article);
      refreshStatus();
    },
  };
}
