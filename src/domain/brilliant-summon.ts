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
  /** Every self-select chroma explicitly featured by this session. */
  rewards: readonly BrilliantSummonReward[];
  /** Point costs for each summon when the official session publishes a price curve. */
  drawCosts?: readonly number[];
}

export interface BrilliantSummonReward {
  heroId: string;
  skinNameEn: string;
  chromaNameEn: string;
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
    rewards: [
      { heroId: '498', skinNameEn: 'Battle Academia Xayah', chromaNameEn: 'Battle Academia Xayah (Sapphire)' },
      { heroId: '22', skinNameEn: 'Lunar Empress Ashe', chromaNameEn: 'Lunar Empress Ashe  (Rose Quartz)' },
    ],
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
    rewards: [
      { heroId: '84', skinNameEn: 'Spirit Blossom Akali', chromaNameEn: 'Spirit Blossom Akali (Pearl)' },
      { heroId: '887', skinNameEn: 'Soul Fighter Gwen', chromaNameEn: 'Soul Fighter Gwen (Sapphire)' },
    ],
    drawCosts: [1200, 1800, 2400, 3000, 3600, 4200, 4800, 6000, 12000, 18000],
  },
  {
    sessionId: '202621',
    eventUrl: 'https://lol.qq.com/act/a202609170214tendraws36/index.html',
    articleSlug: 'prestige-chroma-summon-2026-21',
    windowStart: '2026-09-17',
    windowEnd: '2026-10-18',
    rewardHeroId: '134',
    rewardSkinNameEn: 'Dumpling Darlings Syndra',
    rewardChromaNameEn: 'Dumpling Darlings Syndra (Pearl)',
    rewards: [
      { heroId: '134', skinNameEn: 'Dumpling Darlings Syndra', chromaNameEn: 'Dumpling Darlings Syndra (Pearl)' },
      { heroId: '81', skinNameEn: 'Faerie Court Ezreal', chromaNameEn: 'Faerie Court Ezreal (Rose Quartz)' },
    ],
    drawCosts: [1200, 1800, 2400, 3000, 3600, 4200, 4800, 6000, 12000, 18000],
  },
];
