import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LiveProgram } from './LiveProgram.js';
import { FIFTHBELL_ASSETS, fifthBellAssets } from './assets.js';

// gaulatti/alcantara#381: embedded on Alcántara's /program/<id>, page-relative asset paths would
// point under /program/; the host passes where it serves the assets.
const firstFrame = (assetBaseUrl?: string) =>
  renderToStaticMarkup(
    React.createElement(LiveProgram, { programId: 'asset-fixture', embedded: true, sceneMetadata: {}, activeComponents: ['fifthbell'], assetBaseUrl }),
  );

describe('LiveProgram asset base', () => {
  it("keeps Brokaw's own page-relative paths by default", () => {
    expect(FIFTHBELL_ASSETS.images.nyc).toBe('./fifthbell/images/nyc.jpg');
    expect(FIFTHBELL_ASSETS.audio.pipes).toBe('./fifthbell/audio/pipes.ogg');
    expect(firstFrame()).toContain('src="./fifthbell/images/nyc.jpg"');
  });

  it("uses a host's base for every image the first frame shows", () => {
    const html = firstFrame('/fifthbell');
    expect(html).toContain('src="/fifthbell/images/nyc.jpg"');
    expect(html).not.toContain('./fifthbell/');
  });

  it('builds every asset under the base, with or without a trailing slash', () => {
    for (const base of ['/fifthbell', '/fifthbell/']) {
      const assets = fifthBellAssets(base);
      expect(assets.audio.pipes).toBe('/fifthbell/audio/pipes.ogg');
      expect(Object.values(assets.images).every((url) => url.startsWith('/fifthbell/images/'))).toBe(true);
    }
    expect(fifthBellAssets('https://cdn.example.test/fb').images.tokyo).toBe('https://cdn.example.test/fb/images/tokyo.jpg');
  });
});
