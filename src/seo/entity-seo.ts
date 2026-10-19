import { localizedPath, localeConfig, type Locale } from '../i18n/config';
import { SITE } from './site';

export function createEntitySeo(kind: string, slug: string | undefined, name: string, description: string, locale: Locale, image?: string) {
  const path = slug ? `/${kind}/${slug}/` : `/${kind}/`;
  const canonical = new URL(localizedPath(locale, path), SITE.origin).toString();
  const isDetail = kind.endsWith('/detail');
  const isCollection = !slug && !isDetail;
  const isZh = locale === 'zh-cn';
  const section = kind.split('/')[0];
  const sectionLabels: Record<string, Record<Locale, string>> = {
    champions: { 'zh-cn': '英雄', en: 'Champions' },
    skins: { 'zh-cn': '皮肤', en: 'Skins' },
    skinlines: { 'zh-cn': '皮肤系列', en: 'Skinlines' },
    universes: { 'zh-cn': '宇宙', en: 'Universes' },
    'pbe-additions': { 'zh-cn': 'PBE 新增', en: 'PBE additions' },
  };
  const sectionLabel = sectionLabels[section]?.[locale] ?? name;
  const homeUrl = new URL(localizedPath(locale, '/'), SITE.origin).toString();
  const gameUrl = new URL(localizedPath(locale, '/#home-tools-title'), SITE.origin).toString();
  const sectionUrl = new URL(localizedPath(locale, `/${section}/`), SITE.origin).toString();
  const gameName = isZh ? '英雄联盟' : 'League of Legends';
  const title = `${isCollection ? `${gameName} ` : ''}${name} | ${SITE.name}`;
  const itemListElement = [
    { '@type': 'ListItem', position: 1, name: isZh ? '首页' : 'Home', item: homeUrl },
    { '@type': 'ListItem', position: 2, name: gameName, item: gameUrl },
    ...(isDetail ? [{ '@type': 'ListItem', position: 3, name: sectionLabels[section]?.[locale] ?? section, item: sectionUrl }] : []),
    { '@type': 'ListItem', position: isDetail ? 4 : 3, name: isDetail ? name : sectionLabel, item: canonical },
  ];
  return {
    title,
    description,
    canonical,
    image: image ?? SITE.defaultImage,
    jsonLd: [
      { '@context': 'https://schema.org', '@type': slug || isDetail ? 'WebPage' : 'CollectionPage', name, description, url: canonical, inLanguage: localeConfig[locale].htmlLang },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement },
    ],
  };
}
