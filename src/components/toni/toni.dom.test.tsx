import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FifthBellChyron } from './toni-chyron.js';
import { ToniClock } from './toni-clock.js';
import { ToniLogo } from './toni-logo.js';

// The Toni components run timers and effects; these tests run them in a DOM with fake timers.

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

const render = (element: React.ReactElement) => act(() => root.render(element));
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const text = (selector: string) => container.querySelector(selector)?.textContent ?? null;

describe('ToniLogo rotation', () => {
  it('moves the active logo along on each interval, wrapping at the end', () => {
    render(React.createElement(ToniLogo, { logos: ['/a.png', '/b.png', '/c.png'], rotationIntervalMs: 1000 }));
    const active = () => container.querySelector('.toni-logo-image--active')?.getAttribute('src');
    expect(active()).toBe('/a.png');
    advance(1000);
    expect(active()).toBe('/b.png');
    advance(1000);
    expect(active()).toBe('/c.png');
    advance(1000);
    expect(active()).toBe('/a.png');
  });

  it('holds still when rotation is off or there is only one logo', () => {
    render(React.createElement(ToniLogo, { logos: ['/a.png', '/b.png'], rotate: false, rotationIntervalMs: 1000 }));
    advance(5000);
    expect(container.querySelector('.toni-logo-image--active')?.getAttribute('src')).toBe('/a.png');
    render(React.createElement(ToniLogo, { logos: ['/only.png'], rotationIntervalMs: 1000 }));
    advance(5000);
    expect(container.querySelector('.toni-logo-image--active')?.getAttribute('src')).toBe('/only.png');
  });

  it('starts on the given index, even when it is out of range', () => {
    render(React.createElement(ToniLogo, { logos: ['/a.png', '/b.png', '/c.png'], initialIndex: -1, rotate: false }));
    expect(container.querySelector('.toni-logo-image--active')?.getAttribute('src')).toBe('/c.png');
  });
});

describe('FifthBellChyron timers', () => {
  it('shows the text it is given, and changes it after the fade', () => {
    render(React.createElement(FifthBellChyron, { text: 'UNO', show: true, label: 'EN DIRECTO' }));
    expect(text('.toni-chyron-text')).toBe('UNO');
    render(React.createElement(FifthBellChyron, { text: 'DOS', show: true, label: 'EN DIRECTO' }));
    expect(container.querySelector('.toni-chyron-text')!.classList.contains('is-changing')).toBe(true);
    advance(300);
    expect(text('.toni-chyron-text')).toBe('DOS');
    expect(container.querySelector('.toni-chyron-text')!.classList.contains('is-changing')).toBe(false);
  });

  it('cycles the slug between EN VIVO and LIVE, with the fade in between', () => {
    render(React.createElement(FifthBellChyron, { text: 'X', show: true }));
    expect(text('.toni-chyron-slug-text')).toBe('EN VIVO');
    advance(4000);
    expect(container.querySelector('.toni-chyron-slug-text')!.classList.contains('toni-chyron-slug-text--fading')).toBe(true);
    advance(350);
    expect(text('.toni-chyron-slug-text')).toBe('LIVE');
    advance(4000 + 350);
    expect(text('.toni-chyron-slug-text')).toBe('EN VIVO');
  });

  it('does not cycle a forced label', () => {
    render(React.createElement(FifthBellChyron, { text: 'X', show: true, label: 'EN DIRECTO' }));
    advance(20000);
    expect(text('.toni-chyron-slug-text')).toBe('EN DIRECTO');
  });

  it('cycles the social handles and shows one at a time', () => {
    render(React.createElement(FifthBellChyron, { text: 'X', show: true, socialHandles: ['@uno', '@dos', '@tres'] }));
    const active = () => container.querySelector('.toni-chyron-social--active')?.textContent;
    expect(active()).toBe('@uno');
    advance(4000);
    expect(active()).toBe('@dos');
    advance(4000);
    expect(active()).toBe('@tres');
    advance(4000);
    expect(active()).toBe('@uno');
  });

  it('keeps one social handle still and shows the marquee when asked', () => {
    render(React.createElement(FifthBellChyron, { text: 'X', show: true, useMarquee: true, socialHandles: ['@solo'] }));
    advance(20000);
    expect(container.querySelector('.toni-chyron-social--active')?.textContent).toBe('@solo');
    expect(container.querySelector('.toni-chyron-text')!.classList.contains('marquee')).toBe(true);
  });

  it('hides when told to, and shows again when told to', () => {
    render(React.createElement(FifthBellChyron, { text: 'X', show: true }));
    expect(container.querySelector('.toni-chyron')).not.toBeNull();
    render(React.createElement(FifthBellChyron, { text: 'X', show: false }));
    expect(container.querySelector('.toni-chyron')).toBeNull();
    render(React.createElement(FifthBellChyron, { text: 'X', show: true }));
    expect(container.querySelector('.toni-chyron')).not.toBeNull();
  });
});

describe('ToniClock world rotation', () => {
  it('moves to the next city after each interval and its transition', () => {
    render(React.createElement(ToniClock, {
      cities: [{ city: 'UNO', timezone: 'UTC' }, { city: 'DOS', timezone: 'UTC' }],
      rotationIntervalMs: 1000,
      transitionDurationMs: 100,
      showBellIcon: false,
    }));
    const first = container.innerHTML;
    advance(1000 + 100);
    expect(container.innerHTML).not.toBe(first);
  });

  it('falls back to the default cities when none are given', () => {
    render(React.createElement(ToniClock, { cities: [], showBellIcon: false }));
    expect(container.querySelector('.toni-clock-worlds')).not.toBeNull();
  });
});

describe('FifthBellChyron social stack', () => {
  it('shows no social stack when the handles are empty', () => {
    render(React.createElement(FifthBellChyron, { text: 'X', show: true, socialHandles: [] }));
    expect(container.querySelector('.toni-chyron-social-stack')).toBeNull();
    expect(text('.toni-chyron-text')).toBe('X');
  });
});
