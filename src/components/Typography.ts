export interface TitleOptions {
  readonly level?: 1 | 2 | 3 | 4 | 5;
  readonly text: string;
  readonly className?: string;
}

export interface ParagraphOptions {
  readonly text: string;
  readonly className?: string;
  readonly locale: "zh_cn" | "en_us";
}

const titleTagByLevel = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
} as const;

/**
 * Local DOM adaptation of Antdv Next Typography.Title.
 * @see https://github.com/antdv-next/antdv-next/blob/main/packages/antdv-next/src/typography/Title.tsx
 */
export function createTitle(options: TitleOptions): HTMLHeadingElement {
  const level = options.level ?? 1;
  const title = document.createElement(titleTagByLevel[level]);
  title.className = [
    "ant-typography",
    "ant-typography-title",
    `ant-typography-title-${level}`,
    options.className,
  ].filter(Boolean).join(" ");
  title.textContent = options.text;
  return title;
}

/** Local DOM adaptation of Antdv Next Typography.Paragraph with responsive ellipsis. */
export function createParagraph(options: ParagraphOptions): HTMLDivElement {
  const paragraph = document.createElement("div");
  paragraph.className = ["ant-typography", "ant-typography-paragraph", options.className]
    .filter(Boolean).join(" ");
  paragraph.dataset.typographyParagraph = "";
  const isZh = options.locale === "zh_cn";
  paragraph.dataset.expandLabel = isZh ? "展开" : "Expand";
  paragraph.dataset.collapseLabel = isZh ? "收起" : "Collapse";

  const content = document.createElement("span");
  content.className = "ant-typography-paragraph-content";
  const text = document.createElement("span");
  text.className = "ant-typography-paragraph-text";
  text.textContent = options.text;
  const ellipsis = document.createElement("span");
  ellipsis.className = "ant-typography-ellipsis";
  ellipsis.textContent = "...";
  ellipsis.hidden = true;
  ellipsis.setAttribute("aria-hidden", "true");
  const toggle = document.createElement("button");
  toggle.className = "ant-typography-expand";
  toggle.type = "button";
  toggle.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  toggle.dataset.typographyExpand = "";
  const actions = document.createElement("span");
  actions.className = "ant-typography-actions";
  actions.hidden = true;
  actions.append(ellipsis, toggle);
  content.append(text, actions);
  paragraph.append(content);
  return paragraph;
}

let resizeBound = false;

export function bindTypographyParagraphs(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-typography-paragraph]").forEach((paragraph) => {
    const content = paragraph.querySelector<HTMLElement>(".ant-typography-paragraph-content");
    const text = paragraph.querySelector<HTMLElement>(".ant-typography-paragraph-text");
    const actions = paragraph.querySelector<HTMLElement>(".ant-typography-actions");
    const ellipsis = paragraph.querySelector<HTMLElement>(".ant-typography-ellipsis");
    const toggle = paragraph.querySelector<HTMLButtonElement>("[data-typography-expand]");
    if (!content || !text || !actions || !ellipsis || !toggle) return;
    if (!toggle.dataset.bound) {
      toggle.dataset.bound = "true";
      toggle.addEventListener("click", () => {
        const expanded = paragraph.dataset.expanded !== "true";
        paragraph.dataset.expanded = String(expanded);
        toggle.setAttribute("aria-expanded", String(expanded));
        toggle.textContent = expanded
          ? paragraph.dataset.collapseLabel
          : paragraph.dataset.expandLabel;
        toggle.setAttribute("aria-label", toggle.textContent);
        ellipsis.hidden = expanded;
      });
    }

    const expanded = paragraph.dataset.expanded === "true";
    paragraph.removeAttribute("data-expanded");
    if (window.matchMedia?.("(max-width: 767px)").matches ?? window.innerWidth <= 767) {
      paragraph.dataset.ellipsis = "";
      const overflowing = text.scrollHeight > text.clientHeight + 1;
      paragraph.toggleAttribute("data-overflow", overflowing);
      paragraph.dataset.expanded = String(expanded && overflowing);
      actions.hidden = !overflowing;
      toggle.hidden = !overflowing;
      ellipsis.hidden = !overflowing || expanded;
      toggle.setAttribute("aria-expanded", String(expanded && overflowing));
      toggle.textContent = overflowing
        ? expanded ? paragraph.dataset.collapseLabel : paragraph.dataset.expandLabel
        : "";
      toggle.setAttribute("aria-label", toggle.textContent);
    } else {
      paragraph.removeAttribute("data-ellipsis");
      paragraph.removeAttribute("data-overflow");
      actions.hidden = true;
      toggle.hidden = true;
      ellipsis.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "";
    }
  });

  if (!resizeBound) {
    resizeBound = true;
    window.addEventListener("resize", () => bindTypographyParagraphs());
  }
}
