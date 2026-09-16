export const layoutFiles = {
  "article-page": "article-page.hbs",
  homepage: "homepage.hbs",
  "category-page": "category-page.hbs",
  "search-page": "search-page.hbs",
  "404": "404.hbs",
  "live-story": "live-story.hbs",
  "link-in-bio": "link-in-bio.hbs",
  "media-page": "media-page.hbs",
  "standalone-page": "standalone-page.hbs",
} as const;

export type LayoutName = keyof typeof layoutFiles;

export const layoutNames = Object.freeze(
  Object.keys(layoutFiles) as [LayoutName, ...LayoutName[]],
);
