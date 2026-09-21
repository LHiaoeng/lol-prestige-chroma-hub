import {
  communityDragonChampionUrl,
  communityDragonDataUrl,
} from "../domain/communitydragon-url";
import {
  projectRuntimeSkinTarget,
  projectSkinlineReferenceItems,
  type RuntimeSkinReferenceItem,
} from "../domain/skin-reference-projection";
import {
  CommunityDragonRuntimeError,
  normalizeRuntimeOptions,
  parseRuntimeEntity,
  parseRuntimeList,
  parseRuntimeSkinCollection,
  type CommunityDragonLocale,
  type RuntimeChannel,
  type RuntimeChampion,
  type RuntimeEntity,
  type RuntimeEntityKind,
  type RuntimeList,
  type RuntimeListKind,
  type RuntimeSkin,
} from "../domain/communitydragon-runtime";

export type RuntimeFetcher = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export interface RuntimeRequestOptions {
  readonly locale: CommunityDragonLocale;
  readonly channel?: RuntimeChannel;
  readonly signal?: AbortSignal;
  readonly championId?: number;
  readonly stageId?: number;
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
  listSkinlineSkins(
    skinlineId: number,
    options: RuntimeRequestOptions,
  ): Promise<readonly RuntimeSkinReferenceItem[]>;
}

interface CacheEntry {
  readonly controller: AbortController;
  readonly consumers: Set<symbol>;
  readonly promise: Promise<unknown>;
  settled: boolean;
}

const DEFAULT_CHANNEL: RuntimeChannel = "pbe";

function abortError(): CommunityDragonRuntimeError {
  return new CommunityDragonRuntimeError(
    "aborted",
    "CommunityDragon request was cancelled",
  );
}

export function createCommunityDragonRuntime(
  fetcher: RuntimeFetcher = fetch,
): CommunityDragonRuntime {
  const completed = new Map<string, unknown>();
  const inFlight = new Map<string, CacheEntry>();

  function validateOptions(
    options: RuntimeRequestOptions,
  ): Required<Pick<RuntimeRequestOptions, "locale" | "channel">> &
    Pick<RuntimeRequestOptions, "signal" | "championId" | "stageId"> {
    const normalized = normalizeRuntimeOptions({
      locale: options.locale,
      channel: options.channel ?? DEFAULT_CHANNEL,
      championId: options.championId,
      stageId: options.stageId,
    });
    return {
      locale: normalized.locale,
      channel: normalized.channel,
      signal: options.signal,
      championId: normalized.championId,
      stageId: normalized.stageId,
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
    const key = `${options.channel}:${options.locale}:list:${kind}`;
    return request(key, url, options, (value) =>
      parseRuntimeList(kind, value, options),
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
    )
      return Promise.reject(
        new CommunityDragonRuntimeError(
          "invalid-request",
          "Skin details require a positive champion hint",
        ),
      );
    if (
      kind === "skin" &&
      options.stageId !== undefined &&
      (!Number.isSafeInteger(options.stageId) || options.stageId <= 0)
    )
      return Promise.reject(
        new CommunityDragonRuntimeError(
          "invalid-request",
          "Stage ID must be a positive safe integer",
        ),
      );
    if (kind === "skinline" || kind === "universe") {
      const listKind = kind === "skinline" ? "skinlines" : "universes";
      const url = communityDragonDataUrl(
        `${listKind}.json`,
        options.locale,
        options.channel,
      );
      const key = `${options.channel}:${options.locale}:entity:${kind}:${id}`;
      return request(key, url, options, (value) =>
        parseRuntimeEntity(kind, id, value, options),
      );
    }

    const championId = kind === "skin" ? options.championId! : id;
    const url = communityDragonChampionUrl(
      String(championId),
      options.locale === "zh_cn" ? "zh" : "en",
      options.channel,
    );
    if (kind === "skin") {
      const key = `${options.channel}:${options.locale}:champion-resource:${championId}`;
      return request<RuntimeChampion>(key, url, options, (value) =>
        parseRuntimeEntity("champion", championId, value, {
          ...options,
          stageId: undefined,
        }) as RuntimeChampion,
      ).then((champion) => {
        const skin = champion.skins.find(
          (candidate) => candidate.id === id,
        ) as RuntimeSkin | undefined;
        if (!skin)
          throw new CommunityDragonRuntimeError(
            "not-found",
            `Skin ${id} was not found for champion ${championId}`,
          );
        const stage = projectRuntimeSkinTarget(skin, options.stageId);
        if (!stage)
          throw new CommunityDragonRuntimeError(
            "not-found",
            `Stage ${options.stageId} was not found for skin ${id} of champion ${championId}`,
          );
        return { ...stage, championName: champion.name };
      });
    }
    const key = `${options.channel}:${options.locale}:entity:${kind}:${id}:${options.championId ?? ""}`;
    return request(key, url, options, (value) =>
      parseRuntimeEntity(kind, id, value, options),
    );
  }

  function listSkinlineSkins(
    skinlineId: number,
    input: RuntimeRequestOptions,
  ): Promise<readonly RuntimeSkinReferenceItem[]> {
    const options = validateOptions(input);
    if (!Number.isSafeInteger(skinlineId) || skinlineId <= 0)
      return Promise.reject(
        new CommunityDragonRuntimeError(
          "invalid-request",
          "Skinline ID must be a positive safe integer",
        ),
      );
    const url = communityDragonDataUrl(
      "skins.json",
      options.locale,
      options.channel,
    );
    const key = `${options.channel}:${options.locale}:skin-collection`;
    return request(key, url, options, (value) =>
      projectSkinlineReferenceItems(
        parseRuntimeSkinCollection(value, options),
        skinlineId,
      ),
    );
  }

  return { list, get, listSkinlineSkins };
}
