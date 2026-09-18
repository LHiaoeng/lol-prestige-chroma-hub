/** Convert an English CommunityDragon champion name into a stable URL slug. */
export function championSlug(name: string): string {
  const normalized = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!normalized) throw new Error(`Cannot create champion slug from name: ${name}`);
  return normalized;
}
