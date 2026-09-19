import { z } from "zod";
import {
  communityDragonAssetUrl,
  communityDragonDataUrl,
  communityDragonChampionUrl,
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

export interface RuntimeRequestOptions {
  readonly locale: CommunityDragonLocale;
  readonly channel?: RuntimeChannel;
  readonly signal?: AbortSignal;
  readonly championId?: number;
}

export interface RuntimeChampionSummary {
  readonly kind: "champion";
  readonly id: number;
  readonly name: string;
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
export type RuntimeFetcher = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

const idSchema = z.number().int().positive();
const championSummarySchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1),
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

interface CacheEntry {
  readonly controller: AbortController;
  readonly consumers: Set<symbol>;
  readonly promise: Promise<unknown>;
  settled: boolean;
}

const DEFAULT_CHANNEL: RuntimeChannel = "pbe";

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
  if (locale !== "zh_cn")
    return { name: raw.name, title: text(raw.title) };
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

function localePath(locale: CommunityDragonLocale): "en" | "zh" {
  return locale === "zh_cn" ? "zh" : "en";
}

function makeKey(
  kind: string,
  id: number | string,
  options: RuntimeRequestOptions,
): string {
  return `${options.channel ?? DEFAULT_CHANNEL}:${options.locale}:${kind}:${id}:${options.championId ?? ""}`;
}

function abortError(): CommunityDragonRuntimeError {
  return new CommunityDragonRuntimeError(
    "aborted",
    "CommunityDragon request was cancelled",
  );
}

export interface CommunityDragonRuntime {
  list(
    kind: RuntimeListKind,
    options: RuntimeRequestOptions,
  ): Promise<RuntimeList>;
  get(
    kind: RuntimeEntityKind,
    id: number,
    options: RuntimeRequestOptions,
  ): Promise<RuntimeEntity>;
}

export function createCommunityDragonRuntime(
  fetcher: RuntimeFetcher = fetch,
): CommunityDragonRuntime {
  const completed = new Map<string, unknown>();
  const inFlight = new Map<string, CacheEntry>();

  function validateOptions(
    options: RuntimeRequestOptions,
  ): Required<Pick<RuntimeRequestOptions, "locale" | "channel">> &
    Pick<RuntimeRequestOptions, "signal" | "championId"> {
    const channel = options.channel ?? DEFAULT_CHANNEL;
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
    return {
      locale: options.locale,
      channel,
      signal: options.signal,
      championId: options.championId,
    };
  }

  async function request<T>(
    key: string,
    url: string,
    options: RuntimeRequestOptions,
    parse: (value: unknown) => T,
  ): Promise<T> {
    const signal = options.signal;
    if (signal?.aborted) throw abortError();
    const cached = completed.get(key);
    if (cached !== undefined) return cached as T;

    let entry = inFlight.get(key);
    if (!entry) {
      const controller = new AbortController();
      const promise = (async () => {
        let response: Response;
        try {
          response = await fetcher(url, {
            credentials: "omit",
            referrerPolicy: "no-referrer",
            signal: controller.signal,
          });
        } catch (error) {
          if (controller.signal.aborted) throw abortError();
          throw new CommunityDragonRuntimeError(
            "network",
            `CommunityDragon request failed: ${url}`,
            { url, cause: error },
          );
        }
        if (response.status === 404)
          throw new CommunityDragonRuntimeError(
            "not-found",
            `CommunityDragon resource was not found: ${url}`,
            { status: 404, url },
          );
        if (!response.ok)
          throw new CommunityDragonRuntimeError(
            "http",
            `CommunityDragon returned HTTP ${response.status}: ${url}`,
            { status: response.status, url },
          );
        let value: unknown;
        try {
          value = await response.json();
        } catch (error) {
          throw new CommunityDragonRuntimeError(
            "schema",
            `CommunityDragon returned invalid JSON: ${url}`,
            { url, cause: error },
          );
        }
        try {
          return parse(value);
        } catch (error) {
          if (error instanceof CommunityDragonRuntimeError) throw error;
          throw new CommunityDragonRuntimeError(
            "schema",
            `CommunityDragon payload failed validation: ${url}`,
            { url, cause: error },
          );
        }
      })();
      entry = { controller, consumers: new Set(), promise, settled: false };
      inFlight.set(key, entry);
      void promise
        .then(
          (value) => completed.set(key, value),
          () => undefined,
        )
        .finally(() => {
          entry!.settled = true;
          inFlight.delete(key);
        });
    }

    const current = entry;
    const token = Symbol(key);
    current.consumers.add(token);
    return new Promise<T>((resolve, reject) => {
      let finished = false;
      const cleanup = () => {
        if (signal) signal.removeEventListener("abort", onAbort);
        current.consumers.delete(token);
      };
      const onAbort = () => {
        if (finished) return;
        finished = true;
        cleanup();
        if (!current.settled && current.consumers.size === 0)
          current.controller.abort();
        reject(abortError());
      };
      if (signal) signal.addEventListener("abort", onAbort, { once: true });
      void current.promise.then(
        (value) => {
          if (finished) return;
          finished = true;
          cleanup();
          resolve(value as T);
        },
        (error: unknown) => {
          if (finished) return;
          finished = true;
          cleanup();
          reject(error);
        },
      );
    });
  }

  function list(
    kind: RuntimeListKind,
    input: RuntimeRequestOptions,
  ): Promise<RuntimeList> {
    const options = validateOptions(input);
    const path =
      kind === "champions" ? "champion-summary.json" : `${kind}.json`;
    const url = communityDragonDataUrl(path, options.locale, options.channel);
    const key = makeKey("list", kind, options);
    if (kind === "champions") {
      return request(key, url, options, (value) =>
        parseCollection(value, championSummarySchema, "Champion summary").map(
          (raw) => {
            const labels = championLabels(raw, options.locale);
            return {
              kind: "champion" as const,
              id: raw.id,
              name: labels.name,
              title: labels.title,
              shortBio: text(raw.shortBio),
              portraitUrl: asset(text(raw.squarePortraitPath), options.channel),
            };
          },
        ),
      );
    }
    if (kind === "skinlines") {
      return request(key, url, options, (value) =>
        parseCollection(value, skinlineSchema, "Skinline").map((raw) => ({
          kind: "skinline" as const,
          id: raw.id,
          name: raw.name,
          description: text(raw.description),
          imageUrl: asset(text(raw.imagePath), options.channel),
          universeIds: raw.universeIds ?? [],
        })),
      );
    }
    return request(key, url, options, (value) =>
      parseCollection(value, universeSchema, "Universe").map((raw) => ({
        kind: "universe" as const,
        id: raw.id,
        name: raw.name,
        description: text(raw.description),
        imageUrl: asset(text(raw.imagePath), options.channel),
        skinlineIds: raw.skinlineIds ?? raw.skinSets ?? [],
      })),
    );
  }

  function get(
    kind: RuntimeEntityKind,
    id: number,
    input: RuntimeRequestOptions,
  ): Promise<RuntimeEntity> {
    const options = validateOptions(input);
    if (!Number.isSafeInteger(id) || id <= 0)
      return Promise.reject(
        new CommunityDragonRuntimeError(
          "invalid-request",
          "Entity ID must be a positive safe integer",
        ),
      );
    if (
      kind === "skin" &&
      (!Number.isSafeInteger(options.championId) ||
        (options.championId ?? 0) <= 0)
    ) {
      return Promise.reject(
        new CommunityDragonRuntimeError(
          "invalid-request",
          "Skin details require a positive champion hint",
        ),
      );
    }
    if (kind === "skinline" || kind === "universe") {
      const listKind = kind === "skinline" ? "skinlines" : "universes";
      return list(listKind, options).then((items) => {
        const result = items.find(
          (item) => item.kind === kind && item.id === id,
        );
        if (!result)
          throw new CommunityDragonRuntimeError(
            "not-found",
            `${kind} ${id} was not found`,
          );
        return result as RuntimeSkinline | RuntimeUniverse;
      });
    }

    const championId = kind === "skin" ? options.championId! : id;
    const url = communityDragonChampionUrl(
      String(championId),
      localePath(options.locale),
      options.channel,
    );
    const key = makeKey(kind, id, options);
    return request(key, url, options, (value) => {
      let raw: z.infer<typeof championDetailSchema>;
      try {
        raw = championDetailSchema.parse(value);
      } catch (error) {
        throw new CommunityDragonRuntimeError(
          "schema",
          `Champion ${championId} detail failed validation`,
          { url, cause: error },
        );
      }
      if (raw.id !== championId)
        throw new CommunityDragonRuntimeError(
          "schema",
          `Champion detail ID ${raw.id} does not match ${championId}`,
          { url },
        );
      const skins = raw.skins.map((skin) =>
        normalizeSkin(skin, options.channel, championId),
      );
      if (kind === "champion") {
        const labels = championLabels(raw, options.locale);
        return {
          kind: "champion" as const,
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
          { url },
        );
      return skin;
    });
  }

  return { list, get };
}
