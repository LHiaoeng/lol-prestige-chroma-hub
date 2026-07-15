export const supportedLanguages = ['en', 'zh'] as const;
export type Language = typeof supportedLanguages[number];
export const defaultLanguage: Language = 'en';

const categoryNames: Record<string, Record<Language, string>> = {
  '1': { en: 'Lunar Revel Mythic Chroma', zh: '生肖限定臻彩' },
  '2': { en: 'Crystalis Motus Chroma', zh: '钻石臻彩' },
  '3': { en: 'Golden Chroma', zh: '炫金臻彩' },
  '4': { en: 'Mythic Chroma', zh: '臻彩' },
  '7': { en: 'LPL 10th Anniversary', zh: 'LPL十周年纪念' },
};

export function resolveLanguage(value: string | null | undefined): Language {
  return supportedLanguages.includes(value as Language) ? value as Language : defaultLanguage;
}

export function nextLanguage(language: Language): Language {
  const index = supportedLanguages.indexOf(language);
  return supportedLanguages[(index + 1) % supportedLanguages.length];
}

export function localized(language: Language, values: Record<Language, string>): string {
  return values[language] ?? values[defaultLanguage];
}

export function categoryName(categoryId: string, language: Language): string {
  return categoryNames[categoryId]?.[language] ?? categoryNames[categoryId]?.[defaultLanguage] ?? 'Chroma';
}
