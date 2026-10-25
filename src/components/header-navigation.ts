const browsePaths = ['/pbe-additions/', '/champions/', '/skins/', '/skinlines/', '/universes/'] as const;

export function headerNavigationState(pathname: string) {
  const path = pathname.replace(/^\/zh-cn(?=\/)/, '');
  return {
    browsePath: browsePaths.find((prefix) => path.startsWith(prefix)),
    current: (target: string, section = target): 'page' | 'location' | undefined =>
      path.startsWith(section) ? (path === target ? 'page' : 'location') : undefined,
  };
}
