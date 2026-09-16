/* eslint-disable */
/** Generated from the normative JSON Schema. Do not edit by hand. */
export const canonicalDocumentSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://cronkite.invalid/schemas/canonical-document-v1.schema.json",
  "x-contract": "cronkite.canonical-document",
  "x-contract-version": 1,
  oneOf: [
    {
      type: "object",
      properties: {
        id: {
          type: "string",
          minLength: 1,
        },
        slug: {
          type: "string",
          minLength: 1,
        },
        canonicalUrl: {
          type: "string",
          minLength: 1,
        },
        contentVersion: {
          type: "string",
          format: "date-time",
          pattern:
            "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
        },
        publishedAt: {
          type: "string",
          format: "date-time",
          pattern:
            "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          pattern:
            "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
        },
        status: {
          type: "string",
          enum: ["draft", "published"],
        },
        title: {
          type: "string",
        },
        dek: {
          type: "string",
        },
        excerpt: {
          type: "string",
        },
        language: {
          type: "string",
          pattern:
            "^(?:(?:[A-Za-z]{2,3}(?:-[A-Za-z]{3}){0,3}|[A-Za-z]{4}|[A-Za-z]{5,8})(?:-[A-Za-z]{4})?(?:-(?:[A-Za-z]{2}|[0-9]{3}))?(?:-(?:[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(?:-[0-9A-WY-Za-wy-z](?:-[A-Za-z0-9]{2,8})+)*(?:-x(?:-[A-Za-z0-9]{1,8})+)?|x(?:-[A-Za-z0-9]{1,8})+)$",
          title: "BCP 47 language tag",
          description:
            "An open language tag. The active renderer declares the allowed set for each request.",
          examples: ["en", "pt-BR", "zh-Hant-TW"],
        },
        rumConfig: {
          type: "object",
          properties: {
            appMonitorId: {
              type: "string",
              minLength: 1,
            },
            applicationVersion: {
              type: "string",
              minLength: 1,
            },
            region: {
              type: "string",
              minLength: 1,
            },
            identityPoolId: {
              type: "string",
              minLength: 1,
            },
            guestRoleArn: {
              type: "string",
              minLength: 1,
            },
          },
          required: [
            "appMonitorId",
            "applicationVersion",
            "region",
            "identityPoolId",
            "guestRoleArn",
          ],
        },
        sofascore_id: {
          type: "integer",
          exclusiveMinimum: 0,
          maximum: 9007199254740991,
        },
        originalArticleId: {
          type: "string",
        },
        updatedVersion: {
          type: "object",
          properties: {
            id: {
              type: "string",
              minLength: 1,
            },
            title: {
              type: "string",
            },
            url: {
              type: "string",
              minLength: 1,
            },
          },
          required: ["id", "title", "url"],
        },
        featured: {
          type: "boolean",
        },
        featuredImage: {
          type: "object",
          properties: {
            url: {
              type: "string",
              minLength: 1,
            },
            alt: {
              type: "string",
            },
            caption: {
              type: "string",
            },
          },
          required: ["url", "alt"],
        },
        media: {
          type: "array",
          items: {
            type: "object",
            properties: {
              url: {
                type: "string",
                minLength: 1,
              },
              alt: {
                type: "string",
              },
              caption: {
                type: "string",
              },
            },
            required: ["url", "alt"],
          },
        },
        hero: {
          type: "object",
          properties: {
            url: {
              type: "string",
              minLength: 1,
            },
            alt: {
              type: "string",
            },
          },
          required: ["url", "alt"],
        },
        body: {
          type: "array",
          items: {
            oneOf: [
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "richText",
                  },
                  html: {
                    type: "string",
                  },
                },
                required: ["type", "html"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "heading",
                  },
                  text: {
                    type: "string",
                  },
                  level: {
                    anyOf: [
                      {
                        type: "number",
                        const: 2,
                      },
                      {
                        type: "number",
                        const: 3,
                      },
                      {
                        type: "number",
                        const: 4,
                      },
                    ],
                  },
                },
                required: ["type", "text"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "image",
                  },
                  url: {
                    type: "string",
                    minLength: 1,
                  },
                  alt: {
                    type: "string",
                  },
                  caption: {
                    type: "string",
                  },
                },
                required: ["type", "url", "alt"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "list",
                  },
                  ordered: {
                    type: "boolean",
                  },
                  items: {
                    minItems: 1,
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                required: ["type", "items"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "divider",
                  },
                },
                required: ["type"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "infoBox",
                  },
                  title: {
                    type: "string",
                  },
                  tone: {
                    type: "string",
                    enum: ["neutral", "info", "warning", "success"],
                  },
                  html: {
                    type: "string",
                  },
                },
                required: ["type", "html"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "keyPoints",
                  },
                  title: {
                    type: "string",
                  },
                  points: {
                    minItems: 1,
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                required: ["type", "points"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "dataTable",
                  },
                  caption: {
                    type: "string",
                  },
                  headers: {
                    minItems: 1,
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  rows: {
                    minItems: 1,
                    type: "array",
                    items: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                    },
                  },
                },
                required: ["type", "headers", "rows"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "liveUpdate",
                  },
                  timestamp: {
                    type: "string",
                    format: "date-time",
                    pattern:
                      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
                  },
                  headline: {
                    type: "string",
                  },
                  html: {
                    type: "string",
                  },
                  media: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        url: {
                          type: "string",
                          minLength: 1,
                        },
                        alt: {
                          type: "string",
                        },
                        caption: {
                          type: "string",
                        },
                      },
                      required: ["url", "alt"],
                    },
                  },
                },
                required: ["type", "timestamp", "headline"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "audio",
                  },
                  url: {
                    type: "string",
                    format: "uri",
                  },
                  title: {
                    type: "string",
                  },
                  caption: {
                    type: "string",
                  },
                },
                required: ["type", "url"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "youtube",
                  },
                  videoId: {
                    type: "string",
                    minLength: 1,
                  },
                },
                required: ["type", "videoId"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "x",
                  },
                  url: {
                    type: "string",
                    format: "uri",
                  },
                },
                required: ["type", "url"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "instagram",
                  },
                  url: {
                    type: "string",
                    format: "uri",
                  },
                },
                required: ["type", "url"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "tiktok",
                  },
                  url: {
                    type: "string",
                    format: "uri",
                  },
                },
                required: ["type", "url"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "spotify",
                  },
                  url: {
                    type: "string",
                    format: "uri",
                  },
                },
                required: ["type", "url"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "pullQuote",
                  },
                  text: {
                    type: "string",
                  },
                  attribution: {
                    type: "string",
                  },
                },
                required: ["type", "text"],
              },
            ],
          },
        },
        seo: {
          type: "object",
          properties: {
            metaTitle: {
              type: "string",
            },
            metaDescription: {
              type: "string",
            },
            ogImage: {
              type: "string",
            },
          },
        },
        navigation: {
          type: "object",
          properties: {
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    minLength: 1,
                  },
                  slug: {
                    type: "string",
                    minLength: 1,
                  },
                },
                required: ["name", "slug"],
              },
            },
          },
          required: ["categories"],
        },
        articles: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid",
                pattern:
                  "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
              },
              url: {
                type: "string",
                minLength: 1,
              },
              title: {
                type: "string",
              },
              excerpt: {
                type: "string",
              },
              time: {
                type: "string",
              },
              categories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      minLength: 1,
                    },
                    slug: {
                      type: "string",
                      minLength: 1,
                    },
                  },
                  required: ["name", "slug"],
                },
              },
              hero: {
                type: "object",
                properties: {
                  url: {
                    type: "string",
                    minLength: 1,
                  },
                  alt: {
                    type: "string",
                  },
                },
                required: ["url", "alt"],
              },
              featuredImage: {
                type: "object",
                properties: {
                  url: {
                    type: "string",
                    minLength: 1,
                  },
                  alt: {
                    type: "string",
                  },
                  caption: {
                    type: "string",
                  },
                },
                required: ["url", "alt"],
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                pattern:
                  "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
              },
              publishedAt: {
                type: "string",
                format: "date-time",
                pattern:
                  "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
              },
              featured: {
                type: "boolean",
              },
            },
            required: ["id", "url", "title"],
            additionalProperties: {},
          },
        },
        heroSlides: {
          type: "array",
          items: {
            type: "object",
            properties: {
              image: {
                type: "string",
              },
              alt: {
                type: "string",
              },
            },
            required: ["image"],
          },
        },
        heroLayout: {
          type: "string",
          enum: ["spotlight", "editorial"],
        },
        heroCategories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                minLength: 1,
              },
              slug: {
                type: "string",
                minLength: 1,
              },
            },
            required: ["name", "slug"],
          },
        },
        showHero: {
          type: "boolean",
        },
        showEditorialHero: {
          type: "boolean",
        },
        breakingNews: {
          type: "object",
          properties: {
            displayClass: {
              type: "string",
            },
            sidebarFeature: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                url: {
                  type: "string",
                },
                image: {
                  type: "string",
                },
                excerpt: {
                  type: "string",
                },
                publishedAt: {
                  type: "string",
                  format: "date-time",
                  pattern:
                    "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
                },
              },
              required: ["category", "title", "url", "image"],
            },
            sidebarSub: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                url: {
                  type: "string",
                },
                image: {
                  type: "string",
                },
                alt: {
                  type: "string",
                },
                readTime: {
                  type: "string",
                },
                excerpt: {
                  type: "string",
                },
              },
              required: ["category", "title", "url", "image"],
            },
            main: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                url: {
                  type: "string",
                },
                liveUrl: {
                  type: "string",
                },
                sofascore_id: {
                  type: "integer",
                  exclusiveMinimum: 0,
                  maximum: 9007199254740991,
                },
                image: {
                  type: "string",
                },
                alt: {
                  type: "string",
                },
                excerpt: {
                  type: "string",
                },
              },
              required: ["category", "title", "url", "image"],
            },
            updates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: {
                    type: "string",
                    format: "date-time",
                    pattern:
                      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
                  },
                  time: {
                    type: "string",
                  },
                  text: {
                    type: "string",
                  },
                  html: {
                    type: "string",
                  },
                },
              },
            },
            snacks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                  },
                  readTime: {
                    type: "string",
                  },
                  title: {
                    type: "string",
                  },
                  url: {
                    type: "string",
                  },
                  excerpt: {
                    type: "string",
                  },
                  image: {
                    type: "string",
                  },
                  alt: {
                    type: "string",
                  },
                },
                required: ["title", "url"],
              },
            },
          },
        },
        liveStory: {
          type: "object",
          properties: {
            lastUpdated: {
              type: "string",
            },
            keyPoints: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
        layout: {
          type: "string",
          const: "article-page",
        },
        authors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                minLength: 1,
              },
              slug: {
                type: "string",
                minLength: 1,
              },
            },
            required: ["name", "slug"],
          },
        },
        categories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                minLength: 1,
              },
              slug: {
                type: "string",
                minLength: 1,
              },
            },
            required: ["name", "slug"],
          },
        },
      },
      required: [
        "id",
        "slug",
        "canonicalUrl",
        "contentVersion",
        "publishedAt",
        "updatedAt",
        "status",
        "title",
        "language",
        "featured",
        "body",
        "layout",
        "authors",
        "categories",
      ],
      additionalProperties: {},
    },
    {
      type: "object",
      properties: {
        id: {
          type: "string",
          minLength: 1,
        },
        slug: {
          type: "string",
          minLength: 1,
        },
        canonicalUrl: {
          type: "string",
          minLength: 1,
        },
        contentVersion: {
          type: "string",
          format: "date-time",
          pattern:
            "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
        },
        publishedAt: {
          type: "string",
          format: "date-time",
          pattern:
            "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          pattern:
            "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
        },
        status: {
          type: "string",
          enum: ["draft", "published"],
        },
        title: {
          type: "string",
        },
        dek: {
          type: "string",
        },
        excerpt: {
          type: "string",
        },
        language: {
          type: "string",
          pattern:
            "^(?:(?:[A-Za-z]{2,3}(?:-[A-Za-z]{3}){0,3}|[A-Za-z]{4}|[A-Za-z]{5,8})(?:-[A-Za-z]{4})?(?:-(?:[A-Za-z]{2}|[0-9]{3}))?(?:-(?:[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(?:-[0-9A-WY-Za-wy-z](?:-[A-Za-z0-9]{2,8})+)*(?:-x(?:-[A-Za-z0-9]{1,8})+)?|x(?:-[A-Za-z0-9]{1,8})+)$",
          title: "BCP 47 language tag",
          description:
            "An open language tag. The active renderer declares the allowed set for each request.",
          examples: ["en", "pt-BR", "zh-Hant-TW"],
        },
        rumConfig: {
          type: "object",
          properties: {
            appMonitorId: {
              type: "string",
              minLength: 1,
            },
            applicationVersion: {
              type: "string",
              minLength: 1,
            },
            region: {
              type: "string",
              minLength: 1,
            },
            identityPoolId: {
              type: "string",
              minLength: 1,
            },
            guestRoleArn: {
              type: "string",
              minLength: 1,
            },
          },
          required: [
            "appMonitorId",
            "applicationVersion",
            "region",
            "identityPoolId",
            "guestRoleArn",
          ],
        },
        sofascore_id: {
          type: "integer",
          exclusiveMinimum: 0,
          maximum: 9007199254740991,
        },
        originalArticleId: {
          type: "string",
        },
        updatedVersion: {
          type: "object",
          properties: {
            id: {
              type: "string",
              minLength: 1,
            },
            title: {
              type: "string",
            },
            url: {
              type: "string",
              minLength: 1,
            },
          },
          required: ["id", "title", "url"],
        },
        featured: {
          type: "boolean",
        },
        featuredImage: {
          type: "object",
          properties: {
            url: {
              type: "string",
              minLength: 1,
            },
            alt: {
              type: "string",
            },
            caption: {
              type: "string",
            },
          },
          required: ["url", "alt"],
        },
        media: {
          type: "array",
          items: {
            type: "object",
            properties: {
              url: {
                type: "string",
                minLength: 1,
              },
              alt: {
                type: "string",
              },
              caption: {
                type: "string",
              },
            },
            required: ["url", "alt"],
          },
        },
        hero: {
          type: "object",
          properties: {
            url: {
              type: "string",
              minLength: 1,
            },
            alt: {
              type: "string",
            },
          },
          required: ["url", "alt"],
        },
        body: {
          type: "array",
          items: {
            oneOf: [
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "richText",
                  },
                  html: {
                    type: "string",
                  },
                },
                required: ["type", "html"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "heading",
                  },
                  text: {
                    type: "string",
                  },
                  level: {
                    anyOf: [
                      {
                        type: "number",
                        const: 2,
                      },
                      {
                        type: "number",
                        const: 3,
                      },
                      {
                        type: "number",
                        const: 4,
                      },
                    ],
                  },
                },
                required: ["type", "text"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "image",
                  },
                  url: {
                    type: "string",
                    minLength: 1,
                  },
                  alt: {
                    type: "string",
                  },
                  caption: {
                    type: "string",
                  },
                },
                required: ["type", "url", "alt"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "list",
                  },
                  ordered: {
                    type: "boolean",
                  },
                  items: {
                    minItems: 1,
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                required: ["type", "items"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "divider",
                  },
                },
                required: ["type"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "infoBox",
                  },
                  title: {
                    type: "string",
                  },
                  tone: {
                    type: "string",
                    enum: ["neutral", "info", "warning", "success"],
                  },
                  html: {
                    type: "string",
                  },
                },
                required: ["type", "html"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "keyPoints",
                  },
                  title: {
                    type: "string",
                  },
                  points: {
                    minItems: 1,
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                required: ["type", "points"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "dataTable",
                  },
                  caption: {
                    type: "string",
                  },
                  headers: {
                    minItems: 1,
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  rows: {
                    minItems: 1,
                    type: "array",
                    items: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                    },
                  },
                },
                required: ["type", "headers", "rows"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "liveUpdate",
                  },
                  timestamp: {
                    type: "string",
                    format: "date-time",
                    pattern:
                      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
                  },
                  headline: {
                    type: "string",
                  },
                  html: {
                    type: "string",
                  },
                  media: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        url: {
                          type: "string",
                          minLength: 1,
                        },
                        alt: {
                          type: "string",
                        },
                        caption: {
                          type: "string",
                        },
                      },
                      required: ["url", "alt"],
                    },
                  },
                },
                required: ["type", "timestamp", "headline"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "audio",
                  },
                  url: {
                    type: "string",
                    format: "uri",
                  },
                  title: {
                    type: "string",
                  },
                  caption: {
                    type: "string",
                  },
                },
                required: ["type", "url"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "youtube",
                  },
                  videoId: {
                    type: "string",
                    minLength: 1,
                  },
                },
                required: ["type", "videoId"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "x",
                  },
                  url: {
                    type: "string",
                    format: "uri",
                  },
                },
                required: ["type", "url"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "instagram",
                  },
                  url: {
                    type: "string",
                    format: "uri",
                  },
                },
                required: ["type", "url"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "tiktok",
                  },
                  url: {
                    type: "string",
                    format: "uri",
                  },
                },
                required: ["type", "url"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "spotify",
                  },
                  url: {
                    type: "string",
                    format: "uri",
                  },
                },
                required: ["type", "url"],
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    const: "pullQuote",
                  },
                  text: {
                    type: "string",
                  },
                  attribution: {
                    type: "string",
                  },
                },
                required: ["type", "text"],
              },
            ],
          },
        },
        seo: {
          type: "object",
          properties: {
            metaTitle: {
              type: "string",
            },
            metaDescription: {
              type: "string",
            },
            ogImage: {
              type: "string",
            },
          },
        },
        navigation: {
          type: "object",
          properties: {
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    minLength: 1,
                  },
                  slug: {
                    type: "string",
                    minLength: 1,
                  },
                },
                required: ["name", "slug"],
              },
            },
          },
          required: ["categories"],
        },
        articles: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid",
                pattern:
                  "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
              },
              url: {
                type: "string",
                minLength: 1,
              },
              title: {
                type: "string",
              },
              excerpt: {
                type: "string",
              },
              time: {
                type: "string",
              },
              categories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      minLength: 1,
                    },
                    slug: {
                      type: "string",
                      minLength: 1,
                    },
                  },
                  required: ["name", "slug"],
                },
              },
              hero: {
                type: "object",
                properties: {
                  url: {
                    type: "string",
                    minLength: 1,
                  },
                  alt: {
                    type: "string",
                  },
                },
                required: ["url", "alt"],
              },
              featuredImage: {
                type: "object",
                properties: {
                  url: {
                    type: "string",
                    minLength: 1,
                  },
                  alt: {
                    type: "string",
                  },
                  caption: {
                    type: "string",
                  },
                },
                required: ["url", "alt"],
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                pattern:
                  "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
              },
              publishedAt: {
                type: "string",
                format: "date-time",
                pattern:
                  "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
              },
              featured: {
                type: "boolean",
              },
            },
            required: ["id", "url", "title"],
            additionalProperties: {},
          },
        },
        heroSlides: {
          type: "array",
          items: {
            type: "object",
            properties: {
              image: {
                type: "string",
              },
              alt: {
                type: "string",
              },
            },
            required: ["image"],
          },
        },
        heroLayout: {
          type: "string",
          enum: ["spotlight", "editorial"],
        },
        heroCategories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                minLength: 1,
              },
              slug: {
                type: "string",
                minLength: 1,
              },
            },
            required: ["name", "slug"],
          },
        },
        showHero: {
          type: "boolean",
        },
        showEditorialHero: {
          type: "boolean",
        },
        breakingNews: {
          type: "object",
          properties: {
            displayClass: {
              type: "string",
            },
            sidebarFeature: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                url: {
                  type: "string",
                },
                image: {
                  type: "string",
                },
                excerpt: {
                  type: "string",
                },
                publishedAt: {
                  type: "string",
                  format: "date-time",
                  pattern:
                    "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
                },
              },
              required: ["category", "title", "url", "image"],
            },
            sidebarSub: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                url: {
                  type: "string",
                },
                image: {
                  type: "string",
                },
                alt: {
                  type: "string",
                },
                readTime: {
                  type: "string",
                },
                excerpt: {
                  type: "string",
                },
              },
              required: ["category", "title", "url", "image"],
            },
            main: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                url: {
                  type: "string",
                },
                liveUrl: {
                  type: "string",
                },
                sofascore_id: {
                  type: "integer",
                  exclusiveMinimum: 0,
                  maximum: 9007199254740991,
                },
                image: {
                  type: "string",
                },
                alt: {
                  type: "string",
                },
                excerpt: {
                  type: "string",
                },
              },
              required: ["category", "title", "url", "image"],
            },
            updates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: {
                    type: "string",
                    format: "date-time",
                    pattern:
                      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$",
                  },
                  time: {
                    type: "string",
                  },
                  text: {
                    type: "string",
                  },
                  html: {
                    type: "string",
                  },
                },
              },
            },
            snacks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                  },
                  readTime: {
                    type: "string",
                  },
                  title: {
                    type: "string",
                  },
                  url: {
                    type: "string",
                  },
                  excerpt: {
                    type: "string",
                  },
                  image: {
                    type: "string",
                  },
                  alt: {
                    type: "string",
                  },
                },
                required: ["title", "url"],
              },
            },
          },
        },
        liveStory: {
          type: "object",
          properties: {
            lastUpdated: {
              type: "string",
            },
            keyPoints: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
        layout: {
          type: "string",
          enum: [
            "homepage",
            "category-page",
            "search-page",
            "404",
            "coming-soon",
            "live-story",
            "link-in-bio",
            "media-page",
            "standalone-page",
          ],
        },
        authors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                minLength: 1,
              },
              slug: {
                type: "string",
                minLength: 1,
              },
            },
            required: ["name", "slug"],
          },
        },
        categories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                minLength: 1,
              },
              slug: {
                type: "string",
                minLength: 1,
              },
            },
            required: ["name", "slug"],
          },
        },
      },
      required: [
        "id",
        "slug",
        "canonicalUrl",
        "contentVersion",
        "publishedAt",
        "updatedAt",
        "status",
        "title",
        "language",
        "featured",
        "body",
        "layout",
      ],
      additionalProperties: {},
    },
  ],
  title: "Cronkite canonical document",
  description:
    "Version 1 of the provider-neutral canonical document contract accepted by Cronkite.",
} as const;
