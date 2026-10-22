import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const globalStyles = read("../src/styles/global.css");
const cardStyles = read("../src/components/Card.astro");
const alertStyles = read("../src/components/Alert.astro");
const tokens = read("../src/styles/tokens.css");

function rule(source: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const declarations = source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1];
  expect(declarations, `missing CSS rule: ${selector}`).toBeDefined();
  return declarations ?? "";
}

function expectDeclarations(source: string, selector: string, expected: Record<string, string>): void {
  const declarations = rule(source, selector);
  for (const [property, value] of Object.entries(expected)) {
    expect(declarations, `${selector} ${property}`).toMatch(
      new RegExp(`${property}\\s*:\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:;|\\s|$)`),
    );
  }
}

describe("shared component typography contract", () => {
  it("defines the Antdv Next type scale as shared tokens", () => {
    for (const [name, size, height] of [
      ["display", 38, 46],
      ["headline-lg", 30, 38],
      ["headline-md", 24, 32],
      ["headline-sm", 20, 28],
      ["title", 16, 24],
      ["body", 14, 22],
      ["small", 12, 20],
      ["code", 13, 20],
    ]) {
      expect(tokens).toContain(`--font-size-${name}: ${size}px;`);
      expect(tokens).toContain(`--line-height-${name}: ${height}px;`);
    }
  });

  it("maps shared controls and supporting text to the body and title roles", () => {
    const body = { "font-size": "var(--font-size-body)", "line-height": "var(--line-height-body)" };
    const title = { "font-size": "var(--font-size-title)", "line-height": "var(--line-height-title)" };
    for (const selector of [".cn-input", ".ant-select", ".ant-select-item", ".ant-tooltip", ".cn-pagination-link"]) {
      expectDeclarations(globalStyles, selector, body);
    }
    expectDeclarations(globalStyles, ".ant-tree-title", { "line-height": "var(--line-height-body)" });
    expectDeclarations(globalStyles, ".ant-select-lg", title);
    expectDeclarations(globalStyles, ".ant-btn-sm", { "font-size": "var(--font-size-body)" });
    expectDeclarations(globalStyles, ".ant-btn-lg", { "font-size": "var(--font-size-title)" });
    expectDeclarations(globalStyles, ".ant-image-preview-count", body);
  });

  it("maps Card, Alert, and Typography titles to their documented roles", () => {
    expectDeclarations(cardStyles, ".card__title", {
      "font-size": "var(--font-size-title)",
      "line-height": "var(--line-height-title)",
      "font-weight": "600",
    });
    expectDeclarations(cardStyles, ".card--small .card__title", {
      "font-size": "var(--font-size-body)",
      "line-height": "var(--line-height-body)",
    });
    expectDeclarations(cardStyles, ".card__tab", {
      "font-size": "var(--font-size-body)",
      "line-height": "var(--line-height-body)",
    });
    expectDeclarations(alertStyles, ".alert__title", {
      "font-size": "var(--font-size-body)",
      "line-height": "var(--line-height-body)",
    });
    expectDeclarations(alertStyles, ".alert--with-description .alert__title", {
      "font-size": "var(--font-size-title)",
      "line-height": "var(--line-height-title)",
    });
    for (const [level, size, height] of [
      [1, "display", "display"],
      [2, "headline-lg", "headline-lg"],
      [3, "headline-md", "headline-md"],
      [4, "headline-sm", "headline-sm"],
      [5, "title", "title"],
    ]) {
      expectDeclarations(globalStyles, `h${level}.ant-typography-title-${level}`, {
        "font-size": `var(--font-size-${size})`,
        "line-height": `var(--line-height-${height})`,
      });
    }
  });
});
