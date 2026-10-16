import "./border-beam.css";

export interface BorderBeamOptions {
  /** One independently colored beam per entry, evenly distributed around the host. */
  readonly colors?: readonly string[];
  readonly duration?: number;
}

/** Decorative border overlays; the host must provide position and border radius. */
export function createBorderBeams(options: BorderBeamOptions = {}): HTMLDivElement[] {
  if (options.duration !== undefined && (!Number.isFinite(options.duration) || options.duration <= 0))
    throw new RangeError("BorderBeam duration must be a positive finite number");
  if (options.colors && (!options.colors.length || options.colors.some((color) => !color.trim())))
    throw new RangeError("BorderBeam colors must contain at least one non-empty color");

  const colors = options.colors ?? [undefined];
  return colors.map((color, index) => {
    const beam = document.createElement("div");
    beam.className = "border-beam";
    beam.setAttribute("aria-hidden", "true");
    beam.style.setProperty("--border-beam-phase", String(index / colors.length));
    if (color !== undefined)
      beam.style.setProperty("--border-beam-gradient", `linear-gradient(to left, ${color} 0%, ${color} 70%, transparent)`);
    if (options.duration !== undefined)
      beam.style.setProperty("--border-beam-duration", `${options.duration}s`);
    return beam;
  });
}
