export const outletConfig = {
  siteName: 'fifthbell',
  publicSiteUrl: 'https://fifthbell.com',
  cdnUrl: 'https://cdn.fifthbell.com',
  contentPath: '/content',
  inventoryFilename: 'cronkite-inventory.json',
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
  socialUserAgent: 'Cronkite/1.0',
  socialImageExport: 'buildInstagramImageHtml',
  hashtagServiceBaseUrl: 'http://192.168.0.99:8000'
} as const;
