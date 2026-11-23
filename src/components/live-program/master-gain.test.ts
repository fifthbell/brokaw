import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import DefaultLiveProgram, { LiveProgram, applyMasterGain } from './LiveProgram.js';

// gaulatti/alcantara#381: Alcántara embeds LiveProgram on its program page and drives its sound
// with the page's output gain, as its own renderer did (alcantara#312).
describe('LiveProgram for embedding hosts', () => {
  it('is also a named export, the same component as the default', () => {
    expect(LiveProgram).toBe(DefaultLiveProgram);
  });

  it.each([
    [1, 1, false],
    [0.42, 0.42, false],
    [1.7, 1, false],
    [-0.3, 0, true],
    [0, 0, true],
    [0.00005, 0.00005, true],
  ])('applies gain %s as volume %s, muted %s', (gain, volume, muted) => {
    const audio = { volume: 0.5, muted: false };
    applyMasterGain(audio, gain);
    expect(audio.volume).toBeCloseTo(volume);
    expect(audio.muted).toBe(muted);
  });

  it('treats a non-finite gain as full volume', () => {
    const audio = { volume: 0.2, muted: true };
    applyMasterGain(audio, Number.NaN);
    expect(audio).toEqual({ volume: 1, muted: false });
  });

  it('accepts masterGain without changing the first frame', () => {
    const props = { programId: 'gain-fixture', embedded: true, sceneMetadata: {}, activeComponents: [] };
    // The loading stage shows the time; renders a second apart may differ only there.
    const frame = (extra: object) =>
      renderToStaticMarkup(React.createElement(LiveProgram, { ...props, ...extra })).replace(/\d{2}:\d{2}:\d{2}/g, 'HH:MM:SS');
    expect(frame({ masterGain: 0 })).toBe(frame({}));
  });
});
