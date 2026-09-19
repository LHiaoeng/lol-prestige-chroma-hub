const originalFetch = globalThis.fetch;

globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input?.url;
  if (url && url.includes('raw.communitydragon.org')) {
    throw new Error(`Offline build blocked CommunityDragon request: ${url}`);
  }
  return originalFetch(input, init);
};
