import { describe, expect, it } from "vitest";
import { relatedRuntimeItems } from "./runtime-relations";

describe("relatedRuntimeItems", () => {
  it("filters skinline and universe relations by the entity IDs", () => {
    const skinline = {
      kind: "skinline" as const,
      id: 7,
      name: "Star Guardian",
      universeIds: [200],
    };
    expect(
      relatedRuntimeItems(skinline, { kind: "skinline", id: 7 }, [
        { kind: "universe", id: 200, name: "Star Guardian", skinlineIds: [7] },
        { kind: "universe", id: 201, name: "Other", skinlineIds: [] },
      ]),
    ).toHaveLength(1);
  });

  it("includes a skin universe when it shares a skinline", () => {
    const skin = {
      kind: "skin" as const,
      id: 103001,
      championId: 103,
      name: "Dynasty Ahri",
      isBase: false,
      skinlineIds: [7],
      universeIds: [],
      media: {},
      chromas: [],
      stages: [],
    };
    expect(
      relatedRuntimeItems(skin, { kind: "skin", id: 103001 }, [
        { kind: "universe", id: 200, name: "Star Guardian", skinlineIds: [7] },
      ]),
    ).toHaveLength(1);
  });
});
