/**
 * Joy Club Peak Gala sessions — 心悦巅峰盛典往期活动数据
 *
 * Each session entry carries the session number, its counting window,
 * the blog article slug, and the reward chroma lookup key so pages can
 * render a cross-session history section without duplicating facts.
 */

export interface JoyClubPeakGalaSession {
  /** Session identifier used in event URLs and article slugs, e.g. "202606". */
  sessionId: string;
  /** Full event URL for the official page. */
  eventUrl: string;
  /** Blog article slug for this session's article page. */
  articleSlug: string;
  /** Counting window start date (ISO). */
  windowStart: string;
  /** Counting window end date (ISO). */
  windowEnd: string;
  /** Hero ID of the reward chroma. */
  rewardHeroId: string;
  /** Base skin English name of the reward chroma. */
  rewardSkinNameEn: string;
  /** Reward chroma English name for catalog lookup. */
  rewardChromaNameEn: string;
}

export const joyClubPeakGalaSessions: readonly JoyClubPeakGalaSession[] = [
  {
    sessionId: '202606',
    eventUrl: 'https://act.xinyue.qq.com/act/joyclubgala202607/index.html',
    articleSlug: 'joy-club-peak-gala-202606',
    windowStart: '2026-07-01',
    windowEnd: '2026-07-31',
    rewardHeroId: '904',
    rewardSkinNameEn: 'Immortal Journey Zaahen',
    rewardChromaNameEn: 'Immortal Journey Zaahen (Pearl)',
  },
  {
    sessionId: '202607',
    eventUrl: 'https://act.xinyue.qq.com/act/joyclubgala202608/index.html',
    articleSlug: 'joy-club-peak-gala-202607',
    windowStart: '2026-08-01',
    windowEnd: '2026-08-31',
    rewardHeroId: '10',
    rewardSkinNameEn: 'Spirit Blossom Kayle',
    rewardChromaNameEn: 'Spirit Blossom Kayle (Tanzanite)',
  },
  {
    sessionId: '202608',
    eventUrl: 'https://act.xinyue.qq.com/act/joyclubgala202609/index.html',
    articleSlug: 'joy-club-peak-gala-202608',
    windowStart: '2026-09-01',
    windowEnd: '2026-09-30',
    rewardHeroId: '266',
    rewardSkinNameEn: 'Primordian Aatrox',
    rewardChromaNameEn: 'Primordian Aatrox (Sapphire)',
  },
];
