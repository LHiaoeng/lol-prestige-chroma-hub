export interface LocalizedArticleLink {
  readonly href: string;
  readonly labelEn: string;
  readonly labelZh: string;
  readonly external?: boolean;
}

export interface EvergreenGuideMaintenance {
  readonly updatedAt: string;
  readonly sources: readonly LocalizedArticleLink[];
  readonly related: readonly [LocalizedArticleLink, LocalizedArticleLink];
}

export type EvergreenGuideSlug =
  | 'what-is-league-of-legends'
  | 'what-are-chroma-skins'
  | 'what-are-prestige-chromas'
  | 'kaisa-prestige-chroma'
  | 'champion-most-prestige-chromas'
  | 'champions-without-prestige-chroma';

const catalogSource: LocalizedArticleLink = {
  href: '/',
  labelEn: 'LoL Chroma Art catalog snapshot',
  labelZh: 'LoL Chroma Art 图鉴数据快照',
};

const tencentPrestigeSource: LocalizedArticleLink = {
  href: 'https://lol.qq.com/act/a202608077548tendraws34/index.html',
  labelEn: 'Tencent League of Legends — Brilliant Prestige Chroma Summoning',
  labelZh: '腾讯《英雄联盟》— 璀璨臻彩召唤',
  external: true,
};

const guide = (href: string, labelEn: string, labelZh: string): LocalizedArticleLink => ({
  href,
  labelEn,
  labelZh,
});

export const evergreenGuideMaintenance = {
  'what-is-league-of-legends': {
    updatedAt: '2026-08-25',
    sources: [{
      href: 'https://www.leagueoflegends.com/en-us/how-to-play/',
      labelEn: 'Riot Games — How to Play League of Legends',
      labelZh: 'Riot Games —《英雄联盟》玩法介绍',
      external: true,
    }],
    related: [
      guide('/blog/what-are-chroma-skins/', 'What are chromas?', '什么是炫彩？'),
      guide('/blog/what-are-prestige-chromas/', 'What are Prestige Chromas?', '什么是臻彩？'),
    ],
  },
  'what-are-chroma-skins': {
    updatedAt: '2026-08-25',
    sources: [{
      href: 'https://na.leagueoflegends.com/en/featured/skins/chromas',
      labelEn: 'Riot Games — Chromas 1.1',
      labelZh: 'Riot Games — 炫彩 1.1 专题',
      external: true,
    }],
    related: [
      guide('/blog/what-is-league-of-legends/', 'League of Legends beginner guide', '《英雄联盟》新手指南'),
      guide('/blog/what-are-prestige-chromas/', 'Prestige Chroma guide', '臻彩专题'),
    ],
  },
  'what-are-prestige-chromas': {
    updatedAt: '2026-08-25',
    sources: [
      tencentPrestigeSource,
      {
        href: 'https://lol.qq.com/act/a2023lpl10celebration2s/index.html?pos=2',
        labelEn: 'Tencent League of Legends — LPL 10th Anniversary Prestige Chromas',
        labelZh: '腾讯《英雄联盟》— LPL 十周年纪念臻彩',
        external: true,
      },
    ],
    related: [
      guide('/blog/what-are-chroma-skins/', 'Chroma fundamentals', '炫彩基础介绍'),
      guide('/blog/kaisa-prestige-chroma/', 'Kai\u2019Sa Prestige Chroma gallery', '卡莎臻彩原画图鉴'),
    ],
  },
  'kaisa-prestige-chroma': {
    updatedAt: '2026-08-25',
    sources: [catalogSource, tencentPrestigeSource],
    related: [
      guide('/blog/what-are-prestige-chromas/', 'Prestige Chroma guide', '臻彩专题'),
      guide('/blog/champion-most-prestige-chromas/', 'Prestige Chroma leaderboard', '臻彩数量排行榜'),
    ],
  },
  'champion-most-prestige-chromas': {
    updatedAt: '2026-08-25',
    sources: [catalogSource, tencentPrestigeSource],
    related: [
      guide('/blog/kaisa-prestige-chroma/', 'Kai\u2019Sa Prestige Chroma gallery', '卡莎臻彩原画图鉴'),
      guide('/blog/champions-without-prestige-chroma/', 'Champions without Prestige Chroma splash art', '尚无臻彩原画的英雄'),
    ],
  },
  'champions-without-prestige-chroma': {
    updatedAt: '2026-08-25',
    sources: [
      catalogSource,
      {
        href: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json',
        labelEn: 'CommunityDragon — current champion summary',
        labelZh: 'CommunityDragon — 当前英雄列表',
        external: true,
      },
    ],
    related: [
      guide('/blog/what-are-prestige-chromas/', 'Prestige Chroma guide', '臻彩专题'),
      guide('/blog/champion-most-prestige-chromas/', 'Prestige Chroma leaderboard', '臻彩数量排行榜'),
    ],
  },
} as const satisfies Record<EvergreenGuideSlug, EvergreenGuideMaintenance>;
