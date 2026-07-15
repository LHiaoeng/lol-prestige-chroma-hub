import rawCatalog from '../../data/prestige-chromas.json';
import { parseCatalog } from '../domain/chroma';

export const catalog = parseCatalog(rawCatalog).sort((a, b) => b.rank - a.rank || b.skinId - a.skinId);
