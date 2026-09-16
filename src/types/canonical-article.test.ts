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
});
