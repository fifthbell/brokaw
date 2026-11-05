import { describe, expect, it } from "vitest";
import { canonicalArticleSchema } from "./canonical-article.js";

const document = {
  id: "5f55c9cf-56d0-48ec-8b5c-4474d94a612f",
  slug: "story",
  layout: "article-page",
  canonicalUrl: "https://example.test/story",
  contentVersion: "2026-09-15T12:00:00.000Z",
  publishedAt: "2026-09-15T12:00:00.000Z",
  updatedAt: "2026-09-15T12:00:00.000Z",
  status: "published",
  title: "Story",
  language: "fr-CA",
  featured: false,
  authors: [],
  categories: [],
  body: [],
};

describe("canonical document adapter", () => {
  it("accepts the CPS-03 open BCP 47 language set", () => {
    expect(canonicalArticleSchema.parse(document).language).toBe("fr-CA");
  });

  it("rejects documents outside the generated normative schema", () => {
    expect(() =>
      canonicalArticleSchema.parse({ ...document, language: "not a tag!" }),
    ).toThrow("Canonical document validation failed");
  });

  it.each([
    "https://photos.example.test/contents/assignments/",
    "http://127.0.0.1:18768/fictional-bucket/prefix/contents/assignments/",
    "HtTpS://photos.example.test/encoded%20prefix/contents/assignments/",
  ])("preserves the completed media-page directory %s", (base) => {
    expect(canonicalArticleSchema.parse({
      ...document, layout: "media-page", assignmentMediaBaseUrl: base,
    }).assignmentMediaBaseUrl).toBe(base);
  });

  it.each([
    undefined,
    "",
    " https://photos.example.test/contents/assignments/",
    "https://photos.example.test/contents/assignments/\n",
    "/contents/assignments/",
    "ftp://photos.example.test/contents/assignments/",
    "https://user:password@photos.example.test/contents/assignments/",
    "https://photos.example.test/contents/assignments/?token=fictional",
    "https://photos.example.test/contents/assignments/#fragment",
    "https://photos.example.test/contents/assignments/?",
    "https://photos.example.test/contents/assignments/#",
    "https://pho\ntos.example.test/contents/assignments/",
    "https://photos.example.test/pre\tfix/contents/assignments/",
    "https://photos.example.test/pre\u2028fix/contents/assignments/",
    "https://photos.example.test/prefix\\bucket/contents/assignments/",
    "https://photos.example.test/contents/assignments",
    "https://photos.example.test/contents/media/",
    "http://127.0.0.1:999999/contents/assignments/",
  ])("refuses an incomplete or unusable media-page directory %s", (base) => {
    expect(() => canonicalArticleSchema.parse({
      ...document, layout: "media-page", assignmentMediaBaseUrl: base,
    })).toThrow("Canonical document validation failed");
  });

  it("keeps other layouts and unrelated canonical extensions independent of the media directory", () => {
    for (const layout of ["article-page", "standalone-page", "search-page"]) {
      const parsed = canonicalArticleSchema.parse({
        ...document, layout, fictionalExtension: { enabled: true },
      });
      expect(parsed).not.toHaveProperty("assignmentMediaBaseUrl");
      expect(parsed.fictionalExtension).toEqual({ enabled: true });
    }
  });
});
