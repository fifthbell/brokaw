import fs from 'node:fs';
import Handlebars from 'handlebars';
import { describe, expect, it, vi } from 'vitest';
import {
  initializeHandlebars,
  renderWithAssets,
  type RendererAssets,
} from './renderer.core.js';
import {
  fontFiles,
  liveProgramPageAsset,
  liveProgramPageFiles,
  liveProgramPageHtml,
  render,
} from './renderer.node.js';
import { ignoredInputCounts } from './ignored-input.js';
import type { CanonicalDocument } from './types/canonical-article.js';

/** A renderer with fresh module state: no cached disk assets, Handlebars not initialized. */
async function freshRenderer(): Promise<typeof import('./renderer.node.js')> {
  vi.resetModules();
  return import('./renderer.node.js');
}

const minimalDoc: CanonicalDocument = {
  id: 'test-article-1',
  slug: '/news/test-article',
  layout: 'article-page',
  canonicalUrl: 'https://fifthbell.com/news/test-article',
  contentVersion: '2026-11-15T00:00:00.000Z',
  publishedAt: '2026-11-15T00:00:00.000Z',
  updatedAt: '2026-11-15T00:00:00.000Z',
  status: 'published',
  title: 'Test Article',
  language: 'en',
  featured: false,
  authors: [],
  categories: [],
  body: [
    { type: 'heading', level: 2, text: 'Hello World' },
    { type: 'truthSocial', post: 'ignored' } as any,
  ],
};

describe('renderer.core Handlebars helpers and normalization', () => {
  const assets: RendererAssets = {
    layouts: {
      'article-page': '<h1>{{title}}</h1>{{#each body}}{{type}}{{/each}}',
      'standalone-page': '<div>{{title}}</div>',
      'search-page': '<div>Search</div>',
      'category-page': '<div>Category</div>',
      'media-page': '<div>Media</div>',
      'link-in-bio': '<div>Bio</div>',
      'homepage': '<div>Home</div>',
      'live-story': '<div>Live</div>',
      '404': '<div>404</div>',
    },
    partials: {
      'blocks/heading': '<h2>heading</h2>',
      'components/body-block': '<div>body</div>',
    },
    styles: 'body { color: black; }',
  };

  it('initializes once: a second call keeps the first layouts', () => {
    initializeHandlebars(assets);
    initializeHandlebars({ ...assets, layouts: { ...assets.layouts, 'article-page': '<p>replaced</p>' } });
    expect(renderWithAssets(minimalDoc, assets)).toBe('<h1>Test Article</h1>heading');
  });

  it('tests eq and add helpers', () => {
    const eq = Handlebars.helpers['eq'];
    expect(eq(1, 1)).toBe(true);
    expect(eq(1, 2)).toBe(false);

    const add = Handlebars.helpers['add'];
    expect(add(2, 3)).toBe(5);
  });

  it('tests slice helper', () => {
    const slice = Handlebars.helpers['slice'];
    expect(slice('not-an-array', 0)).toEqual([]);
    expect(slice([1, 2, 3, 4], 1, 3)).toEqual([2, 3]);
  });

  it('tests uppercase helper', () => {
    const uppercase = Handlebars.helpers['uppercase'];
    expect(uppercase(null)).toBe('');
    expect(uppercase(undefined)).toBe('');
    expect(uppercase('hello')).toBe('HELLO');
  });

  it('tests coalesce helper', () => {
    const coalesce = Handlebars.helpers['coalesce'];
    expect(coalesce(null, undefined, 'found', 'extra', {})).toBe('found');
    expect(coalesce(null, undefined, {})).toBeNull();
  });

  it('tests formatDate helper', () => {
    const formatDate = Handlebars.helpers['formatDate'];
    expect(formatDate('')).toBe('');
    expect(formatDate('2026-11-15T12:00:00.000Z')).toContain('November 15, 2026');
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });

  it('tests embedUrl helper across supported providers', () => {
    const embedUrl = Handlebars.helpers['embedUrl'];
    expect(
      embedUrl('x-status', { hash: { username: 'fifthbell', id: '123' } } as any),
    ).toBe('https://twitter.com/fifthbell/status/123');
    expect(
      embedUrl('x-embed', { hash: { id: '123' } } as any),
    ).toBe('https://platform.twitter.com/embed/Tweet.html?id=123&dnt=true');
    expect(
      embedUrl('instagram', { hash: { shortcode: 'ABC' } } as any),
    ).toBe('https://www.instagram.com/p/ABC/embed/');
    expect(
      embedUrl('tiktok', { hash: { id: '999' } } as any),
    ).toBe('https://www.tiktok.com/embed/v2/999');
    expect(
      embedUrl('sofascore-widget', { hash: { id: '10', widgetTheme: 'dark' } } as any),
    ).toBe('https://widgets.sofascore.com/embed/attackMomentum?id=10&widgetTheme=dark');
    expect(
      embedUrl('sofascore-match', { hash: { id: '42' } } as any),
    ).toBe('https://www.sofascore.com/football/match#id:42');

    // An undeclared provider yields '' and is counted, as Cronkite's helper (gaulatti/ariston#217).
    const before = ignoredInputCounts().embed_provider;
    expect(embedUrl('unknown-provider', { hash: {} } as any)).toBe('');
    expect(() =>
      embedUrl('x-status', { hash: { username: '', id: '123' } } as any),
    ).toThrow('Embed provider "x-status" requires parameter username');
    // Non-string embed provider
    expect(Handlebars.helpers['embedUrl'](123, { hash: {} })).toBe('');
    expect(ignoredInputCounts().embed_provider - before).toBe(2);
  });

  it('tests jsonString helper with escaping and error handling', () => {
    const jsonString = Handlebars.helpers['jsonString'];
    const safeStr = jsonString({ tag: '<script>& \u2028\u2029' });
    expect(safeStr.toString()).toContain('\\u003c');
    expect(safeStr.toString()).toContain('\\u003e');
    expect(safeStr.toString()).toContain('\\u0026');
    expect(safeStr.toString()).toContain('\\u2028');
    expect(safeStr.toString()).toContain('\\u2029');

    expect(() => jsonString(undefined)).toThrow('jsonString cannot serialize this value');
  });

  it('tests socialImageUrl and socialImageAlt helpers', () => {
    const socialImageUrl = Handlebars.helpers['socialImageUrl'];
    const socialImageAlt = Handlebars.helpers['socialImageAlt'];

    expect(socialImageUrl(null)).toBeNull();
    expect(socialImageUrl({})).toBeNull();
    expect(socialImageUrl({ seo: { socialImage: ['not-an-object'] } })).toBeNull();
    expect(socialImageUrl({ seo: { socialImage: { url: '   ' } } })).toBeNull();
    expect(
      socialImageUrl({ seo: { socialImage: { url: 'https://cdn.example.test/img.jpg' } } }),
    ).toBe('https://cdn.example.test/img.jpg');

    expect(
      socialImageAlt({
        seo: { socialImage: { url: 'https://cdn.example.test/img.jpg', alt: 'custom alt' } },
      }),
    ).toBe('custom alt');
    expect(socialImageAlt({ title: 'My Story' })).toBe('My Story');
    expect(socialImageAlt({})).toBe('fifthbell');
  });

  it('renders document with assets and filters removed block types', () => {
    const rendered = renderWithAssets(minimalDoc, assets);
    expect(rendered).toContain('<h1>Test Article</h1>');
    expect(rendered).not.toContain('truthSocial');

  });

  it('passes a body that is not a block list to validation unchanged, which rejects it', () => {
    expect(() => renderWithAssets({ ...minimalDoc, body: null as any }, assets)).toThrow(
      'Canonical document validation failed: /body must be array',
    );
    // Non-object entries are kept, not dropped as removed block types, so validation names them.
    expect(() =>
      renderWithAssets({ ...minimalDoc, body: [{ type: 'heading', level: 2, text: 'A' }, 'string-block' as any] }, assets),
    ).toThrow('Canonical document validation failed: /body/1 must be object');
  });

  it('rejects unknown or missing layout in renderWithAssets', () => {
    expect(() =>
      renderWithAssets({ ...minimalDoc, layout: undefined as any }, assets),
    ).toThrow('Unknown layout "undefined"');
    expect(() =>
      renderWithAssets({ ...minimalDoc, layout: 'nonexistent-layout' as any }, assets),
    ).toThrow('Unknown layout "nonexistent-layout"');
  });
});

describe('renderer.node file resolution and exports', () => {
  it('renders a canonical document using assets from disk', () => {
    const html = render(minimalDoc);
    expect(html).toContain('Test Article');
  });

  it('reads fontFiles from disk or throws when font directory is missing', () => {
    const fontsPath = 'src/styles/fonts';
    if (fs.existsSync(fontsPath)) {
      const realExistsSync = fs.existsSync.bind(fs);
      const realReaddirSync = fs.readdirSync.bind(fs);
      const realReadFileSync = fs.readFileSync.bind(fs);

      const existsSpy = vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
        if (String(p).endsWith('/fonts')) return true;
        return realExistsSync(p);
      });
      const readdirSpy = vi.spyOn(fs, 'readdirSync').mockImplementation((p: any, opts: any) => {
        if (String(p).endsWith('/fonts')) {
          const res = realReaddirSync(fontsPath, opts);
          return [
            ...res,
            { name: 'sub-dir', isFile: () => false, isDirectory: () => true } as any,
          ];
        }
        return realReaddirSync(p, opts);
      });
      const readSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((p: any, opts?: any) => {
        if (String(p).includes('/fonts/')) {
          const filename = String(p).split('/fonts/')[1];
          return realReadFileSync(`${fontsPath}/${filename}`, opts);
        }
        return realReadFileSync(p, opts);
      });

      try {
        const fonts = fontFiles();
        expect(fonts.length).toBeGreaterThan(0);
        expect(fonts[0].contentType).toBe('font/ttf');
        expect(fonts[0].body).toBeInstanceOf(Buffer);
      } finally {
        existsSpy.mockRestore();
        readdirSpy.mockRestore();
        readSpy.mockRestore();
      }
    }
  });

  it('throws when font directory is missing', () => {
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    try {
      expect(() => fontFiles()).toThrow('fonts directory not found');
    } finally {
      existsSpy.mockRestore();
    }
  });

  it('reads liveProgramPageHtml and assets from disk', () => {
    // Test colocated directory resolution
    const realExists = fs.existsSync.bind(fs);
    const realRead = fs.readFileSync.bind(fs);
    const existsSpy = vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
      if (String(p).endsWith('/src/live-program-page') || String(p).endsWith('/src/live-program-page/index.html')) return true;
      return realExists(p);
    });
    const readSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((p: any, opts: any) => {
      if (String(p).endsWith('/src/live-program-page/index.html')) return '<!doctype html><html>colocated</html>';
      return realRead(p, opts);
    });
    try {
      expect(liveProgramPageHtml().toLowerCase()).toContain('colocated');
    } finally {
      existsSpy.mockRestore();
      readSpy.mockRestore();
    }

    const html = liveProgramPageHtml();
    expect(html.toLowerCase()).toContain('<!doctype html>');

    const asset = liveProgramPageAsset('index.html');
    expect(asset.toLowerCase()).toContain('<!doctype html>');
  });

  it('throws when liveProgramPageHtml or asset does not exist', () => {
    expect(() => liveProgramPageAsset('nonexistent-file.bin')).toThrow(
      'not found',
    );
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    try {
      expect(() => liveProgramPageHtml()).toThrow('live-program-page/index.html not found');
    } finally {
      existsSpy.mockRestore();
    }
  });

  it('ignores partials-directory entries that are not .hbs files', async () => {
    const renderer = await freshRenderer();
    const realReaddirSync = fs.readdirSync.bind(fs);
    const readdirSpy = vi.spyOn(fs, 'readdirSync').mockImplementation(((p: any, opts: any) => {
      const res = realReaddirSync(p, opts);
      if (String(p).endsWith('partials') && Array.isArray(res)) {
        return [
          ...res,
          { name: 'notes.txt', isFile: () => true, isDirectory: () => false },
          { name: 'socket', isFile: () => false, isDirectory: () => false },
        ];
      }
      return res;
    }) as typeof fs.readdirSync);
    try {
      const html = renderer.render(minimalDoc);
      expect(html).toContain('<h2');
      expect(html).toContain('Hello World');
      expect(html).not.toContain('truthSocial');
    } finally {
      readdirSpy.mockRestore();
    }
  });

  it('refuses to render when compiled.css or a layout template is missing on disk', async () => {
    const realExists = fs.existsSync.bind(fs);
    for (const [missing, message] of [
      ['compiled.css', 'compiled.css not found — run npm run build:css first'],
      ['article-page.hbs', 'Layout template missing for "article-page"'],
    ] as const) {
      const renderer = await freshRenderer();
      const existsSpy = vi.spyOn(fs, 'existsSync').mockImplementation((p: any) =>
        String(p).endsWith(missing) ? false : realExists(p));
      try {
        expect(() => renderer.render(minimalDoc)).toThrow(message);
      } finally {
        existsSpy.mockRestore();
      }
    }
  });

  it('loads disk assets once and reuses them for later renders', async () => {
    const renderer = await freshRenderer();
    const readSpy = vi.spyOn(fs, 'readFileSync');
    try {
      const first = renderer.render(minimalDoc);
      const reads = readSpy.mock.calls.length;
      expect(reads).toBeGreaterThan(0);
      expect(renderer.render(minimalDoc)).toBe(first);
      expect(readSpy.mock.calls.length).toBe(reads);
    } finally {
      readSpy.mockRestore();
    }
  });

  it('reads liveProgramPageFiles recursively and covers content types', () => {
    const realReaddir = fs.readdirSync.bind(fs);
    const realRead = fs.readFileSync.bind(fs);
    const readdirSpy = vi.spyOn(fs, 'readdirSync').mockImplementation((p: any, opts: any) => {
      const res = realReaddir(p, opts);
      if (Array.isArray(res)) {
        return [
          ...res,
          { name: 'custom.unknownext', isFile: () => true, isDirectory: () => false } as any,
          { name: 'special-device', isFile: () => false, isDirectory: () => false } as any,
        ];
      }
      return res;
    });
    const readSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((p: any, opts: any) => {
      if (String(p).includes('custom.unknownext')) return Buffer.from('custom');
      return realRead(p, opts);
    });

    try {
      const files = liveProgramPageFiles();
      expect(files.some((f) => f.key === 'index.html')).toBe(true);
      expect(files.some((f) => f.contentType === 'application/octet-stream')).toBe(true);
    } finally {
      readdirSpy.mockRestore();
      readSpy.mockRestore();
    }
  });

  it('throws when liveProgramPageDir does not exist', () => {
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    try {
      expect(() => liveProgramPageFiles()).toThrow('directory not found');
    } finally {
      existsSpy.mockRestore();
    }
  });
});
