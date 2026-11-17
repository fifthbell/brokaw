import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generateCapturedCatalogPartial, partialPath } from './generate-captured-catalog-partial.mjs';

describe('captured catalog partial', () => {
  it('is the bundle of the current browser adapter', async () => {
    const committed = readFileSync(partialPath, 'utf8');
    expect(await generateCapturedCatalogPartial()).toBe(committed);
  });

  it('carries only the outlet field the contract reads', () => {
    const committed = readFileSync(partialPath, 'utf8');
    expect(committed).toContain('supportedLanguages:[`en`,`es`,`it`]');
    expect(committed).not.toMatch(/192\.168|hashtagServiceBaseUrl|publicSiteUrl|cdnUrl/);
  });
});
