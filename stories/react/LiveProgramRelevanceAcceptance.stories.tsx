import type { Meta, StoryObj } from '@storybook/html';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect, waitFor, within } from 'storybook/test';

import LiveProgram from '../../src/components/live-program/LiveProgram';
import { clearCachedEvents, type Event } from '../../src/components/live-program/events';

const HEADLINE = 'Verified fixture event awaiting relevance review';
const IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E';

function fixtureEvent(relevance: number): Event {
  return {
    id: 1,
    uuid: '10000000-0000-4000-8000-000000000001',
    title: HEADLINE,
    summary: 'Bounded fixture data; never published.',
    status: 'open',
    created_at: '2026-10-25T10:00:00.000Z',
    updated_at: '2026-10-25T10:00:00.000Z',
    posts_count: 4,
    posts: Array.from({ length: 4 }, (_, index) => ({
      id: index + 1,
      uuid: `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      content: 'Confirmed fixture report',
      source: 'rss',
      uri: `https://news.example.test/reports/${index + 1}`,
      hash: 'a'.repeat(64),
      author: 'News desk',
      createdAt: '2026-10-25T10:00:00.000Z',
      relevance,
      match_score: 0.9,
    })),
  };
}

class RelevanceTransport {
  root?: Root;
  relevance = 8;
  readonly received: Event[] = [];
  readonly unexpected: string[] = [];
  private readonly originalFetch = globalThis.fetch;

  constructor() {
    clearCachedEvents();
    globalThis.fetch = async (input) => {
      const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
      if (url.origin === 'https://api.monitor.gaulatti.com') {
        if (url.pathname === '/events') {
          const current = fixtureEvent(this.relevance);
          this.received.push(current);
          return Response.json({ events: [current], total: 1 });
        }
        if (['/broadcast/weather', '/broadcast/markets', '/earthquakes'].includes(url.pathname)) {
          return Response.json([]);
        }
      }
      if (url.origin === 'https://cdn.fifthbell.com' && url.pathname === '/content/homepage-current-en.json') {
        return Response.json({
          articles: [1, 2].map((id) => ({
            id,
            title: `Bounded fixture article ${id}`,
            excerpt: 'A local article keeps the real playlist advancing.',
            slug: `bounded-fixture-${id}`,
            featured: true,
            featuredImage: { url: IMAGE },
            categories: [{ name: 'Fixture', slug: 'fixture' }],
            publishedAt: new Date().toISOString(),
          })),
          breakingNews: { main: { title: 'Bounded fixture live event', image: IMAGE, url: '/fixture' }, updates: [] },
        });
      }
      this.unexpected.push(url.toString());
      throw new Error(`Unexpected relevance fixture request: ${url}`);
    };
  }

  dispose() {
    this.root?.unmount();
    globalThis.fetch = this.originalFetch;
    clearCachedEvents();
  }
}

let transport: RelevanceTransport;

const meta = {
  title: 'React/LiveProgram relevance acceptance',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Actual LiveProgram, event refresh, playlist, curtain and Marquee with synthetic HTTP responses. Only post relevance changes; real component clocks and the normal animation/curtain boundary adopt the update. No hook, comparator or timing implementation is substituted.',
      },
    },
  },
  beforeEach: () => {
    const current = new RelevanceTransport();
    transport = current;
    return () => current.dispose();
  },
  render: () => {
    const container = document.createElement('div');
    container.style.width = '1200px';
    container.style.height = '700px';
    transport.root = createRoot(container);
    transport.root.render(<LiveProgram embedded sceneMetadata={{
      'fifthbell-content': {
        showArticles: true, showWeather: false, showEarthquakes: false,
        showMarkets: false, showLiveEvents: false, showCallsignTake: false,
        audioCueEnabled: false, languageRotation: ['en'], articlesDurationMs: 1000,
      },
      'fifthbell-marquee': {
        showMarquee: true, marqueeMinPostsCount: 4,
        marqueeMinAverageRelevance: 6, marqueeMinMedianRelevance: 6,
        marqueePixelsPerSecond: 1000, marqueeMinDurationSeconds: 1,
      },
      'fifthbell-corner': { showWorldClocks: false },
    }} activeComponents={['fifthbell-content', 'fifthbell-marquee']} />);
    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const RelevanceDropIsAdopted: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(HEADLINE)).toBeVisible();
    await waitFor(() => expect(transport.received.length).toBeGreaterThanOrEqual(2));

    transport.relevance = 1;
    await waitFor(() => expect(transport.received.some((event) => event.posts.every((post) => post.relevance === 1))).toBe(true), { timeout: 4000 });
    const high = transport.received.find((event) => event.posts.every((post) => post.relevance === 8))!;
    const low = transport.received.find((event) => event.posts.every((post) => post.relevance === 1))!;
    await expect({ ...low, posts: low.posts.map((post) => ({ ...post, relevance: 8 })) }).toEqual(high);

    // The real animation iteration must request the real curtain, then its
    // unmodified five-second completion adopts the new programEvents snapshot.
    await waitFor(() => expect(canvasElement.textContent).toContain('This is fifthbell.'), { timeout: 6000 });
    await waitFor(() => expect(canvasElement.textContent).not.toContain('This is fifthbell.'), { timeout: 6500 });
    await expect(canvas.queryByText(HEADLINE)).toBeNull();
    await expect(canvasElement.querySelector('audio')).not.toBeNull();
    await expect(transport.unexpected).toEqual([]);
    console.info('relevance adoption observed', {
      eventUuid: high.uuid,
      postUuids: high.posts.map((post) => post.uuid),
      beforeRelevance: 8,
      afterRelevance: 1,
      headlineInitiallyVisible: true,
      actualCurtainCompleted: true,
      headlineAfterAdoptionVisible: false,
    });
  },
};
