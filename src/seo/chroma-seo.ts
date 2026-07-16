import type { Chroma } from '../domain/chroma';
import { imageUrl } from '../domain/chroma';
import { SITE } from './site';

export function chromaImageAlt(name: string): string {
  return `${name} China Exclusive Prestige Chroma splash art`;
}

function descriptionSubject(chroma: Chroma): string {
  return chroma.nameEn.toLowerCase().includes(chroma.skinNameEn.toLowerCase())
    ? chroma.nameEn
    : `${chroma.nameEn} for ${chroma.skinNameEn}`;
}

export function createChromaSeo(chroma: Chroma) {
  const canonical = `${SITE.origin}/chromas/${chroma.slug}/`;
  const image = imageUrl(chroma.images.large);
  const description = `Explore ${descriptionSubject(chroma)}, a China Exclusive Prestige Chroma in League of Legends, with unique splash art and patch ${chroma.gameVer} details.`;
  return {
    title: `${chroma.nameEn} China Exclusive Prestige Chroma Splash Art | ${SITE.name}`,
    description,
    canonical,
    image,
    imageAlt: chromaImageAlt(chroma.nameEn),
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        name: chroma.nameEn,
        url: canonical,
        contentUrl: image,
        representativeOfPage: true,
        description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.origin}/` },
          { '@type': 'ListItem', position: 2, name: chroma.skinNameEn },
          { '@type': 'ListItem', position: 3, name: chroma.nameEn, item: canonical },
        ],
      },
    ],
  };
}
