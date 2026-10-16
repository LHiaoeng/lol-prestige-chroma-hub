export interface TitleOptions {
  readonly level?: 1 | 2 | 3 | 4 | 5;
  readonly text: string;
  readonly className?: string;
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
