import { describe, expect, it } from 'vitest';

import { canonicalArticleSchema } from './types/canonical-article.js';

/**
 * Standalone pages carry evergreen content — privacy policies, contact and
 * about pages — and are the one layout where the body-block subset is
 * deliberately restricted.
 */
describe('standalone-page layout', () => {
  it('is an accepted canonical layout', () => {
    // Assert against the enum itself rather than a whole fixture document, so
    // this stays true as unrelated required fields come and go.
    const layout = canonicalArticleSchema.shape.layout;
    expect(layout.options).toContain('standalone-page');
  });

  it('registers a layout template and its main partial', async () => {
    const layout = await import('./templates/layouts/standalone-page.hbs?raw');
    const main = await import(
      './templates/partials/components/standalone-main.hbs?raw'
    );

    // The layout must delegate to the standalone main partial rather than the
    // article one: a privacy policy should not render related articles.
    expect(layout.default).toContain('components/standalone-main');
    expect(layout.default).not.toContain('components/article-main');

    // Blocks are rendered by dynamic partial lookup on the block type, which is
    // what lets the pipeline restrict the permitted subset upstream.
    expect(main.default).toContain('{{#each body}}');
  });

  it('does not hardcode any embed block', () => {
    // Third-party embeds are excluded on purpose: an embed inside a privacy
    // policy is itself a privacy problem. The pipeline filters them, and the
    // template must not reintroduce one directly.
    const main = readMain();
    for (const block of [
      'blocks/youtube',
      'blocks/x',
      'blocks/instagram',
      'blocks/tiktok',
      'blocks/data-table',
      'blocks/live-update',
      'blocks/audio',
    ]) {
      expect(main).not.toContain(block);
    }
  });
});

function readMain(): string {
  const url = new URL(
    './templates/partials/components/standalone-main.hbs',
    import.meta.url,
  );
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('node:fs').readFileSync(url, 'utf8');
}
