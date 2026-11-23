import type { RuntimeChannel } from "./communitydragon-runtime";
import {
  isTftCosmeticSort,
  TFT_COSMETIC_SORTS,
  type TftCosmeticSort,
} from "./tft-cosmetics";
import { isTftCosmeticTier, type TftCosmeticTier } from "./tft-cosmetic-tier";

export interface TftCosmeticUrlState {
  readonly search: string;
  readonly TFTRarity?: TftCosmeticTier;
  readonly featureTypes: readonly string[];
  readonly sort: TftCosmeticSort;
  readonly onlyPbeAdditions: boolean;
  readonly channel: RuntimeChannel;
  readonly channelExplicit: boolean;
  readonly view: "cards" | "list";
  readonly invalid: readonly string[];
}

export function readTftCosmeticUrlState(url: URL): TftCosmeticUrlState {
  const search = url.searchParams.getAll("q");
  const rarities = url.searchParams.getAll("TFTRarity");
  const features = url.searchParams.getAll("featureType");
  const sorts = url.searchParams.getAll("sort");
  const pbeOnly = url.searchParams.getAll("pbeOnly");
  const channels = url.searchParams.getAll("channel");
  const views = url.searchParams.getAll("view");
  const rarity = rarities.length === 1 && isTftCosmeticTier(rarities[0])
    ? rarities[0]
    : undefined;
  const sort = sorts.length === 1 && isTftCosmeticSort(sorts[0])
    ? sorts[0]
    : "default";
  const channel = channels.length === 1 &&
      (channels[0] === "pbe" || channels[0] === "latest")
    ? channels[0]
    : "pbe";
  const view = views.length === 1 && views[0] === "list" ? "list" : "cards";
  const featureTypes = [...new Set(features.filter((value) => /^k[A-Za-z0-9]+$/.test(value)))];
  const invalid: string[] = [];
  if (search.length > 1) invalid.push("q");
  if (rarities.length && rarity === undefined) invalid.push("TFTRarity");
  if (features.some((value) => !/^k[A-Za-z0-9]+$/.test(value))) invalid.push("featureType");
  if (sorts.length && !(sorts.length === 1 && isTftCosmeticSort(sorts[0]))) invalid.push("sort");
  if (pbeOnly.length && (pbeOnly.length !== 1 || pbeOnly[0] !== "1")) invalid.push("pbeOnly");
  if (channels.length && !(channels.length === 1 && channels[0] === channel)) invalid.push("channel");
  if (views.length && !(views.length === 1 && (views[0] === "cards" || views[0] === "list"))) invalid.push("view");
  return {
    search: search.length === 1 ? search[0] : "",
    ...(rarity === undefined ? {} : { TFTRarity: rarity }),
    featureTypes,
    sort,
    onlyPbeAdditions: channel === "pbe" && pbeOnly.length === 1 && pbeOnly[0] === "1",
    channel,
    channelExplicit: channels.length === 1 && channels[0] === channel,
    view,
    invalid,
  };
}

export function formatTftCosmeticUrl(
  url: URL,
  state: Pick<TftCosmeticUrlState, "search" | "featureTypes" | "onlyPbeAdditions" | "channel"> &
    Partial<Pick<TftCosmeticUrlState, "TFTRarity" | "sort" | "channelExplicit" | "view">>,
): URL {
  const next = new URL(url);
  next.search = "";
  const query = state.search.trim();
  if (query) next.searchParams.set("q", query);
  if (state.TFTRarity && isTftCosmeticTier(state.TFTRarity))
    next.searchParams.set("TFTRarity", state.TFTRarity);
  for (const featureType of new Set(state.featureTypes))
    if (/^k[A-Za-z0-9]+$/.test(featureType))
      next.searchParams.append("featureType", featureType);
  if (state.sort && state.sort !== "default" && (TFT_COSMETIC_SORTS as readonly string[]).includes(state.sort))
    next.searchParams.set("sort", state.sort);
  if (state.onlyPbeAdditions && state.channel === "pbe")
    next.searchParams.set("pbeOnly", "1");
  if (state.channel === "latest" || state.channelExplicit)
    next.searchParams.set("channel", state.channel);
  if (state.view === "list") next.searchParams.set("view", "list");
  return next;
}
