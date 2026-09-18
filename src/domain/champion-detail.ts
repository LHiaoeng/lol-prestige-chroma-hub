import { z } from 'zod';
import { communityDragonAssetUrl } from './communitydragon-url';
import { championSlug } from './champion-route';

const localizedChampionSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1),
  title: z.string().trim().min(1),
  shortBio: z.string().trim().min(1),
  squarePortraitPath: z.string().trim().min(1),
  skins: z.array(z.object({
    id: z.number().int().positive(),
    name: z.string().trim().min(1),
    isBase: z.boolean(),
    splashPath: z.string().trim().min(1),
  })).min(1),
});

export interface ChampionLocaleDetail {
  readonly name: string;
  readonly title: string;
  readonly shortBio: string;
}

export interface ChampionDetail {
  readonly id: string;
  readonly slug: string;
  readonly en: ChampionLocaleDetail;
  readonly zh: ChampionLocaleDetail;
  readonly portraitUrl: string;
  readonly splashUrl: string;
  readonly skins: readonly ChampionSkin[];
}

export interface ChampionSkin {
  readonly id: number;
  readonly nameEn: string;
  readonly nameZh: string;
  readonly isBase: boolean;
  readonly splashUrl: string;
  readonly splashUrlZh: string;
}

function localizedDetail(input: unknown, expectedId: number, language: string) {
  const champion = localizedChampionSchema.parse(input);
  if (champion.id !== expectedId) {
    throw new Error(`${language} champion ID ${champion.id} does not match requested ID ${expectedId}`);
  }
  const baseSkin = champion.skins.find((skin) => skin.isBase);
  if (!baseSkin) throw new Error(`${language} champion ${expectedId} has no base skin`);
  return { champion, baseSkin };
}

export function buildChampionDetail(
  englishInput: unknown,
  chineseInput: unknown,
  requestedId: string,
): ChampionDetail {
  if (!/^[1-9]\d*$/.test(requestedId) || !Number.isSafeInteger(Number(requestedId))) {
    throw new Error('Invalid champion ID');
  }
  const expectedId = Number(requestedId);
  const english = localizedDetail(englishInput, expectedId, 'English');
  const chinese = localizedDetail(chineseInput, expectedId, 'Chinese');
  const chineseSkins = new Map(chinese.champion.skins.map((skin) => [skin.id, skin]));
  if (chineseSkins.size !== chinese.champion.skins.length) throw new Error(`Duplicate Chinese skin ID for champion ${expectedId}`);
  const englishSkinIds = new Set(english.champion.skins.map((skin) => skin.id));
  if (englishSkinIds.size !== english.champion.skins.length) throw new Error(`Duplicate English skin ID for champion ${expectedId}`);
  if (englishSkinIds.size !== chineseSkins.size) throw new Error(`English and Chinese skin sets differ for champion ${expectedId}`);
  const skins = english.champion.skins.map((skin) => {
    const chineseSkin = chineseSkins.get(skin.id);
    if (!chineseSkin) throw new Error(`Missing Chinese skin ${skin.id} for champion ${expectedId}`);
    if (skin.isBase !== chineseSkin.isBase) throw new Error(`Base skin mismatch for champion ${expectedId}, skin ${skin.id}`);
    return {
      id: skin.id,
      nameEn: skin.name,
      nameZh: chineseSkin.name,
      isBase: skin.isBase,
      splashUrl: communityDragonAssetUrl(skin.splashPath),
      splashUrlZh: communityDragonAssetUrl(chineseSkin.splashPath),
    };
  });
  return {
    id: requestedId,
    slug: championSlug(english.champion.name),
    en: {
      name: english.champion.name,
      title: english.champion.title,
      shortBio: english.champion.shortBio,
    },
    zh: {
      // CommunityDragon's zh_cn payload uses name for the epithet and title for the champion name.
      name: chinese.champion.title,
      title: chinese.champion.name,
      shortBio: chinese.champion.shortBio,
    },
    portraitUrl: communityDragonAssetUrl(english.champion.squarePortraitPath),
    splashUrl: communityDragonAssetUrl(english.baseSkin.splashPath),
    skins,
  };
}
