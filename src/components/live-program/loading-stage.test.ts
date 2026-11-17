import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LiveProgram from './LiveProgram.js';

// Before its sources answer, LiveProgram shows its loading stage. A static
// render is exactly that first frame (no effects run), so both layouts are
// checked here without depending on how fast a browser story loads data.
const firstFrame = (embedded: boolean | undefined) =>
  renderToStaticMarkup(React.createElement(LiveProgram, { programId: 'loading-fixture', embedded, sceneMetadata: {}, activeComponents: [] }));

describe('LiveProgram loading stage', () => {
  it('fills its host when embedded', () => {
    const html = firstFrame(true);
    expect(html).toContain('<div class="w-full h-full bg-black overflow-hidden"><div class="relative bg-black text-white overflow-hidden w-full h-full" style="width:100%;height:100%">');
    expect(html).not.toContain('<div class="min-h-screen bg-black');
  });

  it.each([false, undefined])('centres a 1920x1080 stage on a full-height page when standalone (embedded %s)', (embedded) => {
    const html = firstFrame(embedded);
    expect(html).toContain('<div class="min-h-screen bg-black flex items-center justify-center overflow-hidden"><div class="relative bg-black text-white overflow-hidden shadow-2xl" style="width:1920px;height:1080px;transform:scale(min(1, min(100vw / 1920, 100vh / 1080)));transform-origin:center center">');
    expect(html).not.toContain('<div class="w-full h-full bg-black overflow-hidden">');
  });
});
