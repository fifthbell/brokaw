import type { Meta, StoryObj } from '@storybook/html';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect, within } from 'storybook/test';
import LiveProgram from '../../src/components/live-program/LiveProgram';

const IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E';

/** Only HTTP is substituted; the events service answers 500 throughout. */
class EventsDownFixture {
  root?: Root;
  eventsRequests = 0;
  readonly unexpected: string[] = [];
  private readonly originalFetch = globalThis.fetch;

  constructor() {
    globalThis.fetch = async (input) => {
      const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
      if (url.origin === 'https://cdn.fifthbell.com' && /^\/content\/homepage-current-(en|es|it)\.json$/.test(url.pathname)) {
        return Response.json({
          articles: [{ id: 1, title: 'Fictional story during an outage', excerpt: 'Never published.', slug: 'outage', featuredImage: { url: IMAGE }, publishedAt: new Date().toISOString() }],
          breakingNews: { updates: [] },
        });
      }
      if (url.origin === `http://${window.location.hostname}:3000` && url.pathname === '/events') {
        return Response.json({ data: [] });
      }
      if (url.origin === 'https://api.monitor.gaulatti.com') {
        if (url.pathname === '/events') {
          this.eventsRequests += 1;
          return new Response('events service down', { status: 500 });
        }
        if (['/broadcast/weather', '/broadcast/markets', '/earthquakes'].includes(url.pathname)) return Response.json([]);
      }
      this.unexpected.push(url.toString());
      throw new Error(`Unexpected outage fixture request: ${url}`);
    };
  }

  dispose() {
    this.root?.unmount();
    globalThis.fetch = this.originalFetch;
  }
}

let fixture: EventsDownFixture;

const meta = {
  title: 'React/LiveProgram source failure acceptance',
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'fifthbell/brokaw#35: the actual LiveProgram with the events service answering 500. The program leaves its loading stage and plays its other segments; the event marquee stays out.' } },
  },
  beforeEach: () => {
    const current = new EventsDownFixture();
    fixture = current;
    return () => current.dispose();
  },
  render: () => {
    const container = document.createElement('div');
    container.style.height = '600px';
    fixture.root = createRoot(container);
    fixture.root.render(
      <LiveProgram
        programId='source-failure'
        embedded
        activeComponents={['fifthbell-content', 'fifthbell-marquee']}
        sceneMetadata={{
          'fifthbell-content': {
            showArticles: true, showWeather: false, showEarthquakes: false, showMarkets: false, showLiveEvents: false,
            showCallsignTake: false, audioCueEnabled: false, languageRotation: ['en'],
          },
          'fifthbell-marquee': { showMarquee: true, marqueeMinPostsCount: 0, marqueeMinAverageRelevance: 0, marqueeMinMedianRelevance: 0 },
          'fifthbell-corner': { showWorldClocks: false, showBellIcon: false },
        }}
      />,
    );
    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const EventsDownAtFirstLoadStillGoesOnAir: Story = {
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Fictional story during an outage', {}, { timeout: 5000 });
    await expect(fixture.eventsRequests).toBeGreaterThan(0);
    await expect(fixture.unexpected).toEqual([]);
  },
};
