import { z } from "zod";
import {
  communityDragonAssetUrl,
  type CommunityDragonChannel,
} from "./communitydragon-url";
import { projectRuntimeSkinTarget } from "./skin-reference-projection";

export type RuntimeChannel = CommunityDragonChannel;
export type CommunityDragonLocale = "default" | "zh_cn";
export type RuntimeListKind = "champions" | "skinlines" | "universes";
export type RuntimeEntityKind = "champion" | "skin" | "skinline" | "universe";

export type RuntimeErrorCode =
  | "invalid-request"
  | "unsafe-url"
  | "network"
  | "aborted"
  | "not-found"
  | "http"
  | "schema";

export class CommunityDragonRuntimeError extends Error {
  readonly code: RuntimeErrorCode;
  readonly status?: number;
  readonly url?: string;

  constructor(
    code: RuntimeErrorCode,
    message: string,
    options: { status?: number; url?: string; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "CommunityDragonRuntimeError";
    this.code = code;
    this.status = options.status;
    this.url = options.url;
  }
}

export interface RuntimeParseOptions {
  readonly locale: CommunityDragonLocale;
  readonly channel?: RuntimeChannel;
  readonly championId?: number;
  readonly stageId?: number;
}

export interface RuntimeRarity {
  readonly id?: number;
  readonly key?: string;
  readonly label?: string;
  readonly iconUrl?: string;
}

export interface RuntimeHistoricalArtwork {
  readonly version?: string;
  readonly media: RuntimeMedia;
}

export interface RuntimeChampionSummary {
  readonly kind: "champion";
  readonly id: number;
  readonly name: string;
  readonly alias?: string;
  readonly roles?: readonly string[];
  readonly title?: string;
  readonly shortBio?: string;
  readonly portraitUrl?: string;
}

export interface RuntimeSkinSummary {
  readonly id: number;
  readonly name: string;
  readonly isBase: boolean;
  readonly isLegacy?: boolean;
  readonly description?: string;
  readonly rarity?: RuntimeRarity;
  readonly skinlineIds: readonly number[];
  readonly universeIds?: readonly number[];
  readonly media: RuntimeMedia;
  readonly historicalArt?: readonly RuntimeHistoricalArtwork[];
  readonly stages: readonly RuntimeSkinStage[];
}

export interface RuntimeChampion extends RuntimeChampionSummary {
  readonly skins: readonly RuntimeSkinSummary[];
}

export interface RuntimeSkin extends Omit<RuntimeSkinSummary, "name"> {
  readonly kind: "skin";
  readonly championId: number;
  readonly championAlias?: string;
  readonly championName?: string;
  readonly name: string;
  /** The source-provided image used by the skin's default chroma item. */
  readonly chromaImageUrl?: string;
  readonly stageId?: number;
  readonly stageIndex?: number;
  readonly chromas: readonly RuntimeChroma[];
}

export interface RuntimeStageSkin extends Omit<RuntimeSkin, "name"> {
  /** A source stage may have an identity but no player-facing name. */
  readonly name?: string;
  readonly stageId: number;
}

export type RuntimeSkinEntity = RuntimeSkin | RuntimeStageSkin;

export interface RuntimeSkinStage {
  readonly id?: number;
  readonly name?: string;
  readonly stageIndex: number;
  readonly description?: string;
  readonly rarity?: RuntimeRarity;
  /** Whether the source stage explicitly supplied rarity metadata. */
  readonly raritySpecified?: boolean;
  readonly skinlineIds?: readonly number[];
  readonly universeIds?: readonly number[];
  readonly media: RuntimeMedia;
  /** The source-provided image used by the stage's default chroma item. */
  readonly chromaImageUrl?: string;
  readonly historicalArt?: readonly RuntimeHistoricalArtwork[];
  readonly chromas: readonly RuntimeChroma[];
}

export interface RuntimeChroma {
  readonly id: number;
  readonly name?: string;
  readonly imageUrl?: string;
  readonly colors?: readonly string[];
}

export interface RuntimeMedia {
  readonly focusedSplashUrl?: string;
  readonly unfocusedSplashUrl?: string;
  readonly tileUrl?: string;
  readonly loadScreenUrl?: string;
  readonly animatedSplashUrl?: string;
  readonly loadScreenVintageUrl?: string;
  readonly previewVideoUrl?: string;
  readonly collectionSplashVideoUrl?: string;
  readonly collectionCardHoverVideoUrl?: string;
}

export interface RuntimeSkinline {
  readonly kind: "skinline";
  readonly id: number;
  readonly name: string;
  readonly description?: string;
  readonly imageUrl?: string;
  readonly universeIds: readonly number[];
}

export interface RuntimeUniverse {
  readonly kind: "universe";
  readonly id: number;
  readonly name: string;
  readonly description?: string;
  readonly imageUrl?: string;
  readonly skinlineIds: readonly number[];
}

export type RuntimeList = readonly (
  RuntimeChampionSummary | RuntimeSkinline | RuntimeUniverse
)[];
export type RuntimeEntity =
  | RuntimeChampion
  | RuntimeSkinEntity
  | RuntimeSkinline
  | RuntimeUniverse;
const idSchema = z.number().int().positive();
const JADE_CHAMPION_ID_MIN = 60000;
const JADE_CHAMPION_ID_MAX = 70000;
const JADE_CHAMPION_ALIAS_PREFIX = "Jade_";
const championSummarySchema = z
  .object({
    id: z.number().int(),
    name: z.string().trim().min(1),
    alias: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    shortBio: z.string().nullable().optional(),
    squarePortraitPath: z.string().nullable().optional(),
    roles: z.array(z.string()).nullable().optional(),
  })
  .passthrough();
const skinlineSchema = z
  .object({
    id: z.number().int(),
    name: z.string().trim(),
    description: z.string().nullable().optional(),
    imagePath: z.string().nullable().optional(),
    universeIds: z.array(idSchema).optional(),
  })
  .passthrough();
const universeSchema = z
  .object({
    id: z.number().int(),
    name: z.string().trim(),
    description: z.string().nullable().optional(),
    imagePath: z.string().nullable().optional(),
    skinSets: z.array(idSchema).optional(),
    skinlineIds: z.array(idSchema).optional(),
  })
  .passthrough();
const chromaSchema = z
  .object({
    id: idSchema,
    name: z.string().nullable().optional(),
    chromaPath: z.string().nullable().optional(),
    colors: z
      .array(z.string().regex(/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/))
      .nullable()
      .optional(),
  })
  .passthrough();
const skinStageSchema = z
  .object({
    id: z.number().int().nullable().optional(),
    stage: z.number().int().nullable().optional(),
    name: z.string().nullable().optional(),
    shortName: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    rarity: z.string().nullable().optional(),
    regionRarityId: z.number().int().nonnegative().nullable().optional(),
    rarityGemPath: z.string().nullable().optional(),
    splashPath: z.string().nullable().optional(),
    uncenteredSplashPath: z.string().nullable().optional(),
    tilePath: z.string().nullable().optional(),
    chromaPath: z.string().nullable().optional(),
    loadScreenPath: z.string().nullable().optional(),
    loadScreenVintagePath: z.string().nullable().optional(),
    splashVideoPath: z.string().nullable().optional(),
    previewVideoUrl: z.string().nullable().optional(),
    collectionSplashVideoPath: z.string().nullable().optional(),
    collectionCardHoverVideoPath: z.string().nullable().optional(),
    skinLines: z
      .array(z.union([idSchema, z.object({ id: idSchema }).passthrough()]))
      .nullable()
      .optional(),
    universeIds: z.array(idSchema).nullable().optional(),
    chromas: z.array(chromaSchema).nullable().optional(),
    historicalVersions: z.unknown().optional(),
    history: z.unknown().optional(),
    changes: z.unknown().optional(),
  })
  .passthrough();
const skinSchema = z
  .object({
    id: idSchema,
    championId: idSchema.optional(),
    name: z.string().trim().min(1),
    isBase: z.boolean().nullable().optional(),
    isLegacy: z.boolean().nullable().optional(),
    description: z.string().nullable().optional(),
    rarity: z.string().nullable().optional(),
    regionRarityId: z.number().int().nonnegative().nullable().optional(),
    rarityGemPath: z.string().nullable().optional(),
    splashPath: z.string().nullable().optional(),
    uncenteredSplashPath: z.string().nullable().optional(),
    tilePath: z.string().nullable().optional(),
    chromaPath: z.string().nullable().optional(),
    loadScreenPath: z.string().nullable().optional(),
    loadScreenVintagePath: z.string().nullable().optional(),
    splashVideoPath: z.string().nullable().optional(),
    previewVideoUrl: z.string().nullable().optional(),
    collectionSplashVideoPath: z.string().nullable().optional(),
    collectionCardHoverVideoPath: z.string().nullable().optional(),
    skinLines: z
      .array(z.union([idSchema, z.object({ id: idSchema }).passthrough()]))
      .nullable()
      .optional(),
    universeIds: z.array(idSchema).nullable().optional(),
    chromas: z.array(chromaSchema).nullable().optional(),
    historicalVersions: z.unknown().optional(),
    history: z.unknown().optional(),
    changes: z.unknown().optional(),
    questSkinInfo: z
      .object({
        tiers: z.array(skinStageSchema).nullable().optional(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();
const championDetailSchema = championSummarySchema.extend({
  skins: z.array(skinSchema),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function collectionEntries(
  value: unknown,
  label: string,
): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    if (!value.every(isRecord))
      throw new CommunityDragonRuntimeError(
        "schema",
        `${label} payload contains a malformed entry`,
      );
    return value;
  }
  if (isRecord(value)) {
    const entries = Object.values(value);
    if (!entries.every(isRecord))
      throw new CommunityDragonRuntimeError(
        "schema",
        `${label} payload contains a malformed entry`,
      );
    return entries;
  }
  throw new CommunityDragonRuntimeError(
    "schema",
    `${label} payload must be an array or object map`,
  );
}

function parseCollection<T extends z.ZodType>(
  value: unknown,
  schema: T,
  label: string,
): z.infer<T>[] {
  try {
    return z.array(schema).parse(collectionEntries(value, label));
  } catch (error) {
    if (error instanceof CommunityDragonRuntimeError) throw error;
    throw new CommunityDragonRuntimeError(
      "schema",
      `${label} payload failed schema validation`,
      { cause: error },
    );
  }
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function championLabels(
  raw: { name: string; title?: unknown; description?: unknown },
  locale: CommunityDragonLocale,
): { name: string; title?: string } {
  const localizedTitle = text(raw.title) ?? text(raw.description);
  if (locale !== "zh_cn") return { name: raw.name, title: localizedTitle };
  if (!localizedTitle) return { name: raw.name };
  return { name: localizedTitle, title: text(raw.name) };
}

function positiveIds(value: unknown): number[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error("Expected an ID list");
  return value.map((item) => {
    const id = isRecord(item) ? item.id : item;
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0)
      throw new Error("ID list contains an invalid ID");
    return id;
  });
}

function asset(
  path: string | undefined,
  channel: RuntimeChannel,
): string | undefined {
  if (!path) return undefined;
  try {
    return communityDragonAssetUrl(path, channel);
  } catch (error) {
    throw new CommunityDragonRuntimeError(
      "unsafe-url",
      "CommunityDragon returned an unsafe asset path",
      { cause: error },
    );
  }
}

function normalizeMedia(
  raw: Record<string, unknown>,
  channel: RuntimeChannel,
): RuntimeMedia {
  return {
    focusedSplashUrl: asset(text(raw.splashPath), channel),
    unfocusedSplashUrl: asset(text(raw.uncenteredSplashPath), channel),
    tileUrl: asset(text(raw.tilePath), channel),
    loadScreenUrl: asset(text(raw.loadScreenPath), channel),
    animatedSplashUrl: asset(text(raw.splashVideoPath), channel),
    loadScreenVintageUrl: asset(text(raw.loadScreenVintagePath), channel),
    previewVideoUrl: asset(text(raw.previewVideoUrl), channel),
    collectionSplashVideoUrl: asset(
      text(raw.collectionSplashVideoPath),
      channel,
    ),
    collectionCardHoverVideoUrl: asset(
      text(raw.collectionCardHoverVideoPath),
      channel,
    ),
  };
}

const defaultRarityInfo: Readonly<Record<string, { label: string; icon?: string }>> = {
  kEpic: { label: "Epic", icon: "epic.png" },
  kLegendary: { label: "Legendary", icon: "legendary.png" },
  kMythic: { label: "Mythic", icon: "mythic.png" },
  kUltimate: { label: "Ultimate", icon: "ultimate.png" },
  kTranscendent: { label: "Transcendent", icon: "transcendent.png" },
  kExalted: { label: "Exalted", icon: "exalted.png" },
};

const regionRarityInfo: Readonly<Record<number, { label: string; icon?: string }>> = {
  1: { label: "典藏", icon: "cn-gem-1.png" },
  2: { label: "勇士", icon: "cn-gem-2.png" },
  3: { label: "王者", icon: "cn-gem-3.png" },
  4: { label: "史诗", icon: "cn-gem-4.png" },
  5: { label: "传说", icon: "cn-gem-5.png" },
  6: { label: "未知", icon: "cn-gem-6.png" },
  7: { label: "限定", icon: "cn-gem-7.png" },
  8: { label: "神话", icon: "cn-gem-8.png" },
  9: { label: "终极", icon: "cn-gem-9.png" },
  10: { label: "圣堂", icon: "cn-gem-10.png" },
  11: { label: "卓越", icon: "cn-gem-11.png" },
};

function normalizeRarity(
  raw: Record<string, unknown>,
  locale: CommunityDragonLocale,
  channel: RuntimeChannel,
): RuntimeRarity | undefined {
  if (locale === "default") {
    const key = text(raw.rarity);
    if (!key || key === "kNoRarity" || key === "kRare") return undefined;
    const info = defaultRarityInfo[key];
    const iconPath = info?.icon ?? (info ? undefined : text(raw.rarityGemPath));
    return {
      key,
      label: info?.label ?? key,
      iconUrl: iconPath
          ? asset(
              info?.icon
                ? `/lol-game-data/assets/v1/rarity-gem-icons/${iconPath}`
                : iconPath,
              channel,
            )
        : undefined,
    };
  }

  const id = raw.regionRarityId;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0)
    return undefined;
  const info = regionRarityInfo[id];
  const iconPath = info?.icon;
  return {
    id,
    label: info?.label,
    iconUrl: iconPath
      ? asset(`/lol-game-data/assets/v1/rarity-gem-icons/${iconPath}`, channel)
      : undefined,
  };
}

function hasExplicitRarity(
  raw: Record<string, unknown>,
  locale: CommunityDragonLocale,
): boolean {
  if (locale === "default") return text(raw.rarity) !== undefined;
  return (
    typeof raw.regionRarityId === "number" &&
    Number.isSafeInteger(raw.regionRarityId)
  );
}

function historicalEntries(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    if (!value.every(isRecord))
      throw new CommunityDragonRuntimeError(
        "schema",
        "Skin history contains a malformed entry",
      );
    return value;
  }
  if (isRecord(value))
    return Object.entries(value).flatMap(([version, entry]) => {
      if (!isRecord(entry))
        throw new CommunityDragonRuntimeError(
          "schema",
          "Skin history contains a malformed entry",
        );
      return [{ version, ...entry }];
    });
  throw new CommunityDragonRuntimeError(
    "schema",
    "Skin history must be an array or object map",
  );
}

function normalizeHistoricalArt(
  raw: Record<string, unknown>,
  channel: RuntimeChannel,
): RuntimeHistoricalArtwork[] {
  const source =
    raw.historicalVersions ?? raw.history ?? raw.changes;
  if (source === undefined || source === null) return [];
  const result: RuntimeHistoricalArtwork[] = [];
  for (const entry of historicalEntries(source)) {
    const version =
      text(entry.version) ??
      text(entry.patch) ??
      text(entry.gameVersion);
    const media = normalizeMedia(entry, channel);
    if (Object.values(media).some(Boolean)) result.push({ version, media });
  }
  return result;
}

function normalizeChroma(
  raw: z.infer<typeof chromaSchema>,
  channel: RuntimeChannel,
): RuntimeChroma {
  return {
    id: raw.id,
    name: text(raw.name),
    imageUrl: asset(text(raw.chromaPath), channel),
    colors: raw.colors
      ? [...new Set(raw.colors.map((color) => color.toUpperCase()))]
      : undefined,
  };
}

function normalizeStage(
  raw: z.infer<typeof skinStageSchema>,
  channel: RuntimeChannel,
  locale: CommunityDragonLocale,
  index: number,
): RuntimeSkinStage | undefined {
  const id = raw.id;
  const name = text(raw.name) ?? text(raw.shortName);
  if (
    typeof id !== "number" ||
    !Number.isSafeInteger(id) ||
    id <= 0
  )
    return undefined;
  return {
    id,
    name,
    stageIndex:
      typeof raw.stage === "number" && raw.stage > 0
        ? raw.stage
        : index + 1,
    description: text(raw.description),
    rarity: normalizeRarity(raw, locale, channel),
    raritySpecified: hasExplicitRarity(raw, locale),
    skinlineIds: raw.skinLines ? positiveIds(raw.skinLines) : undefined,
    universeIds: raw.universeIds ?? undefined,
    media: normalizeMedia(raw, channel),
    chromaImageUrl: asset(text(raw.chromaPath), channel),
    historicalArt: normalizeHistoricalArt(raw, channel),
    chromas: (raw.chromas ?? []).map((chroma) =>
      normalizeChroma(chroma, channel),
    ),
  };
}

function normalizeSkin(
  raw: z.infer<typeof skinSchema>,
  channel: RuntimeChannel,
  locale: CommunityDragonLocale,
  championId: number,
  championAlias?: string,
): RuntimeSkin {
  const parsedStages = (raw.questSkinInfo?.tiers ?? [])
    .map((value, index) => normalizeStage(value, channel, locale, index))
    .filter((value): value is RuntimeSkinStage => Boolean(value));
  const uniqueStages = new Map<number, RuntimeSkinStage>();
  for (const stage of parsedStages) {
    if (stage.id === undefined) continue;
    if (!uniqueStages.has(stage.id)) uniqueStages.set(stage.id, stage);
  }
  const stages = [...uniqueStages.values()];
  return {
    kind: "skin",
    id: raw.id,
    championId,
    championAlias,
    name: raw.name,
    isBase: raw.isBase === true,
    isLegacy: raw.isLegacy ?? undefined,
    description: text(raw.description),
    rarity: normalizeRarity(raw, locale, channel),
    skinlineIds: positiveIds(raw.skinLines),
    universeIds: raw.universeIds ?? undefined,
    media: normalizeMedia(raw, channel),
    chromaImageUrl: asset(text(raw.chromaPath), channel),
    historicalArt: normalizeHistoricalArt(raw, channel),
    stages,
    chromas: (raw.chromas ?? []).map((value) =>
      normalizeChroma(value, channel),
    ),
  };
}

export function normalizeRuntimeOptions(
  options: RuntimeParseOptions,
): Required<Pick<RuntimeParseOptions, "locale" | "channel">> &
  Pick<RuntimeParseOptions, "championId" | "stageId"> {
  const channel = options.channel ?? "pbe";
  if (options.locale !== "default" && options.locale !== "zh_cn")
    throw new CommunityDragonRuntimeError(
      "invalid-request",
      "Unsupported CommunityDragon locale",
    );
  if (channel !== "pbe" && channel !== "latest")
    throw new CommunityDragonRuntimeError(
      "invalid-request",
      "Unsupported CommunityDragon channel",
    );
  if (
    options.stageId !== undefined &&
    (!Number.isSafeInteger(options.stageId) || options.stageId <= 0)
  )
    throw new CommunityDragonRuntimeError(
      "invalid-request",
      "Stage ID must be a positive safe integer",
    );
  return {
    locale: options.locale,
    channel,
    championId: options.championId,
    stageId: options.stageId,
  };
}

export function parseRuntimeList(
  kind: RuntimeListKind,
  value: unknown,
  input: RuntimeParseOptions,
): RuntimeList {
  const options = normalizeRuntimeOptions(input);
  if (kind === "champions")
    return parseCollection(value, championSummarySchema, "Champion summary")
      .filter((raw) => {
        if (
          raw.id === -1 &&
          raw.alias === "None" &&
          text(raw.squarePortraitPath)?.endsWith("/-1.png")
        )
          return false;
        // CommunityDragon exposes Jade chromas as synthetic champion records.
        if (
          raw.id >= JADE_CHAMPION_ID_MIN &&
          raw.id < JADE_CHAMPION_ID_MAX &&
          raw.alias?.startsWith(JADE_CHAMPION_ALIAS_PREFIX)
        )
          return false;
        if (!Number.isSafeInteger(raw.id) || raw.id <= 0)
          throw new CommunityDragonRuntimeError(
            "schema",
            "Champion summary contains an invalid ID",
          );
        return true;
      })
      .map((raw) => {
        const labels = championLabels(raw, options.locale);
        return {
          kind: "champion" as const,
          id: raw.id,
          name: labels.name,
          alias: text(raw.alias),
          roles: raw.roles ?? [],
          title: labels.title,
          shortBio: text(raw.shortBio),
          portraitUrl: asset(text(raw.squarePortraitPath), options.channel),
        };
      });
  if (kind === "skinlines")
    return parseCollection(value, skinlineSchema, "Skinline")
      .filter((raw) => {
        if (raw.id === 0 && !raw.name) return false;
        if (!Number.isSafeInteger(raw.id) || raw.id <= 0 || !raw.name)
          throw new CommunityDragonRuntimeError(
            "schema",
            "Skinline directory contains an invalid entry",
          );
        return true;
      })
      .map((raw) => ({
        kind: "skinline" as const,
        id: raw.id,
        name: raw.name,
        description: text(raw.description),
        imageUrl: asset(text(raw.imagePath), options.channel),
        universeIds: raw.universeIds ?? [],
      }));
  return parseCollection(value, universeSchema, "Universe")
    .filter((raw) => {
      if (raw.id === 0 && !raw.name) return false;
      if (!Number.isSafeInteger(raw.id) || raw.id <= 0 || !raw.name)
        throw new CommunityDragonRuntimeError(
          "schema",
          "Universe directory contains an invalid entry",
        );
      return true;
    })
    .map((raw) => ({
      kind: "universe" as const,
      id: raw.id,
      name: raw.name,
      description: text(raw.description),
      imageUrl: asset(text(raw.imagePath), options.channel),
      skinlineIds: raw.skinlineIds ?? raw.skinSets ?? [],
    }));
}

interface RuntimeSkinCollectionEntry {
  readonly raw: Record<string, unknown>;
  readonly championId?: number;
}

function skinCollectionEntries(value: unknown): RuntimeSkinCollectionEntry[] {
  if (Array.isArray(value))
    return value.map((raw) => ({
      raw: isRecord(raw) ? raw : {},
      championId:
        isRecord(raw) &&
        typeof raw.championId === "number" &&
        Number.isSafeInteger(raw.championId) &&
        raw.championId > 0
          ? raw.championId
          : undefined,
    }));

  if (!isRecord(value))
    throw new CommunityDragonRuntimeError(
      "schema",
      "Skin collection payload must be an array or object map",
    );

  const entries: RuntimeSkinCollectionEntry[] = [];
  for (const entry of Object.values(value)) {
    if (!isRecord(entry))
      throw new CommunityDragonRuntimeError(
        "schema",
        "Skin collection payload contains a malformed entry",
      );
    const group = entry.skins;
    if (Array.isArray(group)) {
      const championId =
        typeof entry.championId === "number" &&
        Number.isSafeInteger(entry.championId) &&
        entry.championId > 0
          ? entry.championId
          : typeof entry.id === "number" &&
              Number.isSafeInteger(entry.id) &&
              entry.id > 0
            ? entry.id
            : undefined;
      for (const raw of group) {
        if (!isRecord(raw))
          throw new CommunityDragonRuntimeError(
            "schema",
            "Skin collection payload contains a malformed skin entry",
          );
        entries.push({ raw, championId });
      }
      continue;
    }
    entries.push({
      raw: entry,
      championId:
        typeof entry.championId === "number" &&
        Number.isSafeInteger(entry.championId) &&
        entry.championId > 0
          ? entry.championId
          : undefined,
    });
  }
  return entries;
}

export function parseRuntimeSkinCollection(
  value: unknown,
  input: RuntimeParseOptions,
): readonly RuntimeSkin[] {
  const options = normalizeRuntimeOptions(input);
  return skinCollectionEntries(value).map(({ raw, championId }) => {
    let parsed: z.infer<typeof skinSchema>;
    try {
      parsed = skinSchema.parse(raw);
    } catch (error) {
      throw new CommunityDragonRuntimeError(
        "schema",
        "Skin collection entry failed validation",
        { cause: error },
      );
    }
    const resolvedChampionId = championId ?? parsed.championId;
    if (resolvedChampionId === undefined)
      throw new CommunityDragonRuntimeError(
        "schema",
        `Skin ${parsed.id} does not provide a stable champion ID`,
      );
    return normalizeSkin(
      parsed,
      options.channel,
      options.locale,
      resolvedChampionId,
    );
  });
}

export function parseRuntimeEntity(
  kind: RuntimeEntityKind,
  id: number,
  value: unknown,
  input: RuntimeParseOptions,
): RuntimeEntity {
  const options = normalizeRuntimeOptions(input);
  if (!Number.isSafeInteger(id) || id <= 0)
    throw new CommunityDragonRuntimeError(
      "invalid-request",
      "Entity ID must be a positive safe integer",
    );
  if (
    kind === "skin" &&
    (!Number.isSafeInteger(options.championId) ||
      (options.championId ?? 0) <= 0)
  )
    throw new CommunityDragonRuntimeError(
      "invalid-request",
      "Skin details require a positive champion hint",
    );
  if (kind === "skinline" || kind === "universe") {
    const listKind = kind === "skinline" ? "skinlines" : "universes";
    const result = parseRuntimeList(listKind, value, options).find(
      (item) => item.kind === kind && item.id === id,
    );
    if (!result)
      throw new CommunityDragonRuntimeError(
        "not-found",
        `${kind} ${id} was not found`,
      );
    return result as RuntimeSkinline | RuntimeUniverse;
  }

  const championId = kind === "skin" ? options.championId! : id;
  let raw: z.infer<typeof championDetailSchema>;
  try {
    raw = championDetailSchema.parse(value);
  } catch (error) {
    throw new CommunityDragonRuntimeError(
      "schema",
      `Champion ${championId} detail failed validation`,
      { cause: error },
    );
  }
  if (raw.id !== championId)
    throw new CommunityDragonRuntimeError(
      "schema",
      `Champion detail ID ${raw.id} does not match ${championId}`,
    );
  const skins = raw.skins.map((skin) =>
    normalizeSkin(
      skin,
      options.channel,
      options.locale,
      championId,
      text(raw.alias),
    ),
  );
  const labels = championLabels(raw, options.locale);
  if (kind === "champion") {
    return {
      kind: "champion",
      id: raw.id,
      name: labels.name,
      alias: text(raw.alias),
      roles: raw.roles ?? [],
      title: labels.title,
      shortBio: text(raw.shortBio),
      portraitUrl: asset(text(raw.squarePortraitPath), options.channel),
      skins,
    };
  }
  const skin = skins.find((candidate) => candidate.id === id);
  if (!skin)
    throw new CommunityDragonRuntimeError(
      "not-found",
      `Skin ${id} was not found for champion ${championId}`,
    );
  if (options.stageId === undefined)
    return { ...skin, championName: labels.name };
  const stage = projectRuntimeSkinTarget(skin, options.stageId);
  if (!stage)
    throw new CommunityDragonRuntimeError(
      "not-found",
      `Stage ${options.stageId} was not found for skin ${id} of champion ${championId}`,
    );
  return { ...stage, championName: labels.name };
}
