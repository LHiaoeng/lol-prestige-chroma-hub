import type { RuntimeChannel } from "./communitydragon-runtime";
import {
  isTftArenaRarity,
  isTftArenaSort,
  type TftArenaRarity,
  type TftArenaSort,
} from "./tft-arenas";

export type TftArenaUrlParameter =
  | "q"
  | "groupId"
  | "TFTRarity"
  | "sort"
  | "pbeOnly"
  | "channel";

export interface TftArenaUrlState {
  readonly search: string;
  readonly groupId?: number;
  readonly TFTRarity?: TftArenaRarity;
  readonly sort: TftArenaSort;
  readonly onlyPbeAdditions: boolean;
  readonly channel: RuntimeChannel;
  readonly channelExplicit: boolean;
  readonly invalid: readonly TftArenaUrlParameter[];
}

export type TftArenaUrlStateInput = Pick<
  TftArenaUrlState,
  "search" | "groupId" | "TFTRarity" | "onlyPbeAdditions" | "channel"
> & Partial<Pick<TftArenaUrlState, "sort" | "channelExplicit">>;

export function readTftArenaUrlState(url: URL): TftArenaUrlState {
  const query = url.searchParams.getAll("q");
  const groups = url.searchParams.getAll("groupId");
  const rarities = url.searchParams.getAll("TFTRarity");
  const sorts = url.searchParams.getAll("sort");
  const pbeOnly = url.searchParams.getAll("pbeOnly");
  const channels = url.searchParams.getAll("channel");
  const groupId = groups.length === 1 && /^(?:0|[1-9]\d*)$/.test(groups[0])
    ? Number(groups[0]) : undefined;
  const TFTRarity = rarities.length === 1 && isTftArenaRarity(rarities[0])
    ? rarities[0] : undefined;
  const sort = sorts.length === 1 && isTftArenaSort(sorts[0])
    ? sorts[0] : "default";
  const channel = channels.length === 1 && (channels[0] === "pbe" || channels[0] === "latest")
    ? channels[0] : "pbe";
  const invalid: TftArenaUrlParameter[] = [];
  if (query.length > 1) invalid.push("q");
  if (groups.length && (groupId === undefined || !Number.isSafeInteger(groupId))) invalid.push("groupId");
  if (rarities.length && TFTRarity === undefined) invalid.push("TFTRarity");
  if (sorts.length && !(sorts.length === 1 && isTftArenaSort(sorts[0]))) invalid.push("sort");
  if (pbeOnly.length && (pbeOnly.length !== 1 || pbeOnly[0] !== "1")) invalid.push("pbeOnly");
  if (channels.length && (channels.length !== 1 || (channels[0] !== "pbe" && channels[0] !== "latest"))) invalid.push("channel");
  return {
    search: query.length === 1 ? query[0] : "",
    ...(groupId === undefined || !Number.isSafeInteger(groupId) ? {} : { groupId }),
    ...(TFTRarity === undefined ? {} : { TFTRarity }),
    sort,
    onlyPbeAdditions: channel === "pbe" && pbeOnly.length === 1 && pbeOnly[0] === "1",
    channel,
    channelExplicit: channels.length === 1 && channels[0] === channel,
    invalid,
  };
}

export function formatTftArenaUrl(url: URL, state: TftArenaUrlStateInput): URL {
  const next = new URL(url);
  next.search = "";
  const query = state.search.trim();
  if (query) next.searchParams.set("q", query);
  if (Number.isSafeInteger(state.groupId) && (state.groupId ?? -1) >= 0)
    next.searchParams.set("groupId", String(state.groupId));
  if (state.TFTRarity && isTftArenaRarity(state.TFTRarity))
    next.searchParams.set("TFTRarity", state.TFTRarity);
  if (state.sort && state.sort !== "default" && isTftArenaSort(state.sort))
    next.searchParams.set("sort", state.sort);
  if (state.channel === "pbe" && state.onlyPbeAdditions)
    next.searchParams.set("pbeOnly", "1");
  if (state.channel === "latest" || state.channelExplicit)
    next.searchParams.set("channel", state.channel);
  return next;
}
