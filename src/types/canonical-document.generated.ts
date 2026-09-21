/* eslint-disable */
/** Generated from the normative JSON Schema. Do not edit by hand. */

/**
 * Version 1 of the provider-neutral canonical document contract accepted by Cronkite.
 */
export type CronkiteCanonicalDocument =
  | {
      id: string;
      slug: string;
      canonicalUrl: string;
      contentVersion: string;
      publishedAt: string;
      updatedAt: string;
      status: "draft" | "published";
      title: string;
      dek?: string;
      excerpt?: string;
      language: BCP47LanguageTag;
      rumConfig?: {
        appMonitorId: string;
        applicationVersion: string;
        region: string;
        identityPoolId: string;
        guestRoleArn: string;
        [k: string]: unknown;
      };
      sofascore_id?: number;
      originalArticleId?: string;
      updatedVersion?: {
        id: string;
        title: string;
        url: string;
        [k: string]: unknown;
      };
      featured: boolean;
      featuredImage?: {
        url: string;
        alt: string;
        caption?: string;
        [k: string]: unknown;
      };
      media?: {
        url: string;
        alt: string;
        caption?: string;
        [k: string]: unknown;
      }[];
      hero?: {
        url: string;
        alt: string;
        [k: string]: unknown;
      };
      body: (
        | {
            type: "richText";
            html: string;
            [k: string]: unknown;
          }
        | {
            type: "heading";
            text: string;
            level?: 2 | 3 | 4;
            [k: string]: unknown;
          }
        | {
            type: "image";
            url: string;
            alt: string;
            caption?: string;
            [k: string]: unknown;
          }
        | {
            type: "list";
            ordered?: boolean;
            /**
             * @minItems 1
             */
            items: [string, ...string[]];
            [k: string]: unknown;
          }
        | {
            type: "divider";
            [k: string]: unknown;
          }
        | {
            type: "infoBox";
            title?: string;
            tone?: "neutral" | "info" | "warning" | "success";
            html: string;
            [k: string]: unknown;
          }
        | {
            type: "keyPoints";
            title?: string;
            /**
             * @minItems 1
             */
            points: [string, ...string[]];
            [k: string]: unknown;
          }
        | {
            type: "dataTable";
            caption?: string;
            /**
             * @minItems 1
             */
            headers: [string, ...string[]];
            /**
             * @minItems 1
             */
            rows: [string[], ...string[][]];
            [k: string]: unknown;
          }
        | {
            type: "liveUpdate";
            timestamp: string;
            headline: string;
            html?: string;
            media?: {
              url: string;
              alt: string;
              caption?: string;
              [k: string]: unknown;
            }[];
            [k: string]: unknown;
          }
        | {
            type: "audio";
            url: string;
            title?: string;
            caption?: string;
            [k: string]: unknown;
          }
        | {
            type: "youtube";
            videoId: string;
            [k: string]: unknown;
          }
        | {
            type: "x";
            url: string;
            tweetId: string;
            [k: string]: unknown;
          }
        | {
            type: "instagram";
            url: string;
            [k: string]: unknown;
          }
        | {
            type: "tiktok";
            url: string;
            videoId: string;
            [k: string]: unknown;
          }
        | {
            type: "spotify";
            url: string;
            [k: string]: unknown;
          }
        | {
            type: "pullQuote";
            text: string;
            attribution?: string;
            [k: string]: unknown;
          }
      )[];
      seo?: {
        metaTitle?: string;
        metaDescription?: string;
        ogImage?: string;
        socialImage?: {
          url: string;
          alt: string;
          [k: string]: unknown;
        };
        [k: string]: unknown;
      };
      navigation?: {
        categories: {
          name: string;
          slug: string;
          [k: string]: unknown;
        }[];
        [k: string]: unknown;
      };
      articles?: {
        id: string;
        url: string;
        title: string;
        excerpt?: string;
        time?: string;
        categories?: {
          name: string;
          slug: string;
          [k: string]: unknown;
        }[];
        hero?: {
          url: string;
          alt: string;
          [k: string]: unknown;
        };
        featuredImage?: {
          url: string;
          alt: string;
          caption?: string;
          [k: string]: unknown;
        };
        updatedAt?: string;
        publishedAt?: string;
        featured?: boolean;
        [k: string]: unknown;
      }[];
      heroSlides?: {
        image: string;
        alt?: string;
        [k: string]: unknown;
      }[];
      heroLayout?: "spotlight" | "editorial";
      heroCategories?: {
        name: string;
        slug: string;
        [k: string]: unknown;
      }[];
      showHero?: boolean;
      showEditorialHero?: boolean;
      breakingNews?: {
        displayClass?: string;
        sidebarFeature?: {
          category: string;
          title: string;
          url: string;
          image: string;
          excerpt?: string;
          publishedAt?: string;
          [k: string]: unknown;
        };
        sidebarSub?: {
          category: string;
          title: string;
          url: string;
          image: string;
          alt?: string;
          readTime?: string;
          excerpt?: string;
          [k: string]: unknown;
        };
        main?: {
          category: string;
          title: string;
          url: string;
          liveUrl?: string;
          sofascore_id?: number;
          image: string;
          alt?: string;
          excerpt?: string;
          [k: string]: unknown;
        };
        updates?: {
          timestamp?: string;
          time?: string;
          text?: string;
          html?: string;
          [k: string]: unknown;
        }[];
        snacks?: {
          category?: string;
          readTime?: string;
          title: string;
          url: string;
          excerpt?: string;
          image?: string;
          alt?: string;
          [k: string]: unknown;
        }[];
        [k: string]: unknown;
      };
      liveStory?: {
        lastUpdated?: string;
        keyPoints?: string[];
        [k: string]: unknown;
      };
      layout: "article-page";
      authors: {
        name: string;
        slug: string;
        [k: string]: unknown;
      }[];
      categories: {
        name: string;
        slug: string;
        [k: string]: unknown;
      }[];
      [k: string]: unknown;
    }
  | {
      id: string;
      slug: string;
      canonicalUrl: string;
      contentVersion: string;
      publishedAt: string;
      updatedAt: string;
      status: "draft" | "published";
      title: string;
      dek?: string;
      excerpt?: string;
      language: BCP47LanguageTag1;
      rumConfig?: {
        appMonitorId: string;
        applicationVersion: string;
        region: string;
        identityPoolId: string;
        guestRoleArn: string;
        [k: string]: unknown;
      };
      sofascore_id?: number;
      originalArticleId?: string;
      updatedVersion?: {
        id: string;
        title: string;
        url: string;
        [k: string]: unknown;
      };
      featured: boolean;
      featuredImage?: {
        url: string;
        alt: string;
        caption?: string;
        [k: string]: unknown;
      };
      media?: {
        url: string;
        alt: string;
        caption?: string;
        [k: string]: unknown;
      }[];
      hero?: {
        url: string;
        alt: string;
        [k: string]: unknown;
      };
      body: (
        | {
            type: "richText";
            html: string;
            [k: string]: unknown;
          }
        | {
            type: "heading";
            text: string;
            level?: 2 | 3 | 4;
            [k: string]: unknown;
          }
        | {
            type: "image";
            url: string;
            alt: string;
            caption?: string;
            [k: string]: unknown;
          }
        | {
            type: "list";
            ordered?: boolean;
            /**
             * @minItems 1
             */
            items: [string, ...string[]];
            [k: string]: unknown;
          }
        | {
            type: "divider";
            [k: string]: unknown;
          }
        | {
            type: "infoBox";
            title?: string;
            tone?: "neutral" | "info" | "warning" | "success";
            html: string;
            [k: string]: unknown;
          }
        | {
            type: "keyPoints";
            title?: string;
            /**
             * @minItems 1
             */
            points: [string, ...string[]];
            [k: string]: unknown;
          }
        | {
            type: "dataTable";
            caption?: string;
            /**
             * @minItems 1
             */
            headers: [string, ...string[]];
            /**
             * @minItems 1
             */
            rows: [string[], ...string[][]];
            [k: string]: unknown;
          }
        | {
            type: "liveUpdate";
            timestamp: string;
            headline: string;
            html?: string;
            media?: {
              url: string;
              alt: string;
              caption?: string;
              [k: string]: unknown;
            }[];
            [k: string]: unknown;
          }
        | {
            type: "audio";
            url: string;
            title?: string;
            caption?: string;
            [k: string]: unknown;
          }
        | {
            type: "youtube";
            videoId: string;
            [k: string]: unknown;
          }
        | {
            type: "x";
            url: string;
            tweetId: string;
            [k: string]: unknown;
          }
        | {
            type: "instagram";
            url: string;
            [k: string]: unknown;
          }
        | {
            type: "tiktok";
            url: string;
            videoId: string;
            [k: string]: unknown;
          }
        | {
            type: "spotify";
            url: string;
            [k: string]: unknown;
          }
        | {
            type: "pullQuote";
            text: string;
            attribution?: string;
            [k: string]: unknown;
          }
      )[];
      seo?: {
        metaTitle?: string;
        metaDescription?: string;
        ogImage?: string;
        socialImage?: {
          url: string;
          alt: string;
          [k: string]: unknown;
        };
        [k: string]: unknown;
      };
      navigation?: {
        categories: {
          name: string;
          slug: string;
          [k: string]: unknown;
        }[];
        [k: string]: unknown;
      };
      articles?: {
        id: string;
        url: string;
        title: string;
        excerpt?: string;
        time?: string;
        categories?: {
          name: string;
          slug: string;
          [k: string]: unknown;
        }[];
        hero?: {
          url: string;
          alt: string;
          [k: string]: unknown;
        };
        featuredImage?: {
          url: string;
          alt: string;
          caption?: string;
          [k: string]: unknown;
        };
        updatedAt?: string;
        publishedAt?: string;
        featured?: boolean;
        [k: string]: unknown;
      }[];
      heroSlides?: {
        image: string;
        alt?: string;
        [k: string]: unknown;
      }[];
      heroLayout?: "spotlight" | "editorial";
      heroCategories?: {
        name: string;
        slug: string;
        [k: string]: unknown;
      }[];
      showHero?: boolean;
      showEditorialHero?: boolean;
      breakingNews?: {
        displayClass?: string;
        sidebarFeature?: {
          category: string;
          title: string;
          url: string;
          image: string;
          excerpt?: string;
          publishedAt?: string;
          [k: string]: unknown;
        };
        sidebarSub?: {
          category: string;
          title: string;
          url: string;
          image: string;
          alt?: string;
          readTime?: string;
          excerpt?: string;
          [k: string]: unknown;
        };
        main?: {
          category: string;
          title: string;
          url: string;
          liveUrl?: string;
          sofascore_id?: number;
          image: string;
          alt?: string;
          excerpt?: string;
          [k: string]: unknown;
        };
        updates?: {
          timestamp?: string;
          time?: string;
          text?: string;
          html?: string;
          [k: string]: unknown;
        }[];
        snacks?: {
          category?: string;
          readTime?: string;
          title: string;
          url: string;
          excerpt?: string;
          image?: string;
          alt?: string;
          [k: string]: unknown;
        }[];
        [k: string]: unknown;
      };
      liveStory?: {
        lastUpdated?: string;
        keyPoints?: string[];
        [k: string]: unknown;
      };
      layout:
        | "homepage"
        | "category-page"
        | "search-page"
        | "404"
        | "coming-soon"
        | "live-story"
        | "link-in-bio"
        | "media-page"
        | "standalone-page";
      authors?: {
        name: string;
        slug: string;
        [k: string]: unknown;
      }[];
      categories?: {
        name: string;
        slug: string;
        [k: string]: unknown;
      }[];
      [k: string]: unknown;
    };
/**
 * An open language tag. The active renderer declares the allowed set for each request.
 */
export type BCP47LanguageTag = string;
/**
 * An open language tag. The active renderer declares the allowed set for each request.
 */
export type BCP47LanguageTag1 = string;
