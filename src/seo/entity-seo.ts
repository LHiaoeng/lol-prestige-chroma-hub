import { localizedPath, localeConfig, type Locale } from '../i18n/config';
import { SITE } from './site';

export function createEntitySeo(kind: string, slug: string | undefined, name: string, description: string, locale: Locale, image?: string) {
  const path = slug ? `/${kind}/${slug}/` : `/${kind}/`;
  const canonical = new URL(localizedPath(locale, path), SITE.origin).toString();
  const title = `${name} | ${SITE.name}`;
  return {
    title,
    description,
    canonical,
    image: image ?? SITE.defaultImage,
    jsonLd: [{ '@context': 'https://schema.org', '@type': slug ? 'WebPage' : 'CollectionPage', name, description, url: canonical, inLanguage: localeConfig[locale].htmlLang }, { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: locale === 'zh-cn' ? '首页' : 'Home', item: new URL(localizedPath(locale, '/'), SITE.origin).toString() }, { '@type': 'ListItem', position: 2, name, item: canonical }] }],
  };
}
