import { lolCosmeticCatalogs } from '../domain/lol-cosmetics';

const browsePaths = ['/prestige-chromas/', '/pbe-additions/', '/champions/', '/skins/', '/skinlines/', '/universes/', ...lolCosmeticCatalogs.map(({ slug }) => `/${slug}/`)];

export function headerNavigationState(pathname: string) {
  const path = pathname.replace(/^\/zh-cn(?=\/)/, '');
  return {
    browsePath: browsePaths.find((prefix) => path.startsWith(prefix)),
    current: (target: string, section = target): 'page' | 'location' | undefined =>
      path.startsWith(section) ? (path === target ? 'page' : 'location') : undefined,
  };
}
