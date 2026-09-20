import { z } from "zod";
import {
  communityDragonAssetUrl,
  type CommunityDragonChannel,
} from "./communitydragon-url";

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
}

export interface RuntimeChampionSummary {
  readonly kind: "champion";
  readonly id: number;
  readonly name: string;
  readonly alias?: string;
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
  readonly skinlineIds: readonly number[];
  readonly media: RuntimeMedia;
  readonly stages: readonly RuntimeSkinStage[];
}

export interface RuntimeChampion extends RuntimeChampionSummary {
  readonly skins: readonly RuntimeSkinSummary[];
}

export interface RuntimeSkin extends RuntimeSkinSummary {
  readonly kind: "skin";
  readonly championId: number;
  readonly chromas: readonly RuntimeChroma[];
}

export interface RuntimeSkinStage {
  readonly id?: number;
  readonly name: string;
  readonly stageIndex: number;
  readonly media: RuntimeMedia;
  readonly chromas: readonly RuntimeChroma[];
}

export interface RuntimeChroma {
  readonly id: number;
  readonly name?: string;
  readonly imageUrl?: string;
}

export interface RuntimeMedia {
  readonly focusedSplashUrl?: string;
  readonly unfocusedSplashUrl?: string;
  readonly tileUrl?: string;
  readonly loadScreenUrl?: string;
  readonly animatedSplashUrl?: string;
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
  RuntimeChampion | RuntimeSkin | RuntimeSkinline | RuntimeUniverse;
const idSchema = z.number().int().positive();
const championSummarySchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1),
    alias: z.string().optional(),
    title: z.string().optional(),
    shortBio: z.string().optional(),
    squarePortraitPath: z.string().optional(),
  })
  .passthrough();
const skinlineSchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1),
    description: z.string().optional(),
    imagePath: z.string().optional(),
    universeIds: z.array(idSchema).optional(),
  })
  .passthrough();
const universeSchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1),
    description: z.string().optional(),
    imagePath: z.string().optional(),
    skinSets: z.array(idSchema).optional(),
    skinlineIds: z.array(idSchema).optional(),
  })
  .passthrough();
const chromaSchema = z
  .object({
    id: idSchema,
    name: z.string().optional(),
    chromaPath: z.string().optional(),
  })
  .passthrough();
const skinStageSchema = z
  .object({
    id: idSchema.optional(),
    stage: idSchema.optional(),
    name: z.string().optional(),
    splashPath: z.string().optional(),
    uncenteredSplashPath: z.string().optional(),
    tilePath: z.string().optional(),
    loadScreenPath: z.string().optional(),
    splashVideoPath: z.string().optional(),
    chromas: z.array(chromaSchema).optional(),
  })
  .passthrough();
const skinSchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1),
    isBase: z.boolean().optional(),
    isLegacy: z.boolean().optional(),
    description: z.string().optional(),
    splashPath: z.string().optional(),
    uncenteredSplashPath: z.string().optional(),
    tilePath: z.string().optional(),
    loadScreenPath: z.string().optional(),
    splashVideoPath: z.string().optional(),
    skinLines: z
      .array(z.union([idSchema, z.object({ id: idSchema }).passthrough()]))
      .optional(),
    chromas: z.array(chromaSchema).optional(),
    questSkinInfo: z
      .object({
        tiers: z.array(skinStageSchema).optional(),
      })
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
  raw: { name: string; title?: string },
  locale: CommunityDragonLocale,
): { name: string; title?: string } {
  if (locale !== "zh_cn") return { name: raw.name, title: text(raw.title) };
  const name = text(raw.title);
  if (!name) throw new Error("Chinese champion payload is missing its name");
  return { name, title: text(raw.name) };
}

function positiveIds(value: unknown): number[] {
  if (value === undefined) return [];
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
  return path ? communityDragonAssetUrl(path, channel) : undefined;
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
  };
}

function normalizeChroma(
  raw: z.infer<typeof chromaSchema>,
  channel: RuntimeChannel,
): RuntimeChroma {
  return {
    id: raw.id,
    name: text(raw.name),
    imageUrl: asset(text(raw.chromaPath), channel),
  };
}

function normalizeSkin(
  raw: z.infer<typeof skinSchema>,
  channel: RuntimeChannel,
  championId: number,
): RuntimeSkin {
  const stages: RuntimeSkinStage[] = [];
  for (const [index, value] of (raw.questSkinInfo?.tiers ?? []).entries()) {
    const id = value.id;
    const stageIndex = value.stage ?? index + 1;
    stages.push({
      id,
      name: text(value.name) ?? `${raw.name} · Stage ${stageIndex}`,
      stageIndex,
      media: normalizeMedia(value, channel),
      chromas: (value.chromas ?? []).map((chroma) =>
        normalizeChroma(chroma, channel),
      ),
    });
  }
  return {
    kind: "skin",
    id: raw.id,
    championId,
    name: raw.name,
    isBase: raw.isBase === true,
    isLegacy: raw.isLegacy,
    description: text(raw.description),
    skinlineIds: positiveIds(raw.skinLines),
    media: normalizeMedia(raw, channel),
    stages,
    chromas: (raw.chromas ?? []).map((value) =>
      normalizeChroma(value, channel),
    ),
  };
}

export function normalizeRuntimeOptions(
  options: RuntimeParseOptions,
): Required<Pick<RuntimeParseOptions, "locale" | "channel">> &
  Pick<RuntimeParseOptions, "championId"> {
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
  return { locale: options.locale, channel, championId: options.championId };
}

export function parseRuntimeList(
  kind: RuntimeListKind,
  value: unknown,
  input: RuntimeParseOptions,
): RuntimeList {
  const options = normalizeRuntimeOptions(input);
  if (kind === "champions")
    return parseCollection(
      value,
      championSummarySchema,
      "Champion summary",
    ).map((raw) => {
      const labels = championLabels(raw, options.locale);
      return {
        kind: "champion" as const,
        id: raw.id,
        name: labels.name,
        alias: text(raw.alias),
        title: labels.title,
        shortBio: text(raw.shortBio),
        portraitUrl: asset(text(raw.squarePortraitPath), options.channel),
      };
    });
  if (kind === "skinlines")
    return parseCollection(value, skinlineSchema, "Skinline").map((raw) => ({
      kind: "skinline" as const,
      id: raw.id,
      name: raw.name,
      description: text(raw.description),
      imageUrl: asset(text(raw.imagePath), options.channel),
      universeIds: raw.universeIds ?? [],
    }));
  return parseCollection(value, universeSchema, "Universe").map((raw) => ({
    kind: "universe" as const,
    id: raw.id,
    name: raw.name,
    description: text(raw.description),
    imageUrl: asset(text(raw.imagePath), options.channel),
    skinlineIds: raw.skinlineIds ?? raw.skinSets ?? [],
  }));
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
    normalizeSkin(skin, options.channel, championId),
  );
  if (kind === "champion") {
    const labels = championLabels(raw, options.locale);
    return {
      kind: "champion",
      id: raw.id,
      name: labels.name,
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
  return skin;
}
