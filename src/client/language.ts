import { nextLanguage, resolveLanguage, type Language } from '../i18n';

const storageKey = 'chroma-art-language';

export function currentLanguage(document: Document): Language {
  return resolveLanguage(document.documentElement.dataset.language);
}

export function applyLanguage(document: Document, language: Language): void {
  document.documentElement.dataset.language = language;
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll<HTMLElement>('[data-en][data-zh]').forEach((element) => {
    element.textContent = element.dataset[language] ?? element.dataset.en ?? '';
  });
  document.querySelectorAll<HTMLElement>('[data-aria-en][data-aria-zh]').forEach((element) => {
    element.setAttribute('aria-label', element.dataset[`aria${language[0].toUpperCase()}${language.slice(1)}`] ?? element.dataset.ariaEn ?? '');
  });
  document.querySelectorAll<HTMLInputElement>('[data-placeholder-en][data-placeholder-zh]').forEach((element) => {
    element.placeholder = element.dataset[`placeholder${language[0].toUpperCase()}${language.slice(1)}`] ?? element.dataset.placeholderEn ?? '';
  });
  document.querySelectorAll<HTMLImageElement>('[data-alt-en][data-alt-zh]').forEach((element) => {
    element.alt = element.dataset[`alt${language[0].toUpperCase()}${language.slice(1)}`] ?? element.dataset.altEn ?? '';
  });
  document.documentElement.dataset.languageReady = '';
}

export function initializeLanguage(document: Document, storage: Storage): void {
  const language = currentLanguage(document);
  applyLanguage(document, language);
  document.querySelector<HTMLElement>('[data-language-toggle]')?.addEventListener('click', () => {
    const next = nextLanguage(currentLanguage(document));
    storage.setItem(storageKey, next);
    applyLanguage(document, next);
    document.dispatchEvent(new CustomEvent('languagechange', { detail: next }));
  });
}
