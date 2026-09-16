/* eslint-disable */
/** Generated from the normative JSON Schema. Do not edit by hand. */

/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "name".
 */
export type Name = string;
/**
 * Permissive lexical envelope including grandfathered and private-use tags; a standards-compliant BCP 47 parser is authoritative.
 *
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "languageTag".
 */
export type LanguageTag = string;
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "safePrefix".
 */
export type SafePrefix = string;
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "systemPage".
 */
export type SystemPage = {
  /**
   * Required layout that must occur in the top-level layouts array. No omission default.
   */
  layout: string;
  /**
   * Required public route, optionally with one {language} token. No omission default.
   */
  route: string;
  /**
   * Required safe relative object key, optionally with one {language} token. No omission default.
   */
  key: string;
  /**
   * Required Cache-Control field value. No omission default.
   */
  cacheControl: string;
  /**
   * Required switch controlling language expansion. No omission default.
   */
  perLanguage: boolean;
  /**
   * Required language-to-copy map. No omission default.
   */
  copy: {
    [k: string]: Copy;
  };
};
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "renderable".
 */
export type Renderable = (
  | {
      engine?: "handlebars";
      outputMode?: "single";
      contentType: string;
      export: unknown;
      entry?: never;
      compositionId?: never;
      width?: never;
      height?: never;
      [k: string]: unknown;
    }
  | {
      engine?: "handlebars";
      outputMode: "files";
      export: unknown;
      entry?: never;
      compositionId?: never;
      contentType?: never;
      width?: never;
      height?: never;
      key?: never;
      [k: string]: unknown;
    }
  | {
      engine?: "html-raster";
      outputMode?: "single";
      contentType: string;
      export: unknown;
      width: unknown;
      height: unknown;
      entry?: never;
      compositionId?: never;
      [k: string]: unknown;
    }
  | {
      engine?: "remotion";
      outputMode?: "single";
      contentType: string;
      entry: unknown;
      compositionId: unknown;
      export?: never;
      width?: never;
      height?: never;
      [k: string]: unknown;
    }
) & {
  /**
   * Required bounded CPS rendering engine. No omission default.
   */
  engine: "handlebars" | "html-raster" | "remotion";
  /**
   * Function export required by handlebars and html-raster. No omission default.
   */
  export?: string;
  /**
   * Packed package entry required by remotion. No omission default.
   */
  entry?: string;
  /**
   * Composition selector required by remotion. No omission default.
   */
  compositionId?: string;
  /**
   * Optional result mode; files uses the FileEntry array ABI.
   */
  outputMode?: "single" | "files";
  /**
   * Optional request-derived or CLS-version-derived lifecycle.
   */
  lifecycle?: "request" | "basement";
  /**
   * Media type required for a single output and forbidden for a file set.
   */
  contentType?: string;
  /**
   * Positive pixel width required by html-raster.
   */
  width?: number;
  /**
   * Positive pixel height required by html-raster.
   */
  height?: number;
  /**
   * Output key required only for a basement single output.
   */
  key?: string;
  /**
   * Optional packed draft-2020-12 input-schema path.
   */
  inputSchema?: string;
  resources?: Resources;
  contract?: OpaqueContract;
};
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "resource".
 */
export type Resource = {
  /**
   * Required CMS-owned resource key, optionally with one {language} token.
   */
  key: string;
  /**
   * Required packed draft-2020-12 JSON Schema path.
   */
  schema: string;
  /**
   * Required resource media type.
   */
  contentType: string;
  /**
   * Optional language-expansion switch.
   */
  perLanguage?: boolean;
};
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "safeKey".
 */
export type SafeKey = string;
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "javascriptIdentifier".
 */
export type JavascriptIdentifier = string;
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "safeKeyWithLanguage".
 */
export type SafeKeyWithLanguage = string;
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "siteRouteWithLanguage".
 */
export type SiteRouteWithLanguage = string;
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "packageEntry".
 */
export type PackageEntry = string;
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "mediaType".
 */
export type MediaType = string;

/**
 * Machine-readable structural contract for a Cronkite-compatible Component Library System manifest. Semantic cross-field and package checks are specified in ../validation.md.
 */
export interface CronkiteCLSManifest {
  /**
   * Required contract discriminator. No omission default.
   */
  contract: "cronkite.cls";
  /**
   * Required manifest contract version. No omission default.
   */
  contractVersion: 1;
  /**
   * Required npm package name without a version. No omission default.
   */
  package: string;
  /**
   * Required exact SemVer package version. No omission default.
   */
  version: string;
  /**
   * Required authoritative set of page layouts. No omission default.
   *
   * @minItems 1
   */
  layouts: [Name, ...Name[]];
  /**
   * Required supported BCP 47 language tags. No omission default.
   *
   * @minItems 1
   */
  languages: [LanguageTag, ...LanguageTag[]];
  /**
   * Optional layout-to-canonical-JSON-prefix map. Supplying the object replaces the whole default map.
   */
  collections?: {
    [k: string]: SafePrefix;
  };
  routing?: Routing;
  /**
   * Optional system-generated pages. Expanded route/key uniqueness is a semantic validation rule.
   */
  systemPages?: SystemPage[];
  /**
   * Optional explicit page or asset renderables in the same namespace as layouts.
   */
  renderables?: {
    [k: string]: Renderable;
  };
  /**
   * Optional package file capabilities recognized by contract version 1.
   */
  capabilities?: {
    fonts?: Capability;
    assets?: Capability;
  };
  /**
   * Optional operation-local final-write declarations.
   */
  writeOrdering?: {
    [k: string]: WriteOrderingRule;
  };
}
/**
 * Optional HTML object-key derivation rules.
 */
export interface Routing {
  /**
   * Optional safe relative template containing {path} exactly once.
   */
  htmlKeyTemplate?: string;
  /**
   * Optional safe relative root-route object key.
   */
  rootKey?: string;
}
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "copy".
 */
export interface Copy {
  /**
   * Required non-empty fictional or outlet-owned page title. No omission default.
   */
  title: string;
  /**
   * Required non-empty fictional or outlet-owned page description. No omission default.
   */
  description: string;
}
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "resources".
 */
export interface Resources {
  [k: string]: Resource;
}
/**
 * Producer-owned contract metadata. The CPS validates kind/version and treats every other member as opaque.
 *
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "opaqueContract".
 */
export interface OpaqueContract {
  kind: string;
  version: number;
  [k: string]: unknown;
}
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "capability".
 */
export interface Capability {
  /**
   * Required function export. No omission default.
   */
  export: string;
}
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "writeOrderingRule".
 */
export interface WriteOrderingRule {
  /**
   * Required ordered final-write keys. No omission default.
   *
   * @minItems 1
   */
  last: [SafeKey, ...SafeKey[]];
}
/**
 * This interface was referenced by `CronkiteCLSManifest`'s JSON-Schema
 * via the `definition` "routing".
 */
export interface Routing1 {
  /**
   * Optional safe relative template containing {path} exactly once.
   */
  htmlKeyTemplate?: string;
  /**
   * Optional safe relative root-route object key.
   */
  rootKey?: string;
}
