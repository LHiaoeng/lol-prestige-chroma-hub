import {
  championCoverageCopy,
  type ChampionCoverageSnapshot,
} from '../domain/champion-coverage';
import { fetchChampionCoverage, type FetchLike } from '../data/champion-coverage';

interface RefreshOptions {
  readonly load: () => Promise<ChampionCoverageSnapshot>;
  readonly apply: (snapshot: ChampionCoverageSnapshot) => void;
  readonly fallback?: () => void;
}

interface ClientConfig {
  readonly coveredHeroIds: string[];
  readonly patchVersion: string;
}

export async function refreshChampionCoverage(options: RefreshOptions): Promise<boolean> {
  try {
    const snapshot = await options.load();
    options.apply(snapshot);
    return true;
  } catch {
    options.fallback?.();
    return false;
  }
}

function setCoverageStatus(document: Document, en: string, zh: string): void {
  document.querySelectorAll<HTMLElement>('[data-coverage-status]').forEach((element) => {
    element.textContent = element.dataset.coverageLanguage === 'zh' ? zh : en;
  });
}

export function applyChampionCoverage(document: Document, snapshot: ChampionCoverageSnapshot): void {
  const copy = championCoverageCopy(snapshot);
  document.querySelectorAll<HTMLElement>('[data-coverage-text]').forEach((element) => {
    const key = element.dataset.coverageText as keyof typeof copy;
    const value = copy[key];
    if (typeof value === 'string') element.textContent = value;
  });

  for (const list of document.querySelectorAll<HTMLUListElement>('[data-coverage-list]')) {
    const language = list.dataset.coverageList === 'zh' ? 'zh' : 'en';
    const fragment = document.createDocumentFragment();
    snapshot.champions.forEach((champion, index) => {
      const item = document.createElement('li');
      const number = document.createElement('span');
      number.className = 'champ-id';
      number.textContent = `${index + 1}.`;
      const image = document.createElement('img');
      image.className = 'champ-avatar';
      image.src = champion.portraitUrl;
      image.alt = '';
      image.width = 32;
      image.height = 32;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span');
      name.className = 'champ-name';
      name.textContent = language === 'zh' ? champion.nameZh : champion.nameEn;
      item.append(number, image, name);
      fragment.append(item);
    });
    list.replaceChildren(fragment);
  }
}

function readClientConfig(document: Document): ClientConfig {
  const configElement = document.querySelector<HTMLScriptElement>('#champion-coverage-config');
  if (!configElement?.textContent) throw new Error('Champion coverage config is missing');
  const value: unknown = JSON.parse(configElement.textContent);
  if (!value || typeof value !== 'object') throw new Error('Champion coverage config is invalid');
  const candidate = value as { coveredHeroIds?: unknown; patchVersion?: unknown };
  if (!Array.isArray(candidate.coveredHeroIds)
    || !candidate.coveredHeroIds.every((id) => typeof id === 'string')
    || typeof candidate.patchVersion !== 'string') {
    throw new Error('Champion coverage config is invalid');
  }
  return { coveredHeroIds: candidate.coveredHeroIds, patchVersion: candidate.patchVersion };
}

export function initializeChampionCoverageRefresh(
  document: Document,
  fetcher: FetchLike = fetch,
): Promise<boolean> {
  let config: ClientConfig;
  try {
    config = readClientConfig(document);
  } catch {
    setCoverageStatus(
      document,
      'Live refresh unavailable; showing the build snapshot.',
      '实时刷新暂不可用，当前显示构建快照。',
    );
    return Promise.resolve(false);
  }

  return refreshChampionCoverage({
    load: () => fetchChampionCoverage(fetcher, config.coveredHeroIds, config.patchVersion),
    apply: (snapshot) => {
      applyChampionCoverage(document, snapshot);
      setCoverageStatus(
        document,
        'Live data refreshed from CommunityDragon.',
        '已从 CommunityDragon 刷新实时数据。',
      );
    },
    fallback: () => setCoverageStatus(
      document,
      'Live refresh unavailable; showing the build snapshot.',
      '实时刷新暂不可用，当前显示构建快照。',
    ),
  });
}
