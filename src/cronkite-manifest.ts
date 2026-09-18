import { layoutNames } from "./layouts.js";
import { outletConfig } from "./outlet-config.js";
import {
  PROGRAM_TEMPLATE_CONTRACT_VERSION,
  PROGRAM_TEMPLATE_KIND,
} from "./program-template-manifest.js";
import type { CronkiteCLSManifest } from "./types/cronkite-manifest.generated.js";
import { version } from "./version.js";

const systemPages: NonNullable<CronkiteCLSManifest["systemPages"]> = [
  {
    layout: "404",
    route: "/{language}/404",
    key: "html/{language}/404/index.html",
    cacheControl: "public, max-age=0, must-revalidate",
    perLanguage: true,
    copy: {
      en: {
        title: "Page Not Found",
        description: "The page you are looking for does not exist.",
      },
      es: {
        title: "Página no encontrada",
        description: "La página que buscas no existe.",
      },
      it: {
        title: "Pagina non trovata",
        description: "La pagina che stai cercando non esiste.",
      },
    },
  },
  {
    layout: "search-page",
    route: "/{language}/search",
    key: "html/{language}/search/index.html",
    cacheControl: "public, max-age=0, must-revalidate",
    perLanguage: true,
    copy: {
      en: {
        title: "Search",
        description: outletConfig.searchDescriptions.en,
      },
      es: {
        title: "Buscar",
        description: outletConfig.searchDescriptions.es,
      },
      it: {
        title: "Cerca",
        description: outletConfig.searchDescriptions.it,
      },
    },
  },
];

export const cronkiteManifest = {
  contract: "cronkite.cls",
  contractVersion: 1,
  package: "@fifthbell/brokaw",
  version,
  layouts: [...layoutNames],
  languages: [...outletConfig.supportedLanguages],
  collections: {
    "article-page": "json/articles",
    "standalone-page": "json/pages",
    "media-page": "json/media",
  },
  systemPages,
  renderables: {
    homepage: {
      engine: "handlebars",
      export: "render",
      contentType: "text/html; charset=utf-8",
      inputSchema: "dist/schemas/feed-renderable-input.schema.json",
    },
    "category-page": {
      engine: "handlebars",
      export: "render",
      contentType: "text/html; charset=utf-8",
      inputSchema: "dist/schemas/feed-renderable-input.schema.json",
    },
    "search-page": {
      engine: "handlebars",
      export: "render",
      contentType: "text/html; charset=utf-8",
      inputSchema: "dist/schemas/feed-renderable-input.schema.json",
    },
    "live-story": {
      engine: "handlebars",
      export: "render",
      contentType: "text/html; charset=utf-8",
      inputSchema: "dist/schemas/feed-renderable-input.schema.json",
    },
    "link-in-bio": {
      engine: "handlebars",
      export: "render",
      contentType: "text/html; charset=utf-8",
      inputSchema: "dist/schemas/feed-renderable-input.schema.json",
    },
    "social-image": {
      engine: "html-raster",
      export: "buildInstagramImageHtml",
      contentType: "image/jpeg",
      width: 1080,
      height: 1350,
    },
    "short-video": {
      engine: "remotion",
      entry: "dist/video/index.js",
      compositionId: "BrokawShort",
      contentType: "video/mp4",
    },
    "live-program": {
      engine: "handlebars",
      export: "liveProgramReleaseFiles",
      outputMode: "files",
      lifecycle: "request",
      inputSchema: "dist/schemas/live-program-release-input.schema.json",
      contract: {
        kind: PROGRAM_TEMPLATE_KIND,
        version: PROGRAM_TEMPLATE_CONTRACT_VERSION,
      },
    },
  },
  capabilities: {
    fonts: { export: "fontFiles" },
  },
  writeOrdering: {
    "live-program": { last: ["html/program.html"] },
  },
} as const satisfies CronkiteCLSManifest;
