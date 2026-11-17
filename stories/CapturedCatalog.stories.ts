import type { Meta, StoryObj } from '@storybook/html';
import { expect, waitFor } from 'storybook/test';
import { render } from '../src/renderer.browser';
import { mediathekSystemPage } from '../src/system-pages';
import { searchCopyByLanguage } from '../src/search-copy';
import type { CanonicalArticle } from '../src/types/canonical-article';
import { completeDocument } from './complete-document';

// A fictional captured generation served at its issued HTTPS locations. The
// frame's fetch answers only those locations, so any request for a current
// source would fail the story rather than reach the network.
const GENERATION = 'https://cdn.fifthbell.com/generations/storybook-1';
const CATALOG_URL = `${GENERATION}/catalog.json`;
const context = { rendererVersion: 'storybook', templateVersion: 'storybook', tenant: 'fifthbell', origin: 'https://fifthbell.com', build: 'storybook-1' };
const selection = { selectionId: 'storybook-1', catalogUrl: CATALOG_URL, context, locale: 'en' };

type Generation = { bodies: Map<string, Uint8Array>; requests: string[] };

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function capturedGeneration(state: 'selected' | 'withdrawn'): Promise<Generation> {
  const payloads: Record<string, [string, unknown]> = {
    weather: ['weather', { cities: [{ name: 'Rome', country: 'Italy', temp: 68, condition: 'sunny' }] }],
    homepage: ['homepage', { categories: [{ slug: 'politics', name: 'Politics' }], docs: [] }],
    search: ['search', {
      articles: Array.from({ length: 2000 }, (_, index) => ({
        title: `${index % 3 === 0 ? 'Harbor' : 'Valley'} archive ${index + 1}`,
        slug: `/archive/${index + 1}`,
        excerpt: `Fictional historical coverage number ${index + 1}.`,
        photoUrl: '/mediathek/fixture-photo.svg',
        publishedAt: new Date(Date.UTC(2020, 0, 1) + index * 86_400_000).toISOString(),
      })),
    }],
    'assignment:gallery.html': ['assignment', {
      generatedAt: '2026-11-17T00:00:00.000Z',
      assignment: { name: 'Captured harbor desk' },
      photos: Array.from({ length: 1044 }, (_, index) => ({
        url: '/mediathek/fixture-photo.svg',
        alt: `Captured photo ${index + 1}`,
        caption: `Captured photo ${index + 1}`,
      })),
    }],
  };
  const bodies = new Map<string, Uint8Array>();
  const resources = [];
  for (const [key, [kind, payload]] of Object.entries(payloads)) {
    const url = `${GENERATION}/${encodeURIComponent(key)}.json`;
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    bodies.set(url, bytes);
    resources.push({ key, kind, url, sha256: await sha256(bytes) });
  }
  const catalog = { contractVersion: 1, selectionId: selection.selectionId, context, locale: 'en', state, resources };
  bodies.set(CATALOG_URL, new TextEncoder().encode(JSON.stringify(catalog)));
  return { bodies, requests: [] };
}

function capturedFrame(page: CanonicalArticle, route: string, generation: Generation): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.title = 'Page reading a captured generation';
  iframe.style.width = '100%';
  iframe.style.height = '900px';
  const html = render(completeDocument({ ...page, capturedSelection: selection } as CanonicalArticle));
  iframe.src = route;
  iframe.addEventListener('load', () => {
    const target = iframe.contentDocument;
    const frameWindow = iframe.contentWindow;
    if (!target || !frameWindow) throw new Error('Captured fixture frame is unavailable');
    frameWindow.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      generation.requests.push(url);
      const body = generation.bodies.get(url);
      return body ? new Response(body.slice()) : new Response('', { status: 404 });
    };
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    target.replaceChild(target.importNode(parsed.documentElement, true), target.documentElement);
    target.querySelectorAll<HTMLScriptElement>('script:not([src])').forEach((script) => {
      const executable = target.createElement('script');
      if (script.type) executable.type = script.type;
      if (script.id) executable.id = script.id;
      executable.textContent = script.textContent;
      script.replaceWith(executable);
    });
  }, { once: true });
  return iframe;
}

function searchDocument(): CanonicalArticle {
  return {
    ...(mediathekSystemPage.variants[0].document as CanonicalArticle),
    id: 'system-search-page-en',
    slug: '/search',
    canonicalUrl: 'https://fifthbell.com/search',
    layout: 'search-page',
    title: 'Search',
    searchCopy: searchCopyByLanguage.en,
  } as CanonicalArticle;
}

function frameDocument(canvasElement: HTMLElement): Document | null | undefined {
  return canvasElement.querySelector('iframe')?.contentDocument;
}

const meta = {
  title: 'Pages/CapturedCatalog',
  parameters: {
    docs: {
      description: {
        component:
          'Pages whose document carries `capturedSelection` read every runtime resource (weather, navigation, homepage and category previews, search, assignment galleries) from the selected captured generation. Without a selection the page is byte-identical to the current sources.',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const CapturedGalleryFinalPage: Story = {
  loaders: [async () => ({ generation: await capturedGeneration('selected') })],
  render: (_args, { loaded }) => capturedFrame(
    mediathekSystemPage.variants[0].document as CanonicalArticle,
    '/mediathek/gallery.html?page=22',
    loaded.generation as Generation,
  ),
  play: async ({ canvasElement, loaded }) => {
    await waitFor(() => {
      const target = frameDocument(canvasElement);
      expect(target?.querySelector('#media-title')).toHaveTextContent('Captured harbor desk');
      expect(target?.querySelector('#media-meta')?.textContent).toMatch(/^1044 photos - Page 22 of 22 updated /);
      expect(target?.querySelectorAll('#media-grid figure')).toHaveLength(36);
      expect(target?.querySelector('[data-weather-city]')).toHaveTextContent('Rome');
    });
    for (const request of (loaded.generation as Generation).requests) expect(request.startsWith(GENERATION)).toBe(true);
  },
};

export const CapturedSearchFinalPage: Story = {
  loaders: [async () => ({ generation: await capturedGeneration('selected') })],
  render: (_args, { loaded }) => capturedFrame(searchDocument(), '/mediathek/gallery.html?q=harbor&page=34', loaded.generation as Generation),
  play: async ({ canvasElement, loaded }) => {
    await waitFor(() => {
      const target = frameDocument(canvasElement);
      expect(target?.querySelector('#search-results-meta')).toHaveTextContent('667 results for "harbor" • Page 34 of 34');
      expect(target?.querySelectorAll('#search-results-list article')).toHaveLength(7);
    });
    for (const request of (loaded.generation as Generation).requests) expect(request.startsWith(GENERATION)).toBe(true);
  },
};

export const WithdrawnGeneration: Story = {
  loaders: [async () => ({ generation: await capturedGeneration('withdrawn') })],
  render: (_args, { loaded }) => capturedFrame(
    mediathekSystemPage.variants[0].document as CanonicalArticle,
    '/mediathek/gallery.html',
    loaded.generation as Generation,
  ),
  play: async ({ canvasElement, loaded }) => {
    await waitFor(() => {
      const target = frameDocument(canvasElement);
      expect(target?.querySelector('#media-status')).toHaveTextContent('We could not load this assignment right now.');
      expect(target?.querySelector('#media-grid')).toHaveClass('hidden');
      expect(target?.querySelector('[data-weather-current]')).toHaveAttribute('hidden');
    });
    expect(new Set((loaded.generation as Generation).requests)).toEqual(new Set([CATALOG_URL]));
  },
};
