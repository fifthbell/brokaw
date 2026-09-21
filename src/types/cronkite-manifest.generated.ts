/* eslint-disable */
/** Generated from the normative JSON Schema. Do not edit by hand. */

/**
 * This interface was referenced by `CronkiteDeclarativeTemplateManifest`'s JSON-Schema
 * via the `definition` "safePath".
 */
export type SafePath = string;

export interface CronkiteDeclarativeTemplateManifest {
  package: string;
  version: string;
  templateRendering: TemplateRendering;
}
/**
 * This interface was referenced by `CronkiteDeclarativeTemplateManifest`'s JSON-Schema
 * via the `definition` "templateRendering".
 */
export interface TemplateRendering {
  contract: "cronkite.templates";
  contractVersion: 1;
  partials: {
    [k: string]: TemplateReference;
  };
  helperConfig: HelperConfig;
  embedRegistry: {
    [k: string]: Embed;
  };
  renderables: {
    [k: string]: Renderable;
  };
  staticAssets: {
    [k: string]: StaticAsset;
  };
  systemPages: SystemPage[];
}
/**
 * This interface was referenced by `CronkiteDeclarativeTemplateManifest`'s JSON-Schema
 * via the `definition` "templateReference".
 *
 * This interface was referenced by `CronkiteDeclarativeTemplateManifest`'s JSON-Schema
 * via the `definition` "partial".
 */
export interface TemplateReference {
  entry: SafePath;
  partials: string[];
}
/**
 * This interface was referenced by `CronkiteDeclarativeTemplateManifest`'s JSON-Schema
 * via the `definition` "helperConfig".
 */
export interface HelperConfig {
  siteName: string;
  defaultLanguage: string;
  /**
   * @minItems 1
   */
  supportedLanguages: [string, ...string[]];
  prefixDefaultLocale: boolean;
  dateLocale: string;
  timeZone: string;
  homepageTitles: {
    [k: string]: string;
  };
  layoutTitleFallbacks: {
    [k: string]: string;
  };
  titleSeparator: string;
  defaultSocialImageUrl: string | null;
}
/**
 * This interface was referenced by `CronkiteDeclarativeTemplateManifest`'s JSON-Schema
 * via the `definition` "embed".
 */
export interface Embed {
  urlTemplate: string;
  parameters: {
    [k: string]: EmbedParameter;
  };
}
/**
 * This interface was referenced by `CronkiteDeclarativeTemplateManifest`'s JSON-Schema
 * via the `definition` "embedParameter".
 */
export interface EmbedParameter {
  type: "string" | "integer";
  pattern?: string;
  /**
   * @minItems 1
   */
  enum?: [unknown, ...unknown[]];
  default?: string | number;
  minimum?: number;
  maximum?: number;
}
/**
 * This interface was referenced by `CronkiteDeclarativeTemplateManifest`'s JSON-Schema
 * via the `definition` "renderable".
 */
export interface Renderable {
  template: TemplateReference;
  inputSchema: SafePath;
  contentType: string;
  raster?: Raster;
}
/**
 * This interface was referenced by `CronkiteDeclarativeTemplateManifest`'s JSON-Schema
 * via the `definition` "raster".
 */
export interface Raster {
  format: "png" | "jpeg" | "webp";
  width: number;
  height: number;
}
/**
 * This interface was referenced by `CronkiteDeclarativeTemplateManifest`'s JSON-Schema
 * via the `definition` "staticAsset".
 */
export interface StaticAsset {
  source: SafePath;
  contentType: string;
  cacheControl: string;
}
/**
 * This interface was referenced by `CronkiteDeclarativeTemplateManifest`'s JSON-Schema
 * via the `definition` "systemPage".
 */
export interface SystemPage {
  renderable: string;
  contentType: string;
  cacheControl: string;
  /**
   * @minItems 1
   */
  variants: [SystemVariant, ...SystemVariant[]];
}
/**
 * This interface was referenced by `CronkiteDeclarativeTemplateManifest`'s JSON-Schema
 * via the `definition` "systemVariant".
 */
export interface SystemVariant {
  key: SafePath;
  document: {
    [k: string]: unknown;
  };
}
