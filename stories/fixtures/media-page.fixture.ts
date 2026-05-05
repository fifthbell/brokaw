import type { CanonicalArticle } from '../../src/types/canonical-article';

export type MediaAssignmentFixture = {
  generatedAt: string;
  assignment: {
    id: number;
    name: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  photos: Array<{
    id: number;
    filename: string;
    originalFilename: string;
    url: string;
    jpgUrl: string;
    alt: string;
    caption: string;
    photographer: string;
    location: string;
    keywords: string;
    capturedAt: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

export const mediaPageFixture: CanonicalArticle = {
  id: 'media-page',
  slug: '/media',
  layout: 'media-page',
  canonicalUrl: 'https://fifthbell.com/media',
  contentVersion: '2026-05-05T14:00:00.000Z',
  publishedAt: '2026-05-05T14:00:00.000Z',
  updatedAt: '2026-05-05T14:00:00.000Z',
  status: 'published',
  title: 'Assignment Media',
  excerpt: 'Browse photos from Fifthbell assignments.',
  language: 'en',
  featured: false,
  authors: [{ name: 'Fifthbell Newsroom', slug: 'fifthbell-newsroom' }],
  categories: [{ name: 'Top Stories', slug: 'top-stories' }],
  body: [],
  seo: {
    metaTitle: 'Assignment Media | fifthbell',
    metaDescription: 'Browse photos from Fifthbell assignments.'
  },
  navigation: {
    categories: [
      { name: 'Politics', slug: 'politics' },
      { name: 'World', slug: 'world' },
      { name: 'Sports', slug: 'sports' },
      { name: 'Technology', slug: 'technology' },
      { name: 'Weather', slug: 'weather' }
    ]
  }
};

export const mediaAssignmentFixture: MediaAssignmentFixture = {
  generatedAt: '2026-05-05T14:12:00.000Z',
  assignment: {
    id: 42,
    name: 'City Hall arrival pool',
    status: 'active',
    createdAt: '2026-05-05T12:30:00.000Z',
    updatedAt: '2026-05-05T14:12:00.000Z'
  },
  photos: [
    {
      id: 1001,
      filename: '2026/05/05/city-hall-arrival-01.avif',
      originalFilename: 'IMG_4101.JPG',
      url: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&h=900&fit=crop',
      jpgUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&h=900&fit=crop',
      alt: 'Reporters gathered outside a civic building',
      caption: 'Reporters set positions outside the north entrance.',
      photographer: 'Fifthbell Desk',
      location: 'City Hall',
      keywords: 'city hall, pool, arrival',
      capturedAt: '2026-05-05T13:41:00.000Z',
      createdAt: '2026-05-05T13:43:00.000Z',
      updatedAt: '2026-05-05T13:43:00.000Z'
    },
    {
      id: 1002,
      filename: '2026/05/05/city-hall-arrival-02.avif',
      originalFilename: 'IMG_4107.JPG',
      url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&h=900&fit=crop',
      jpgUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&h=900&fit=crop',
      alt: 'Officials seated around a conference table',
      caption: 'Staff brief reporters before the availability.',
      photographer: 'Fifthbell Desk',
      location: 'Briefing room',
      keywords: 'briefing, officials',
      capturedAt: '2026-05-05T13:52:00.000Z',
      createdAt: '2026-05-05T13:54:00.000Z',
      updatedAt: '2026-05-05T13:54:00.000Z'
    },
    {
      id: 1003,
      filename: '2026/05/05/city-hall-arrival-03.avif',
      originalFilename: 'IMG_4112.JPG',
      url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=900&fit=crop',
      jpgUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=900&fit=crop',
      alt: 'Laptop showing notes in a newsroom workflow',
      caption: 'Desk notes and captions were updated from the field.',
      photographer: 'Fifthbell Desk',
      location: 'Newsroom',
      keywords: 'desk, captions',
      capturedAt: '2026-05-05T14:01:00.000Z',
      createdAt: '2026-05-05T14:02:00.000Z',
      updatedAt: '2026-05-05T14:02:00.000Z'
    },
    {
      id: 1004,
      filename: '2026/05/05/city-hall-arrival-04.avif',
      originalFilename: 'IMG_4120.JPG',
      url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=900&fit=crop',
      jpgUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=900&fit=crop',
      alt: 'Public interior with framed walls and daylight',
      caption: 'Interior position for cutaway images.',
      photographer: 'Fifthbell Desk',
      location: 'Atrium',
      keywords: 'interior, cutaway',
      capturedAt: '2026-05-05T14:09:00.000Z',
      createdAt: '2026-05-05T14:11:00.000Z',
      updatedAt: '2026-05-05T14:11:00.000Z'
    }
  ]
};
