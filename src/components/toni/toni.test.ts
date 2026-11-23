import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FifthBellChyron, ToniChyron, DEFAULT_TONI_SOCIAL_HANDLES } from './toni-chyron.js';
import { ToniClock, DEFAULT_TONI_CLOCK_CITIES } from './toni-clock.js';
import { ToniLogo, DEFAULT_TONI_LOGOS } from './toni-logo.js';

const html = (element: React.ReactElement) => renderToStaticMarkup(element);

describe('Toni chyron', () => {
  it('shows nothing while hidden or without text', () => {
    expect(html(React.createElement(FifthBellChyron, { text: 'NOTICIA', show: false }))).toBe('');
    expect(html(React.createElement(FifthBellChyron, { text: '', show: true }))).toBe('');
  });

  it('shows the given text with the cycling slug and the Fifth Bell handles', () => {
    const markup = html(React.createElement(FifthBellChyron, { text: 'NOTICIA', show: true }));
    expect(markup).toContain('toni-chyron-visible');
    expect(markup).toContain('NOTICIA');
    expect(markup).toContain('EN VIVO');
    for (const handle of DEFAULT_TONI_SOCIAL_HANDLES) expect(markup).toContain(handle);
  });

  it('uses a fixed label and the given handles, and drops blank handles', () => {
    const markup = html(
      React.createElement(FifthBellChyron, { text: 'X', show: true, label: 'EN DIRECTO', socialHandles: [' @uno ', '  '] }),
    );
    expect(markup).toContain('EN DIRECTO');
    expect(markup).toContain('@uno');
    expect(markup).not.toContain('@fifth.bell');
  });

  it('marks the text as a marquee when the host says so', () => {
    expect(html(React.createElement(ToniChyron, { text: 'LARGO', show: true, useMarquee: true }))).toContain('marquee');
    expect(html(React.createElement(ToniChyron, { text: 'CORTO', show: true }))).not.toContain('marquee');
  });
});

describe('Toni clock', () => {
  it('shows nothing when neither the world clocks nor the bell are on', () => {
    expect(html(React.createElement(ToniClock, { showWorldClocks: false, showBellIcon: false }))).toBe('');
  });

  it('shows the world clocks in their column by default, without the bell', () => {
    const markup = html(React.createElement(ToniClock));
    expect(markup).toContain('toni-clock-corner');
    expect(markup).toContain('toni-clock-worlds');
    expect(markup).not.toContain('toni-clock-bell');
    expect(DEFAULT_TONI_CLOCK_CITIES.length).toBeGreaterThan(0);
  });

  it('shows the bell as an icon when there is no logo', () => {
    const markup = html(React.createElement(ToniClock, { showWorldClocks: false, showBellIcon: true }));
    expect(markup).toContain('toni-clock-bell');
    expect(markup).not.toContain('toni-clock-bell-logo');
  });

  it('shows the bell logo when one is given, at the given size', () => {
    const markup = html(React.createElement(ToniClock, { showWorldClocks: false, showBellIcon: true, bellLogoUrl: '/bell.png', bellSize: 48 }));
    expect(markup).toContain('src="/bell.png"');
    expect(markup).toContain('width:48px');
    expect(markup).not.toContain('toni-clock-worlds');
  });

  it('lays the corner out inline when asked', () => {
    expect(html(React.createElement(ToniClock, { inline: true }))).toContain('toni-clock-corner--inline');
  });
});

describe('Toni logo', () => {
  it('shows the default logos with the first one active', () => {
    const markup = html(React.createElement(ToniLogo, { callsign: 'FB' }));
    for (const logo of DEFAULT_TONI_LOGOS) expect(markup).toContain(logo);
    expect(markup.match(/toni-logo-image--active/g)).toHaveLength(1);
    expect(markup).toContain('alt="FB"');
  });

  it('labels the logo with its subtitle when there is one', () => {
    expect(html(React.createElement(ToniLogo, { callsign: 'FB', subtitle: 'Radio' }))).toContain('alt="FB Radio"');
  });

  it('starts on the given logo, wrapped into range', () => {
    const logos = ['/a.png', '/b.png', '/c.png'];
    const markup = html(React.createElement(ToniLogo, { logos, initialIndex: 4 }));
    // 4 wraps to index 1 of three logos.
    expect(markup).toMatch(/src="\/b\.png"[^>]*toni-logo-image--active/);
  });

  it('falls back to the default logos when none are given', () => {
    const markup = html(React.createElement(ToniLogo, { logos: [] }));
    expect(markup).toContain(DEFAULT_TONI_LOGOS[0]);
  });
});
