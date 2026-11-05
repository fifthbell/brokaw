import { readFile } from "node:fs/promises";
import { describe, expect, expectTypeOf, it } from "vitest";
import { canonicalArticleSchema } from "./canonical-article.js";
import type { CronkiteCanonicalDocument } from "./canonical-document.generated.js";
import { canonicalDocumentSchema } from "./canonical-document-schema.generated.js";

const normativeSchemaUrl = new URL(
  "../schemas/canonical-document.schema.json",
  import.meta.url,
);
const generatedTypesUrl = new URL(
  "./canonical-document.generated.ts",
  import.meta.url,
);

const mediaDocument = {
  id: "fictional-media-page",
  slug: "/mediathek",
  layout: "media-page",
  canonicalUrl: "https://example.test/mediathek",
  contentVersion: "2026-10-19T00:00:00.000Z",
  publishedAt: "2026-10-19T00:00:00.000Z",
  updatedAt: "2026-10-19T00:00:00.000Z",
  status: "published",
  title: "Fictional Mediathek",
  language: "en",
  featured: false,
  body: [],
  assignmentMediaBaseUrl: "https://photos.example.test/contents/assignments/",
} satisfies CronkiteCanonicalDocument;

describe("generated canonical document schema", () => {
  it("is the normative JSON Schema, byte for byte in content", async () => {
    const normative = JSON.parse(await readFile(normativeSchemaUrl, "utf8"));
    expect(canonicalDocumentSchema).toEqual(normative);
  });

  it("declares the canonical document contract identity", () => {
    expect(canonicalDocumentSchema["x-contract"]).toBe(
      "cronkite.canonical-document",
    );
    expect(canonicalDocumentSchema["x-contract-version"]).toBe(1);
    expect(canonicalDocumentSchema.oneOf).toHaveLength(2);
  });

  it("requires a completed assignment directory only for media-page", () => {
    const [otherLayouts, variant] = canonicalDocumentSchema.oneOf;
    expect(otherLayouts.properties.layout.const).toBe("article-page");
    expect("allOf" in otherLayouts).toBe(false);
    const [rule] = variant.allOf;
    expect(rule.if.properties.layout.const).toBe("media-page");
    expect(rule.then.required).toEqual(["assignmentMediaBaseUrl"]);
    expect(variant.properties.layout.enum).toContain("media-page");

    expect(canonicalArticleSchema.parse(mediaDocument)).toMatchObject({
      layout: "media-page",
    });
    const { assignmentMediaBaseUrl: _omitted, ...withoutBase } = mediaDocument;
    expect(() => canonicalArticleSchema.parse(withoutBase)).toThrow(
      "Canonical document validation failed",
    );
    expect(() =>
      canonicalArticleSchema.parse({
        ...mediaDocument,
        assignmentMediaBaseUrl: "https://photos.example.test/other/",
      }),
    ).toThrow("Canonical document validation failed");
    const { assignmentMediaBaseUrl: _unused, ...homepageShape } = mediaDocument;
    expect(
      canonicalArticleSchema.parse({ ...homepageShape, layout: "homepage" })
        .layout,
    ).toBe("homepage");
  });
});

describe("generated canonical document types", () => {
  it("export types only and no runtime values", async () => {
    const generated = await import("./canonical-document.generated.js");
    expect(Object.keys(generated)).toEqual([]);
  });

  it("type the media-page directory as an optional string", () => {
    type PageDocument = Exclude<
      CronkiteCanonicalDocument,
      { layout: "article-page" }
    >;
    expectTypeOf<PageDocument["assignmentMediaBaseUrl"]>().toEqualTypeOf<
      string | undefined
    >();
    expectTypeOf<CronkiteCanonicalDocument["layout"]>().toEqualTypeOf<
      | "article-page"
      | "homepage"
      | "category-page"
      | "search-page"
      | "404"
      | "coming-soon"
      | "live-story"
      | "link-in-bio"
      | "media-page"
      | "standalone-page"
    >();
  });

  it("list exactly the layouts the schema accepts", async () => {
    const source = await readFile(generatedTypesUrl, "utf8");
    const [articleVariant, pageVariant] = canonicalDocumentSchema.oneOf;
    const schemaLayouts = [
      articleVariant.properties.layout.const,
      ...pageVariant.properties.layout.enum,
    ];
    for (const layout of schemaLayouts) {
      expect(source).toContain(`"${layout}"`);
    }
    expect(source.startsWith("/* eslint-disable */")).toBe(true);
    expect(source).toContain("Do not edit by hand");
  });
});
