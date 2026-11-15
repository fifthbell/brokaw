import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FastAverageColor } from 'fast-average-color';
import { Marquee, calculateAverageRelevance, calculateMedianRelevance } from './Marquee.js';
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

      // Test calculateMedianRelevance and calculateAverageRelevance with empty array
      expect(calculateMedianRelevance([])).toBe(0);
      expect(calculateAverageRelevance([])).toBe(0);
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
      expect(htmlDefault).toBeDefined();

      // Custom non-translatable city
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

      // Fallback city when cityPool item is undefined and invalid timeOverride
      const trickyCities: any = [{ city: 'CUSTOMTOWN', timezone: 'UTC' }];
      trickyCities[Symbol.iterator] = function* () {
        yield undefined;
      };

      const htmlFallbackCity = renderToStaticMarkup(
        React.createElement(WorldClocks, {
          currentTime: fixedTime,
          cities: trickyCities,
          timeOverride: {
            startTime: 'invalid',
            startedAt: 'invalid',
          },
          shuffleCities: false,
        })
      );
      expect(htmlFallbackCity).toContain('CUSTOMTOWN');

      // WorldClocks without currentTime uses interval
      const htmlNoTime = renderToStaticMarkup(
        React.createElement(WorldClocks, {
          currentTime: undefined,
          language: 'en',
          cities: DEFAULT_WORLD_CLOCK_CITIES,
        })
      );
      expect(htmlNoTime).toBeDefined();
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
      expect(htmlEmpty).toBeDefined();

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
