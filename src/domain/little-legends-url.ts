import type { RuntimeChannel } from "./communitydragon-runtime";
import {
  isTftCompanionType,
  isTftCompanionRarity,
  isTftCompanionSort,
  type TftCompanionType,
  type TftCompanionRarity,
  type TftCompanionSort,
} from "./little-legends";

export type LittleLegendUrlParameter =
  | "q"
  | "companionType"
  | "speciesId"
  | "TFTRarity"
  | "level"
  | "sort"
  | "pbeOnly"
  | "channel";

export interface LittleLegendUrlState {
  readonly search: string;
  readonly companionType?: TftCompanionType;
  readonly speciesId?: number;
  readonly TFTRarity?: TftCompanionRarity;
  readonly level?: number;
  readonly sort: TftCompanionSort;
  readonly onlyPbeAdditions: boolean;
  readonly channel: RuntimeChannel;
  readonly channelExplicit: boolean;
  readonly invalid: readonly LittleLegendUrlParameter[];
}

export type LittleLegendUrlStateInput = Pick<
  LittleLegendUrlState,
  | "search"
  | "companionType"
  | "speciesId"
  | "TFTRarity"
  | "level"
  | "onlyPbeAdditions"
  | "channel"
> &
  Partial<Pick<LittleLegendUrlState, "channelExplicit" | "sort">>;

const positiveInteger = /^[1-9]\d*$/;
const nonNegativeInteger = /^(?:0|[1-9]\d*)$/;
function readPositiveInteger(
  url: URL,
  key: "speciesId" | "level",
): { readonly value?: number; readonly invalid: boolean } {
  if (!url.searchParams.has(key)) return { invalid: false };
  const values = url.searchParams.getAll(key);
  const pattern = key === "speciesId" ? nonNegativeInteger : positiveInteger;
  if (values.length !== 1 || !pattern.test(values[0])) return { invalid: true };
  const value = Number(values[0]);
  return Number.isSafeInteger(value)
    ? { value, invalid: false }
    : { invalid: true };
}

export function readLittleLegendUrlState(url: URL): LittleLegendUrlState {
  const speciesId = readPositiveInteger(url, "speciesId");
  const level = readPositiveInteger(url, "level");
  const rawSearch = url.searchParams.getAll("q");
  const rawCompanionType = url.searchParams.getAll("companionType");
  const rawRarity = url.searchParams.getAll("TFTRarity");
  const rawSort = url.searchParams.getAll("sort");
  const rawChannel = url.searchParams.getAll("channel");
  const rawPbeOnly = url.searchParams.getAll("pbeOnly");
  const rarity =
    rawRarity.length === 1 && isTftCompanionRarity(rawRarity[0])
      ? rawRarity[0]
      : undefined;
  const sort =
    rawSort.length === 1 && isTftCompanionSort(rawSort[0])
      ? rawSort[0]
      : "default";
  const companionType =
    rawCompanionType.length === 1 && isTftCompanionType(rawCompanionType[0])
      ? rawCompanionType[0]
      : undefined;
  const channel =
    rawChannel.length === 0
      ? "pbe"
      : rawChannel.length === 1 &&
          (rawChannel[0] === "pbe" || rawChannel[0] === "latest")
        ? rawChannel[0]
        : "pbe";
  const invalid: LittleLegendUrlParameter[] = [];
  if (rawSearch.length > 1) invalid.push("q");
  if (rawCompanionType.length > 0 && companionType === undefined)
    invalid.push("companionType");
  if (speciesId.invalid) invalid.push("speciesId");
  if (rawRarity.length > 0 && rarity === undefined) invalid.push("TFTRarity");
  if (rawSort.length > 0 && !(rawSort.length === 1 && isTftCompanionSort(rawSort[0])))
    invalid.push("sort");
  if (level.invalid) invalid.push("level");
  if (
    rawPbeOnly.length > 0 &&
    (rawPbeOnly.length !== 1 || rawPbeOnly[0] !== "1")
  )
    invalid.push("pbeOnly");
  if (
    rawChannel.length > 0 &&
    (rawChannel.length !== 1 || (channel === "pbe" && rawChannel[0] !== "pbe"))
  )
    invalid.push("channel");

  return {
    search: rawSearch.length === 1 ? rawSearch[0] : "",
    ...(companionType === undefined ? {} : { companionType }),
    ...(speciesId.value === undefined ? {} : { speciesId: speciesId.value }),
    ...(rarity === undefined ? {} : { TFTRarity: rarity }),
    ...(level.value === undefined ? {} : { level: level.value }),
    sort,
    onlyPbeAdditions: rawPbeOnly.length === 1 && rawPbeOnly[0] === "1",
    channel,
    channelExplicit: rawChannel.length === 1 && rawChannel[0] === channel,
    invalid,
  };
}

export function formatLittleLegendUrl(
  url: URL,
  state: LittleLegendUrlStateInput,
): URL {
  const next = new URL(url);
  next.search = "";
  const search = state.search.trim();
  if (search) next.searchParams.set("q", search);
  if (state.companionType && isTftCompanionType(state.companionType))
    next.searchParams.set("companionType", state.companionType);
  if (Number.isSafeInteger(state.speciesId) && (state.speciesId ?? -1) >= 0)
    next.searchParams.set("speciesId", String(state.speciesId));
  if (state.TFTRarity && isTftCompanionRarity(state.TFTRarity))
    next.searchParams.set("TFTRarity", state.TFTRarity);
  if (Number.isSafeInteger(state.level) && (state.level ?? 0) > 0)
    next.searchParams.set("level", String(state.level));
  if (state.sort && state.sort !== "default" && isTftCompanionSort(state.sort))
    next.searchParams.set("sort", state.sort);
  if (state.onlyPbeAdditions) next.searchParams.set("pbeOnly", "1");
  if (
    state.channel === "latest" ||
    (state.channel === "pbe" && state.channelExplicit)
  )
    next.searchParams.set("channel", state.channel);
  return next;
}
