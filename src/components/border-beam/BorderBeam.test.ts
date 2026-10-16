import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBorderBeams } from "./BorderBeam";

class TestBeam {
  className = "";
  readonly attributes = new Map<string, string>();
  readonly properties = new Map<string, string>();
  readonly style = {
    setProperty: (name: string, value: string) => this.properties.set(name, value),
    getPropertyValue: (name: string) => this.properties.get(name) ?? "",
  };
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
}

beforeEach(() => vi.stubGlobal("document", { createElement: () => new TestBeam() }));
afterEach(() => vi.unstubAllGlobals());

describe("createBorderBeams", () => {
  it("keeps a single decorative beam by default", () => {
    const beams = createBorderBeams();
    expect(beams).toHaveLength(1);
    expect(beams[0].getAttribute("aria-hidden")).toBe("true");
    expect(beams[0].style.getPropertyValue("--border-beam-phase")).toBe("0");
  });

  it("gives each color its own beam and distributes their phases evenly", () => {
    const colors = ["var(--gold)", "#2E38C4", "#C8003F"];
    const beams = createBorderBeams({ colors, duration: 9 });
    expect(beams).toHaveLength(3);
    expect(beams.map((beam) => Number(beam.style.getPropertyValue("--border-beam-phase"))))
      .toEqual([0, 1 / 3, 2 / 3]);
    beams.forEach((beam, index) => {
      expect(beam.getAttribute("aria-hidden")).toBe("true");
      expect(beam.style.getPropertyValue("--border-beam-duration")).toBe("9s");
      expect(beam.style.getPropertyValue("--border-beam-gradient"))
        .toBe(`linear-gradient(to left, ${colors[index]} 0%, ${colors[index]} 70%, transparent)`);
    });
  });

  it("rejects empty color lists and invalid animation durations", () => {
    expect(() => createBorderBeams({ colors: [] })).toThrow(RangeError);
    expect(() => createBorderBeams({ colors: [" "] })).toThrow(RangeError);
    for (const duration of [0, -1, NaN, Infinity])
      expect(() => createBorderBeams({ duration })).toThrow(RangeError);
  });
});
