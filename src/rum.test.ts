import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderWithAssets, type LayoutName, type RendererAssets } from './renderer.core.js';
import { renderRumLoader, rumConfigSchema, type RumConfig } from './rum.js';
import type { CanonicalDocument } from './types/canonical-article.js';

const config: RumConfig = {
  appMonitorId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  applicationVersion: '2026.08.20',
  region: 'us-east-1',
  identityPoolId: 'us-east-1:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  guestRoleArn: 'arn:aws:iam::111111111111:role/example-rum-guest'
};

const baseDocument: CanonicalDocument = {
  id: 'page-1',
  slug: '/privacy-contract',
  layout: 'article-page',
  canonicalUrl: 'https://example.test/privacy-contract',
  contentVersion: '2026-08-20T12:00:00.000Z',
  publishedAt: '2026-08-20T12:00:00.000Z',
  updatedAt: '2026-08-20T12:00:00.000Z',
  status: 'published',
  title: 'Privacy contract',
  language: 'en',
  featured: false,
  authors: [],
  categories: [],
  body: []
};

const sourceRoot = path.dirname(fileURLToPath(import.meta.url));
const standardShell = fs.readFileSync(path.join(sourceRoot, 'templates/partials/shell/doc-start-standard.hbs'), 'utf8');
const notFoundShell = fs.readFileSync(path.join(sourceRoot, 'templates/partials/shell/doc-start-404.hbs'), 'utf8');
const layoutNames: LayoutName[] = [
  'article-page',
  'homepage',
  'category-page',
  'search-page',
  '404',
  'live-story',
  'link-in-bio',
  'media-page'
];
const layouts = Object.fromEntries(
  layoutNames.map((layout) => [layout, layout === '404' ? '{{> shell/doc-start-404}}</div></body></html>' : '{{> shell/doc-start-standard}}</div></body></html>'])
) as Record<LayoutName, string>;
const assets: RendererAssets = {
  layouts,
  partials: {
    'shell/doc-start-standard': standardShell,
    'shell/doc-start-404': notFoundShell
  },
  styles: ''
};

describe('tenant-neutral RUM rendering contract', () => {
  it('emits no loader when rumConfig is absent', () => {
    const html = renderWithAssets(baseDocument, assets);
    expect(html).not.toContain('data-brokaw-rum-loader');
    expect(html).not.toContain('AwsRumClient');
  });

  it.each([
    ['article-page', 'en'],
    ['404', 'es'],
    ['media-page', 'it']
  ] as const)('renders the contract for %s pages', (layout, language) => {
    const html = renderWithAssets({ ...baseDocument, layout, language, rumConfig: config }, assets);

    expect(html).toContain('data-brokaw-rum-loader');
    expect(html).toContain(config.appMonitorId);
    expect(html).toContain(config.applicationVersion);
    expect(html).toContain(`page_type: ${JSON.stringify(layout)}`);
    expect(html).toContain(`content_language: ${JSON.stringify(language)}`);
  });

  it('uses pathname-only page IDs and the privacy-minimized telemetry set', () => {
    const loader = renderRumLoader(config, 'article-page', 'en');

    expect(loader).toContain('pageId: window.location.pathname');
    expect(loader).not.toContain('window.location.search');
    expect(loader).not.toContain('window.location.hash');
    expect(loader).toContain('recordResourceUrl: false');
    expect(loader).toContain('allowCookies: false');
    expect(loader).toContain('enableXRay: false');
    expect(loader).toContain("['errors'");
    expect(loader).toContain("['performance'");
    expect(loader).not.toContain("'http'");
    expect(loader).not.toContain("'replay'");
    expect(loader).toContain("entry.entryType === 'resource'");
  });

  it('filters URL, query, content, and credential-bearing error values without stack traces', () => {
    const loader = renderRumLoader(config, 'article-page', 'en');

    expect(loader).toContain('stackTraceLength: 0');
    expect(loader).toContain('containsSensitiveErrorData');
    expect(loader).toMatch(/https\?:/);
    expect(loader).toContain('authorization|bearer|credential|password');
    expect(loader).toContain('<[^>]+>');
  });

  it('isolates loader and script failures from page rendering', () => {
    const loader = renderRumLoader(config, 'article-page', 'en');

    expect(loader).toContain('try {');
    expect(loader).toContain('catch (_rumError)');
    expect(loader).toContain('script.onerror');
    expect(loader).toContain('window[namespace] = function () {}');
  });

  it('rejects incomplete, mismatched, or legacy display-name configuration', () => {
    expect(() => rumConfigSchema.parse({ ...config, identityPoolId: 'eu-west-1:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' })).toThrow();
    expect(() => rumConfigSchema.parse({ ...config, appMonitorName: 'legacy-name' })).toThrow();
    expect(() => rumConfigSchema.parse({ appMonitorName: 'legacy-name' })).toThrow();
  });
});
