import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { render } from './renderer.node.js';
import type { CanonicalDocument } from './types/canonical-article.js';

const templatesRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), 'templates');

function templateFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return templateFiles(full);
    return entry.name.endsWith('.hbs') ? [full] : [];
  });
}

// `return` ends its statement at a line break (automatic semicolon
// insertion), so a value wrapped onto the next line is silently dropped.
const RETURN_BEFORE_LINE_BREAK = /\breturn[ \t]*(?:\/\/[^\n]*|\/\*.*?\*\/[ \t]*)?\r?\n/g;

function returnsBeforeLineBreak(source: string): number[] {
  const lines: number[] = [];
  for (const script of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    const offset = script.index + script[0].indexOf(script[1]);
    for (const match of script[1].matchAll(RETURN_BEFORE_LINE_BREAK)) {
      lines.push(source.slice(0, offset + match.index).split('\n').length);
    }
  }
  return lines;
}

describe('template script ratchet', () => {
  it('finds a return whose value wraps onto the next line', () => {
    expect(returnsBeforeLineBreak("<p>return\nvalue</p><script>\n if (a) return\n  a; return b;\n</script>")).toEqual([3]);
    expect(returnsBeforeLineBreak('<script>return // done\n</script><script>return /* x */\n</script>')).toEqual([1, 2]);
    expect(returnsBeforeLineBreak('<script>return;\nreturn a\n  + b; return\t(a);</script>')).toEqual([]);
  });

  it('has no template script whose return value wraps onto the next line', () => {
    const findings = templateFiles(templatesRoot).flatMap((file) =>
      returnsBeforeLineBreak(fs.readFileSync(file, 'utf8')).map((line) => `${path.relative(templatesRoot, file)}:${line}`));
    expect(findings).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The rendered header scripts, in a minimal DOM. Layout and focus stay
// Storybook/browser acceptance; this checks the values the scripts compute.

type Listener = (event: Record<string, unknown>) => unknown;

class FakeElement {
  textContent = '';
  innerHTML = '';
  hidden = true;
  readonly dataset: Record<string, string> = {};
  readonly style: Record<string, string> = {};
  readonly listeners = new Map<string, Listener>();
  readonly attributes = new Map<string, string>();
  readonly classes = new Set<string>();
  children: FakeElement[] = [];
  readonly classList = {
    add: (...tokens: string[]) => tokens.forEach((token) => this.classes.add(token)),
    remove: (...tokens: string[]) => tokens.forEach((token) => this.classes.delete(token)),
    contains: (token: string) => this.classes.has(token),
  };
  constructor(attributes: Record<string, string> = {}) {
    for (const [name, value] of Object.entries(attributes)) this.attributes.set(name, value);
  }
  addEventListener(type: string, listener: Listener) { this.listeners.set(type, listener); }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  querySelector() { return null; }
  querySelectorAll() { return this.children; }
  contains() { return false; }
}

function headerPage(language: 'en' | 'es' | 'it', slug: string): string {
  const prefix = language === 'en' ? '' : `/${language}`;
  return render({
    id: `header-${language}`,
    slug,
    layout: 'category-page',
    canonicalUrl: `https://fifthbell.com${prefix}${slug}`,
    contentVersion: '2026-11-17T00:00:00.000Z',
    publishedAt: '2026-11-17T00:00:00.000Z',
    updatedAt: '2026-11-17T00:00:00.000Z',
    status: 'published',
    title: 'Fictional header page',
    excerpt: 'Fictional header page.',
    language,
    featured: false,
    authors: [{ name: 'Fictional Newsroom', slug: 'fictional-newsroom' }],
    categories: [],
    navigation: { categories: [] },
    logoLink: language === 'en' ? '/' : `/${language}`,
    seo: { metaTitle: 'Fictional header page', metaDescription: 'Fictional header page.' },
    body: [],
  } as CanonicalDocument);
}

const homepagePayload = {
  categories: [{ slug: 'politics', name: 'Politics' }],
  docs: [
    { title: 'Absolute URL', url: 'https://fifthbell.com/politics/absolute-story' },
    { title: 'Trailing slash', url: '/politics/trailing-story/' },
    { title: 'Multi-segment slug', slug: 'politics/multi-story' },
    { title: 'Category plus slug', slug: 'category-story', categories: [{ slug: 'politics', name: 'Politics' }] },
  ],
};

function runHeader(html: string, url: string) {
  const elements = new Map<string, FakeElement>();
  const element = (key: string) => {
    if (!elements.has(key)) elements.set(key, new FakeElement());
    return elements.get(key)!;
  };
  // Assigning href navigates relative to the current page, as a browser does.
  let current = new URL(url);
  const location = {
    get href() { return current.href; },
    set href(next: string) { current = new URL(next, current); },
    get pathname() { return current.pathname; },
    get search() { return current.search; },
  };
  const langButtons = ['en', 'es', 'it'].map((lang) => new FakeElement({ 'data-lang': lang }));
  element('#sections-links').children = [new FakeElement({ 'data-category-slug': 'politics' })];
  const window: Record<string, unknown> = {
    location,
    addEventListener: () => undefined,
    dispatchEvent: () => undefined,
    setInterval: () => 0,
    clearInterval: () => undefined,
    matchMedia: () => ({ matches: true, addEventListener: () => undefined }),
    localStorage: { getItem: () => null, setItem: () => undefined },
    CustomEvent: class {},
    HTMLElement: FakeElement,
    Node: FakeElement,
    console: { error: () => undefined },
    URL,
    fetch: async (requested: string) => {
      const file = new URL(requested).pathname;
      if (file === '/content/homepage-current-en.json') return new Response(JSON.stringify(homepagePayload));
      if (file === '/content/politics-current-en.json') {
        return new Response(JSON.stringify({ category: { name: 'Politics' }, docs: [{ title: 'Politics lead', slug: 'politics-lead' }] }));
      }
      return new Response('', { status: 404 });
    },
    document: {
      documentElement: { classList: new FakeElement().classList },
      body: { style: {} },
      getElementById: (id: string) => element(`#${id}`),
      querySelector: (selector: string) => element(selector),
      querySelectorAll: (selector: string) => (selector === '.lang-btn' ? langButtons : []),
      addEventListener: () => undefined,
    },
  };
  window.window = window;
  const context = vm.createContext(window);
  for (const [, script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    if (/WEATHER_URL|menu-button|lang-btn/.test(script)) vm.runInContext(script, context);
  }
  const switchTo = (lang: string) => {
    langButtons.find((button) => button.getAttribute('data-lang') === lang)!.listeners.get('click')!({});
    return location.pathname + location.search;
  };
  return { element, switchTo };
}

async function settle(condition: () => boolean) {
  for (let attempt = 0; attempt < 200 && !condition(); attempt += 1) await new Promise((resolve) => setTimeout(resolve, 5));
  expect(condition()).toBe(true);
}

async function openMenu() {
  const header = runHeader(headerPage('en', '/politics'), 'https://fifthbell.com/politics');
  header.element('#menu-button').listeners.get('click')!({ stopPropagation: () => undefined });
  await settle(() => header.element('#mini-featured').innerHTML.includes('Category plus slug'));
  return header;
}

function linkFor(html: string, title: string): string | undefined {
  return html.match(new RegExp(`<a href='([^']*)'[^>]*>${title}</a>`))?.[1];
}

describe('header menu previews', () => {
  it('links an article given by an absolute URL to its path', async () => {
    const { element } = await openMenu();
    expect(linkFor(element('#mini-featured').innerHTML, 'Absolute URL')).toBe('/politics/absolute-story');
  });

  it('links an article whose URL has a trailing slash without the slash', async () => {
    const { element } = await openMenu();
    expect(linkFor(element('#mini-featured').innerHTML, 'Trailing slash')).toBe('/politics/trailing-story');
  });

  it('links an article with a multi-segment slug to that path', async () => {
    const { element } = await openMenu();
    expect(linkFor(element('#mini-featured').innerHTML, 'Multi-segment slug')).toBe('/politics/multi-story');
  });

  it('links an article with a single-segment slug under its primary category', async () => {
    const { element } = await openMenu();
    expect(linkFor(element('#mini-featured').innerHTML, 'Category plus slug')).toBe('/politics/category-story');
  });

  it('titles a category preview with the category name, keeping the fallback for top stories', async () => {
    const { element } = await openMenu();
    expect(element('#mini-featured').innerHTML).toContain('FEATURED STORIES');
    element('#sections-links').children[0].listeners.get('mouseenter')!({});
    await settle(() => element('#mini-featured').innerHTML.includes('Politics lead'));
    const html = element('#mini-featured').innerHTML;
    expect(html).toMatch(/pb-2'> POLITICS\s*<\/h3>/);
    expect(html).not.toContain('FEATURED STORIES');
    expect(html).not.toContain('GENERAL');
  });
});

describe('header language switch', () => {
  it('keeps the search query when switching language on the search page', () => {
    const { switchTo } = runHeader(headerPage('en', '/search'), 'https://fifthbell.com/search?q=harbor');
    expect(switchTo('es')).toBe('/es/search?q=harbor');
  });

  it('switches a localized category page to its English path', () => {
    const { switchTo } = runHeader(headerPage('es', '/politics'), 'https://fifthbell.com/es/politics');
    expect(switchTo('en')).toBe('/politics');
  });
});
