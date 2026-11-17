import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';
import Handlebars from 'handlebars';
import { describe, expect, it } from 'vitest';
import { cronkiteManifest } from './cronkite-manifest.js';
import { addContractFormats } from './json-schema-formats.js';
import { pageUrl } from './outlet-config.js';

// The `redirect` renderable (fifthbell/cronkite#148), against the redirect
// intent pinned on gaulatti/ariston#211 and its four examples.

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const definition = cronkiteManifest.templateRendering.renderables.redirect;
const fixtures = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'src', 'fixtures', 'redirect-intents.json'), 'utf8'),
) as Record<'routeMove' | 'chainFlattened' | 'replacementRetired' | 'removalRetired', unknown>;

type Intent = Record<string, unknown> & { toRoute: string; fromRoute: string; fromKey: string; toKey: string };

const schema = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'src', 'schemas', 'redirect-input.schema.json'), 'utf8'),
);
const ajv = new Ajv2020({ allErrors: true, strict: false });
addContractFormats(ajv);
const validate = ajv.compile(schema);

/** The template rendered with Cronkite's helpers, as Cronkite renders it. */
function renderPage(input: Record<string, unknown>): string {
  const environment = Handlebars.create();
  environment.registerHelper('eq', (left, right) => left === right);
  environment.registerHelper(
    'jsonString',
    (value) =>
      new environment.SafeString(
        JSON.stringify(value).replace(
          /[<>&\u2028\u2029]/g,
          (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
        ),
      ),
  );
  const source = fs.readFileSync(path.join(projectRoot, definition.template.entry), 'utf8');
  return environment.compile(source)(input);
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#x60;': '`', '&#x3D;': '=',
};
const decode = (value: string) => value.replace(/&(?:amp|lt|gt|quot|#x27|#x60|#x3D);/g, (entity) => ENTITIES[entity]);

/** One single-quoted attribute of the first tag that matches `tag`. */
function attribute(html: string, tag: RegExp, name: string): string | undefined {
  const element = html.match(tag)?.[0];
  const value = element?.match(new RegExp(`${name}='([^']*)'`))?.[1];
  return value === undefined ? undefined : decode(value);
}

/** What a browser and a crawler read from the page. */
function readPage(html: string) {
  const refresh = attribute(html, /<meta http-equiv='refresh'[^>]*>/, 'content') ?? '';
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  let replaced: string | undefined;
  // The page's own script, run against a stand-in location.
  new Function('window', scripts[0] ?? '')({ location: { replace: (url: string) => (replaced = url) } });
  const anchor = html.match(/<a href='([^']*)'>([^<]*)<\/a>/);
  return {
    language: attribute(html, /<html[^>]*>/, 'lang'),
    robots: attribute(html, /<meta name='robots'[^>]*>/, 'content'),
    refresh,
    refreshUrl: refresh.replace(/^0; url=/, ''),
    canonical: attribute(html, /<link rel='canonical'[^>]*>/, 'href'),
    link: anchor ? decode(anchor[1]) : undefined,
    linkText: anchor?.[2],
    replaced,
    scripts: scripts.length,
  };
}

/** The key the delivery edge (uri-normalizer.js, fifthbell/delivery 108aafc) reads for a route. */
function edgeKey(route: string): string {
  return `html${route}/index.html`;
}

describe('redirect renderable', () => {
  it('is declared as an HTML page with its own input schema', () => {
    expect(definition).toEqual({
      template: { entry: 'src/templates/layouts/redirect.hbs', partials: [] },
      inputSchema: 'dist/schemas/redirect-input.schema.json',
      contentType: 'text/html; charset=utf-8',
    });
  });

  it('sends a moved story to its new address at once, and keeps itself out of the index', () => {
    const intent = fixtures.routeMove as Intent;
    expect(validate(intent)).toBe(true);
    const page = readPage(renderPage(intent));
    const target = pageUrl('/world/petro-denies-meeting');
    expect(target).toBe('https://fifthbell.com/world/petro-denies-meeting');
    expect(page).toEqual({
      language: 'en',
      robots: 'noindex',
      refresh: `0; url=${target}`,
      refreshUrl: target,
      canonical: target,
      link: target,
      linkText: 'Go to the story',
      replaced: target,
      scripts: 1,
    });
    // The page is written where the edge reads the old address.
    expect(intent.fromKey).toBe(edgeKey(intent.fromRoute));
    expect(intent.toKey).toBe(edgeKey(intent.toRoute));
  });

  it('collapses a chain: every old address leads to the current story in one step', () => {
    const chain = fixtures.chainFlattened as Intent[];
    const latest = pageUrl('/latam/petro-denies-meeting');
    for (const intent of chain) {
      expect(validate(intent)).toBe(true);
      const page = readPage(renderPage(intent));
      expect([page.refreshUrl, page.canonical, page.replaced, page.link]).toEqual([latest, latest, latest, latest]);
      // Never a hop to another redirect page.
      expect(chain.map((other) => other.fromKey)).not.toContain(intent.toKey);
    }
    expect(chain.map((intent) => intent.fromKey)).toEqual([
      'html/politics/petro-denies-meeting/index.html',
      'html/world/petro-denies-meeting/index.html',
    ]);
  });

  it.each([
    ['replacement', fixtures.replacementRetired, 'route_reclaimed'],
    ['removal', fixtures.removalRetired, 'target_withdrawn'],
  ])('refuses a retired intent (%s), so no redirect is written', (_name, intent, reason) => {
    expect((intent as Intent).retiredReason).toBe(reason);
    expect(validate(intent)).toBe(false);
    expect(validate({ ...(intent as Intent), status: 'active', retiredReason: null })).toBe(true);
  });

  it('localizes the fallback link and the page language', () => {
    const base = fixtures.routeMove as Intent;
    for (const [language, text, route] of [
      ['es', 'Ir a la noticia', '/es/mundo/petro-niega-reunion'],
      ['it', 'Vai alla notizia', '/it/mondo/petro-nega-incontro'],
    ] as const) {
      const intent = { ...base, language, toRoute: route, toKey: edgeKey(route) };
      expect(validate(intent)).toBe(true);
      const page = readPage(renderPage(intent));
      expect(page.language).toBe(language);
      expect(page.linkText).toBe(text);
      expect(page.replaced).toBe(pageUrl(route));
    }
  });

  it('ignores keys it does not know', () => {
    expect(validate({ ...(fixtures.routeMove as Intent), futureField: { nested: true } })).toBe(true);
  });

  it('accepts only site paths as routes, never a URL or text', () => {
    const base = fixtures.routeMove as Intent;
    for (const toRoute of [
      'https://evil.example/x',
      '//evil.example/x',
      '@evil.example/x',
      '/world/../admin',
      '/world/x"><script>alert(1)</script>',
      "/world/x';alert(1);'",
      '/world/x; url=javascript:alert(1)',
      '/world/x\u2028y',
      '/World/Upper',
      '/a/b/c',
      '/fr/monde/x',
      '',
    ]) {
      expect(validate({ ...base, toRoute }), toRoute).toBe(false);
    }
    for (const missing of ['reason', 'language', 'fromRoute', 'fromKey', 'toRoute', 'toKey', 'status']) {
      const { [missing]: _removed, ...rest } = base;
      expect(validate(rest), missing).toBe(false);
    }
    expect(validate({ ...base, reason: 'merged' })).toBe(false);
    expect(validate({ ...base, language: 'fr' })).toBe(false);
    expect(validate({ ...base, fromKey: 'html/politics/x.html' })).toBe(false);
  });

  it('escapes a hostile route in every context, even if one reached the template', () => {
    const hostile = `/x' "><script>alert(1)</script>\u2028</script><!--`;
    const html = renderPage({ ...(fixtures.routeMove as Intent), toRoute: hostile });
    const page = readPage(html);
    const expected = pageUrl(hostile);
    // Each context carries the value as data, never as markup or code.
    expect(page.canonical).toBe(expected);
    expect(page.link).toBe(expected);
    expect(page.refreshUrl).toBe(expected);
    expect(page.replaced).toBe(expected);
    expect(html).not.toContain('<script>alert(1)');
    expect(html).not.toContain('<!--');
    expect(page.scripts).toBe(1);
    // The only closing script tag is the page's own.
    expect(html.match(/<\/script>/g)).toHaveLength(1);
  });
});
