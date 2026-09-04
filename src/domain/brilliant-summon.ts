/**
 * Brilliant Prestige Chroma Summoning sessions — 璀璨臻彩召唤往期活动数据
 *
 * Each session entry carries the session number, its event window,
 * the blog article slug, and the grand-prize chroma lookup key so pages
 * can render a cross-session history section without duplicating facts.
 */

export interface BrilliantSummonSession {
  /** Official display period number (期号) from nav.js, e.g. "202620" for the 20th session of 2026. */
  sessionId: string;
  /** Full event URL for the official page. */
  eventUrl: string;
  /** Blog article slug for this session's article page. */
  articleSlug: string;
  /** Event window start date (ISO). */
  windowStart: string;
  /** Event window end date (ISO). */
  windowEnd: string;
  /** Hero ID of the grand-prize chroma. */
  rewardHeroId: string;
  /** Base skin English name of the grand-prize chroma. */
  rewardSkinNameEn: string;
  /** Grand-prize chroma English name for catalog lookup. */
  rewardChromaNameEn: string;
}

export const brilliantSummonSessions: readonly BrilliantSummonSession[] = [
  {
    sessionId: '202619',
    eventUrl: 'https://lol.qq.com/act/a202608077548tendraws34/index.html',
    articleSlug: 'prestige-chroma-summon-august-2026',
    windowStart: '2026-08-07',
    windowEnd: '2026-09-06',
    rewardHeroId: '498',
    rewardSkinNameEn: 'Battle Academia Xayah',
    rewardChromaNameEn: 'Battle Academia Xayah (Sapphire)',
  },
  {
    sessionId: '202620',
    eventUrl: 'https://lol.qq.com/act/a202609047293tendraws35/index.html',
    articleSlug: 'prestige-chroma-summon-september-2026',
    windowStart: '2026-09-04',
    windowEnd: '2026-10-04',
    rewardHeroId: '84',
    rewardSkinNameEn: 'Spirit Blossom Akali',
    rewardChromaNameEn: 'Spirit Blossom Akali (Pearl)',
  },
];
