import type { RuntimeChannel } from "./communitydragon-runtime";

export type RuntimeUrlParameter = "id" | "champion" | "stage" | "channel";

export interface RuntimeUrlState {
  readonly id?: number;
  readonly champion?: number;
  readonly stage?: number;
  readonly channel?: RuntimeChannel;
  readonly channelExplicit: boolean;
  readonly invalid: readonly RuntimeUrlParameter[];
}

export interface RuntimeUrlStateInput {
  readonly id?: number;
  readonly champion?: number;
  readonly stage?: number;
  readonly channel?: RuntimeChannel;
  readonly channelExplicit?: boolean;
}

const positiveInteger = /^[1-9]\d*$/;
const parameterOrder: readonly RuntimeUrlParameter[] = [
  "id",
  "champion",
  "stage",
  "channel",
];

function readPositiveInteger(
  url: URL,
  key: Exclude<RuntimeUrlParameter, "channel">,
): { readonly value?: number; readonly invalid: boolean } {
  if (!url.searchParams.has(key)) return { invalid: false };
  const raw = url.searchParams.get(key);
  if (!raw || !positiveInteger.test(raw)) return { invalid: true };
  const value = Number(raw);
  return Number.isSafeInteger(value)
    ? { value, invalid: false }
    : { invalid: true };
}

export function readRuntimeUrlState(url: URL): RuntimeUrlState {
  const id = readPositiveInteger(url, "id");
  const champion = readPositiveInteger(url, "champion");
  const stage = readPositiveInteger(url, "stage");
  const rawChannel = url.searchParams.get("channel");
  const channel =
    rawChannel === null
      ? "pbe"
      : rawChannel === "latest"
        ? "latest"
        : rawChannel === "pbe"
          ? "pbe"
          : undefined;
  const invalid: RuntimeUrlParameter[] = [];
  if (id.invalid) invalid.push("id");
  if (champion.invalid) invalid.push("champion");
  if (stage.invalid) invalid.push("stage");
  if (rawChannel !== null && channel === undefined) invalid.push("channel");

  return {
    ...(id.value === undefined ? {} : { id: id.value }),
    ...(champion.value === undefined ? {} : { champion: champion.value }),
    ...(stage.value === undefined ? {} : { stage: stage.value }),
    channel,
    channelExplicit: channel !== undefined && rawChannel !== null,
    invalid,
  };
}

export function isRuntimeEntityId(value: number | undefined): value is number {
  return value !== undefined && Number.isSafeInteger(value) && value > 0;
}

export function formatRuntimeUrl(
  url: URL,
  state: RuntimeUrlStateInput,
  include: readonly RuntimeUrlParameter[] = parameterOrder,
): URL {
  const next = new URL(url);
  const allowed = new Set(include);
  next.search = "";
  for (const key of parameterOrder) {
    if (!allowed.has(key)) continue;
    if (key === "channel") {
      const channel = "channel" in state ? state.channel : "pbe";
      if (channel === undefined) continue;
      if (channel === "latest" || (channel === "pbe" && state.channelExplicit))
        next.searchParams.set("channel", channel);
      continue;
    }
    const value = state[key];
    if (isRuntimeEntityId(value)) next.searchParams.set(key, String(value));
  }
  return next;
}
