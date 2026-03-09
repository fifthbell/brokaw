import { z } from 'zod';

const isoDateTime = z.string().datetime();

const authorSchema = z.object({
  name: z.string(),
  slug: z.string()
});

const categorySchema = z.object({
  name: z.string(),
  slug: z.string()
});

const featuredImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  caption: z.string().optional()
});

const heroSchema = z.object({
  url: z.string(),
  alt: z.string()
});

const bodyBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('richText'),
    html: z.string()
  }),
  z.object({
    type: z.literal('heading'),
    text: z.string(),
    level: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2)
  }),
  z.object({
    type: z.literal('image'),
    url: z.string(),
    alt: z.string(),
    caption: z.string().optional()
  }),
  z.object({
    type: z.literal('list'),
    ordered: z.boolean().default(false),
    items: z.array(z.string()).min(1)
  }),
  z.object({
    type: z.literal('divider')
  }),
  z.object({
    type: z.literal('infoBox'),
    title: z.string().optional(),
    tone: z.enum(['neutral', 'info', 'warning', 'success']).default('neutral'),
    html: z.string()
  }),
  z.object({
    type: z.literal('keyPoints'),
    title: z.string().default('Key Points'),
    points: z.array(z.string()).min(1)
  }),
  z.object({
    type: z.literal('relatedLinks'),
    title: z.string().default('Related Coverage'),
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string().url()
        })
      )
      .min(1)
  }),
  z.object({
    type: z.literal('dataTable'),
    caption: z.string().optional(),
    headers: z.array(z.string()).min(1),
    rows: z.array(z.array(z.string())).min(1)
  }),
  z.object({
    type: z.literal('liveUpdate'),
    timestamp: isoDateTime,
    headline: z.string(),
    html: z.string().optional()
  }),
  z.object({
    type: z.literal('audio'),
    url: z.string().url(),
    title: z.string().optional(),
    caption: z.string().optional()
  }),
  z.object({
    type: z.literal('youtube'),
    videoId: z.string()
  }),
  z.object({
    type: z.literal('x'),
    url: z.string().url()
  }),
  z.object({
    type: z.literal('instagram'),
    url: z.string().url()
  }),
  z.object({
    type: z.literal('tiktok'),
    url: z.string().url()
  }),
  z.object({
    type: z.literal('pullQuote'),
    text: z.string(),
    attribution: z.string().optional()
  })
]);

const articleReferenceSchema = z
  .object({
    id: z.string().uuid(),
    url: z.string(),
    title: z.string(),
    excerpt: z.string().optional(),
    time: z.string().optional(),
    categories: z.array(categorySchema).default([]),
    hero: heroSchema.optional(),
    featuredImage: featuredImageSchema.optional(),
    updatedAt: isoDateTime.optional(),
    publishedAt: isoDateTime.optional()
  })
  .passthrough();

export const canonicalArticleSchema = z
  .object({
    id: z.coerce.string(),
    slug: z.string(),
    layout: z.enum(['article-page', 'homepage', 'category-page', '404']),
    canonicalUrl: z.string(),
    contentVersion: isoDateTime,
    publishedAt: isoDateTime,
    updatedAt: isoDateTime,
    status: z.enum(['draft', 'published']),
    title: z.string(),
    dek: z.string().optional(),
    excerpt: z.string().optional(),
    language: z.enum(['en', 'es', 'it']),
    originalArticleId: z.string().optional(),
    featured: z.boolean(),
    authors: z.array(authorSchema),
    categories: z.array(categorySchema),
    featuredImage: featuredImageSchema.optional(),
    hero: heroSchema.optional(),
    body: z.array(bodyBlockSchema),
    seo: z
      .object({
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        ogImage: z.string().optional()
      })
      .optional(),
    navigation: z
      .object({
        categories: z.array(categorySchema)
      })
      .optional(),
    articles: z.array(articleReferenceSchema).optional(),
    heroSlides: z
      .array(
        z.object({
          image: z.string(),
          alt: z.string().optional()
        })
      )
      .optional(),
    breakingNews: z
      .object({
        displayClass: z.string().optional(),
        sidebarFeature: z
          .object({
            category: z.string(),
            title: z.string(),
            url: z.string(),
            image: z.string(),
            excerpt: z.string().optional()
          })
          .optional(),
        sidebarSub: z
          .object({
            category: z.string(),
            title: z.string(),
            url: z.string(),
            image: z.string(),
            alt: z.string().optional(),
            readTime: z.string().optional(),
            excerpt: z.string().optional()
          })
          .optional(),
        main: z
          .object({
            category: z.string(),
            title: z.string(),
            url: z.string(),
            image: z.string(),
            alt: z.string().optional(),
            excerpt: z.string().optional()
          })
          .optional(),
        updates: z
          .array(
            z.object({
              time: z.string(),
              text: z.string()
            })
          )
          .optional(),
        snacks: z
          .array(
            z.object({
              category: z.string().optional(),
              readTime: z.string().optional(),
              title: z.string(),
              url: z.string(),
              excerpt: z.string().optional(),
              image: z.string().optional(),
              alt: z.string().optional()
            })
          )
          .optional()
      })
      .optional()
  })
  .passthrough();

export type SelfReference = z.infer<typeof articleReferenceSchema>;
export type CanonicalArticle = z.infer<typeof canonicalArticleSchema>;
