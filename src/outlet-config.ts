export const outletConfig = {
  siteName: 'fifthbell',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'it'],
  prefixDefaultLocale: false,
  defaultAuthor: {
    name: 'Fifthbell Newsroom',
    slug: 'fifthbell-newsroom'
  },
  defaultCategory: {
    name: 'Top Stories',
    slug: 'top-stories'
  },
  linkInBioRoute: '/instagram',
  searchTitle: 'Search',
  searchDescriptions: {
    en: 'Search stories from Fifthbell.',
    es: 'Busca noticias de Fifthbell.',
    it: 'Cerca notizie Fifthbell.'
  },
  socialLanguages: ['en'],
  socialUserAgent: 'Cronkite/1.0'
} as const;
