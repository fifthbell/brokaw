import { distributeHomepageArticles } from '../src/homepage-distributor';
import { searchCopyByLanguage } from '../src/search-copy';
import type { CanonicalArticle } from '../src/types/canonical-article';

type Language = keyof typeof searchCopyByLanguage;

const notFoundCopy = {
  en: { homeLinkLabel: 'Go to Homepage', categoriesLabel: 'Or explore our categories:' },
  es: { homeLinkLabel: 'Ir al inicio', categoriesLabel: 'O explora nuestras categorías:' },
  it: { homeLinkLabel: 'Vai alla home page', categoriesLabel: 'Oppure esplora le nostre categorie:' },
} as const;

export function completeDocument(document: CanonicalArticle, now = new Date()): CanonicalArticle {
  const language = (document.language in searchCopyByLanguage ? document.language : 'en') as Language;
  const body = document.body.map((block) => {
    if (block.type === 'x' && !('tweetId' in block)) {
      return { ...block, tweetId: block.url.match(/\/status\/(\d+)/)?.[1] ?? '' };
    }
    if (block.type === 'tiktok' && !('videoId' in block)) {
      return { ...block, videoId: block.url.match(/\/video\/(\d+)/)?.[1] ?? '' };
    }
    return block;
  }) as CanonicalArticle['body'];
  const imageUrl = document.seo?.ogImage ?? document.featuredImage?.url;
  const socialImageUrl = imageUrl?.replace(/\.avif$/i, '.jpg');
  const showBreakingNews = Boolean(document.breakingNews) && (document as Record<string, unknown>).showBreakingNews !== false;

  return {
    ...document,
    body,
    logoLink: language === 'en' ? '/' : `/${language}`,
    heroUrl: document.canonicalUrl,
    ...(document.layout === 'homepage'
      ? { homepageSlots: distributeHomepageArticles(document.articles ?? [], now, showBreakingNews) }
      : {}),
    ...(document.layout === 'search-page' ? { searchCopy: searchCopyByLanguage[language] } : {}),
    ...(document.layout === 'live-story' ? { statusVariant: 'info' } : {}),
    ...(document.layout === '404' ? notFoundCopy[language] : {}),
    seo: {
      ...document.seo,
      ...(socialImageUrl
        ? { socialImage: { url: socialImageUrl, alt: document.featuredImage?.alt || document.title } }
        : {}),
    },
  };
}
