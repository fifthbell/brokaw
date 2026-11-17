import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FastAverageColor } from 'fast-average-color';
import { Marquee } from './Marquee.js';
import { WorldClocks, DEFAULT_WORLD_CLOCK_CITIES } from './WorldClocks.js';
import { ArticleSlide } from './slides/ArticleSlide.js';
import { CallsignSlide } from './slides/CallsignSlide.js';
import { LiveEventSlide } from './slides/LiveEventSlide.js';
import type { Event as ProgramEvent } from '../events.js';

describe('live-program components suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Marquee', () => {
    const mockEvents: ProgramEvent[] = [
      {
        id: 1,
        uuid: 'ev-1',
        title: 'High Relevance Event',
        summary: 'Summary 1',
        status: 'open',
        created_at: '2026-11-15T00:00:00Z',
        updated_at: '2026-11-15T00:00:00Z',
        posts_count: 4,
        posts: [
          { id: 1, uuid: 'p-1', content: 'c1', source: 's', uri: 'u', hash: 'h', author: 'a', createdAt: '2026-11-15T00:00:00Z', relevance: 8, match_score: 1 },
          { id: 2, uuid: 'p-2', content: 'c2', source: 's', uri: 'u', hash: 'h', author: 'a', createdAt: '2026-11-15T00:00:00Z', relevance: 7, match_score: 1 },
          { id: 3, uuid: 'p-3', content: 'c3', source: 's', uri: 'u', hash: 'h', author: 'a', createdAt: '2026-11-15T00:00:00Z', relevance: 9, match_score: 1 },
          { id: 4, uuid: 'p-4', content: 'c4', source: 's', uri: 'u', hash: 'h', author: 'a', createdAt: '2026-11-15T00:00:00Z', relevance: 8, match_score: 1 },
        ],
      },
      {
        id: 2,
        uuid: 'ev-2',
        title: 'Low Relevance Event',
        summary: 'Summary 2',
        status: 'open',
        created_at: '2026-11-15T01:00:00Z',
        updated_at: '2026-11-15T01:00:00Z',
        posts_count: 2,
        posts: [
          { id: 5, uuid: 'p-5', content: 'c5', source: 's', uri: 'u', hash: 'h', author: 'a', createdAt: '2026-11-15T00:00:00Z', relevance: 2, match_score: 1 },
        ],
      },
      {
        id: 3,
        uuid: 'ev-3',
        title: 'Uncounted Posts Event',
        summary: 'Summary 3',
        status: 'open',
        created_at: '2026-11-15T02:00:00Z',
        updated_at: '2026-11-15T02:00:00Z',
        posts_count: undefined as any,
        posts: [
          { id: 6, uuid: 'p-6', content: 'c6', source: 's', uri: 'u', hash: 'h', author: 'a', createdAt: '2026-11-15T00:00:00Z', relevance: 8, match_score: 1 },
          { id: 7, uuid: 'p-7', content: 'c7', source: 's', uri: 'u', hash: 'h', author: 'a', createdAt: '2026-11-15T00:00:00Z', relevance: 8, match_score: 1 },
          { id: 8, uuid: 'p-8', content: 'c8', source: 's', uri: 'u', hash: 'h', author: 'a', createdAt: '2026-11-15T00:00:00Z', relevance: 8, match_score: 1 },
          { id: 9, uuid: 'p-9', content: 'c9', source: 's', uri: 'u', hash: 'h', author: 'a', createdAt: '2026-11-15T00:00:00Z', relevance: 8, match_score: 1 },
        ],
      },
    ];

    it('renders marquee when matching events are present and calculates statistics', () => {
      const onCycle = vi.fn();
      const html = renderToStaticMarkup(
        React.createElement(Marquee, {
          events: mockEvents,
          onCycleComplete: onCycle,
          minPostsCount: 4,
          minAverageRelevance: 6,
          minMedianRelevance: 7,
        })
      );

      expect(html).toContain('High Relevance Event');
      expect(html).not.toContain('Low Relevance Event');

      // Empty filtered events returns null (empty string in static markup)
      const emptyHtml = renderToStaticMarkup(
        React.createElement(Marquee, {
          events: [],
        })
      );
      expect(emptyHtml).toBe('');

    });

    it('scores an event without posts as relevance 0, so only zero thresholds keep it', () => {
      const postless: ProgramEvent = { ...mockEvents[0], uuid: 'ev-empty', title: 'Postless Event', posts_count: 9, posts: [] };
      const strict = renderToStaticMarkup(React.createElement(Marquee, { events: [postless], minAverageRelevance: 1, minMedianRelevance: 0 }));
      expect(strict).toBe('');
      const median = renderToStaticMarkup(React.createElement(Marquee, { events: [postless], minAverageRelevance: 0, minMedianRelevance: 1 }));
      expect(median).toBe('');
      const open = renderToStaticMarkup(React.createElement(Marquee, { events: [postless], minAverageRelevance: 0, minMedianRelevance: 0 }));
      expect(open).toContain('Postless Event');
    });

    it('uses the middle post for an odd count and the mean of the two middle posts for an even count', () => {
      const posts = mockEvents[0].posts;
      // Odd: relevances 1, 9, 9 have median 9 and mean about 6.3.
      const odd: ProgramEvent = { ...mockEvents[0], uuid: 'ev-odd', title: 'Odd Event', posts_count: 3,
        posts: [{ ...posts[0], relevance: 1 }, { ...posts[1], relevance: 9 }, { ...posts[2], relevance: 9 }] };
      // Even: relevances 1, 6, 8, 9 have median 7 and mean 6.
      const even: ProgramEvent = { ...mockEvents[0], uuid: 'ev-even', title: 'Even Event', posts_count: 4,
        posts: [{ ...posts[0], relevance: 1 }, { ...posts[1], relevance: 6 }, { ...posts[2], relevance: 8 }, { ...posts[3], relevance: 9 }] };
      const render = (minMedianRelevance: number) => renderToStaticMarkup(React.createElement(Marquee, {
        events: [odd, even], minPostsCount: 0, minAverageRelevance: 0, minMedianRelevance,
      }));
      expect(render(9)).toContain('Odd Event');
      expect(render(9)).not.toContain('Even Event');
      expect(render(7)).toContain('Even Event');
      expect(render(7.5)).not.toContain('Even Event');
    });
  });

  describe('WorldClocks', () => {
    it('renders default and custom cities with translations and time override', () => {
      const fixedTime = new Date('2026-11-15T12:00:00Z');
      const htmlDefault = renderToStaticMarkup(
        React.createElement(WorldClocks, {
          currentTime: fixedTime,
          language: 'it',
          shuffleCities: false,
        })
      );
      // Unshuffled, the first default city leads: New York, 07:00 at 12:00Z.
      expect(htmlDefault).toContain('07:00');
      expect(htmlDefault).toContain('NEW YORK');

      // A city without a translation keeps its own name; a valid override replaces the clock.
      const customCities = [{ city: 'CUSTOMTOWN', timezone: 'UTC' }];
      const htmlCustom = renderToStaticMarkup(
        React.createElement(WorldClocks, {
          currentTime: fixedTime,
          cities: customCities,
          timeOverride: {
            startTime: '10:00',
            startedAt: '2026-11-15T12:00:00Z',
          },
          shuffleCities: false,
        })
      );
      expect(htmlCustom).toContain('CUSTOMTOWN');
      expect(htmlCustom).toContain('10:00');

      // An unusable override falls back to the city's own time zone.
      const htmlBadOverride = renderToStaticMarkup(
        React.createElement(WorldClocks, {
          currentTime: fixedTime,
          cities: customCities,
          timeOverride: { startTime: 'invalid', startedAt: 'invalid' },
          shuffleCities: false,
        })
      );
      expect(htmlBadOverride).toContain('12:00');

      // Spanish labels translate the default cities.
      const htmlSpanish = renderToStaticMarkup(
        React.createElement(WorldClocks, { currentTime: fixedTime, language: 'es', shuffleCities: false })
      );
      expect(htmlSpanish).toContain('NUEVA YORK');

      // Without currentTime the clock starts from the current instant.
      vi.setSystemTime(new Date('2026-11-15T18:30:00Z'));
      const htmlNoTime = renderToStaticMarkup(
        React.createElement(WorldClocks, {
          currentTime: undefined,
          language: 'en',
          cities: [{ city: 'LONDON', timezone: 'Europe/London' }],
        })
      );
      expect(htmlNoTime).toContain('18:30');
      expect(htmlNoTime).toContain('LONDON');
    });
  });

  describe('ArticleSlide', () => {
    it('renders article slide with category and fallback image', () => {
      const htmlWithCat = renderToStaticMarkup(
        React.createElement(ArticleSlide, {
          newsItem: {
            id: 'art-1',
            headline: 'Major Discovery',
            summary: 'Details of the discovery',
            imageUrl: 'https://img.test/pic.jpg',
            category: 'Science',
            url: 'https://fifthbell.com/science/discovery',
          },
          progress: 50,
        })
      );
      expect(htmlWithCat).toContain('Major Discovery');
      expect(htmlWithCat).toContain('Science');

      // Without category and empty imageUrl (fallback image)
      const htmlNoCat = renderToStaticMarkup(
        React.createElement(ArticleSlide, {
          newsItem: {
            id: 'art-2',
            headline: 'Minimal Story',
            summary: 'Brief summary',
            imageUrl: '',
            url: 'https://fifthbell.com/story',
          },
          progress: 0,
        })
      );
      expect(htmlNoCat).toContain('Minimal Story');
    });
  });

  describe('CallsignSlide', () => {
    it('renders callsign slide with NY time', () => {
      const fixedTime = new Date('2026-11-15T15:30:45Z');
      const html = renderToStaticMarkup(
        React.createElement(CallsignSlide, {
          currentTime: fixedTime,
          audioRef: { current: null },
        })
      );
      expect(html).toContain('fifth');
      expect(html).toContain('bell');
    });
  });

  describe('LiveEventSlide', () => {
    it('renders live event slide with updates and timeline', () => {
      const liveEvent = {
        category: 'CHAMPIONS LEAGUE',
        title: 'Real Madrid vs Liverpool',
        image: 'https://img.test/match.jpg',
        url: '/match',
        sofascore_id: 112233,
        updatedAt: '2026-11-15T20:00:00Z',
        updates: [
          { timestamp: '2026-11-15T20:15:00Z', text: 'Goal scored by Vinicius Jr' },
          { time: '20:30', html: '<b>Yellow card</b> for defender' },
          { text: 'Halftime whistle' },
          { time: '20:45' },
        ],
      };

      const html = renderToStaticMarkup(
        React.createElement(LiveEventSlide, {
          event: liveEvent,
          progress: 25,
          language: 'en',
        })
      );
      expect(html).toContain('Real Madrid vs Liverpool');
      expect(html).toContain('Goal scored by Vinicius Jr');
      expect(html).toContain('Yellow card for defender');

      // Empty updates non-sports
      const emptyUpdatesEvent = {
        ...liveEvent,
        updates: [],
        sofascore_id: undefined,
      };
      const htmlEmpty = renderToStaticMarkup(
        React.createElement(LiveEventSlide, {
          event: emptyUpdatesEvent,
          progress: 0,
          language: 'es',
        })
      );
      expect(htmlEmpty).toContain('Sin actualizaciones');
      expect(htmlEmpty).toContain('Real Madrid vs Liverpool');

      // Non-sports with updates exercising html vs text vs null
      const nonSportsEvent = {
        ...liveEvent,
        sofascore_id: undefined,
        updates: [
          { timestamp: '2026-11-15T20:15:00Z', text: 'Text update' },
          { html: '<span>Html update</span>' },
          { timestamp: '2026-11-15T20:30:00Z' },
        ],
      };
      const htmlNonSports = renderToStaticMarkup(
        React.createElement(LiveEventSlide, {
          event: nonSportsEvent,
          progress: 10,
          language: 'en',
        })
      );
      expect(htmlNonSports).toContain('Text update');
      expect(htmlNonSports).toContain('Html update');

      // Sports event with empty updates
      const sportsEmptyUpdates = {
        ...liveEvent,
        updates: [],
        sofascore_id: 112233,
      };
      const htmlSportsEmpty = renderToStaticMarkup(
        React.createElement(LiveEventSlide, {
          event: sportsEmptyUpdates,
          progress: 0,
          language: 'en',
        })
      );
      expect(htmlSportsEmpty).toContain('No updates yet');
    });
  });
});
