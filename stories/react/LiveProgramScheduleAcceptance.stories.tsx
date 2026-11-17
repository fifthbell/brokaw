import type { Meta, StoryObj } from '@storybook/html';
import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { expect, waitFor, within } from 'storybook/test';
import LiveProgram from '../../src/components/live-program/LiveProgram';

const IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E';
const EVENT_POST = { content: 'Fixture post', source: 'fixture', uri: 'https://fixture.invalid/post', hash: 'h', author: 'Fixture', createdAt: '2026-11-17T00:00:00Z', match_score: 1 };
const MARQUEE_EVENT = {
  id: 1, uuid: 'fixture-event', title: 'Fictional marquee event', summary: 'Fixture', status: 'open',
  created_at: '2026-11-17T00:00:00Z', updated_at: '2026-11-17T00:00:00Z', posts_count: 1,
  posts: [{ ...EVENT_POST, id: 1, uuid: 'fixture-post', relevance: 9 }],
};

/** Only HTTP and, where a story says so, the wall clock are substituted. */
class ScheduleFixture {
  root?: Root;
  readonly unexpected: string[] = [];
  private readonly originalFetch = globalThis.fetch;
  private readonly OriginalDate = Date;
  private clockOffset: number | null = null;

  constructor() {
    globalThis.fetch = async (input) => {
      const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
      if (url.origin === 'https://cdn.fifthbell.com' && /^\/content\/homepage-current-(en|es|it)\.json$/.test(url.pathname)) {
        return Response.json({
          articles: [{ id: 1, title: 'Fictional fixture story', excerpt: 'Never published.', slug: 'fixture', featuredImage: { url: IMAGE }, publishedAt: new Date().toISOString() }],
          breakingNews: { updates: [] },
        });
      }
      if (url.origin === `http://${window.location.hostname}:3000` && url.pathname === '/events') {
        return Response.json({ data: [] });
      }
      if (url.origin === 'https://api.monitor.gaulatti.com') {
        if (url.pathname === '/events') return Response.json({ events: [MARQUEE_EVENT], total: 1 });
        if (['/broadcast/weather', '/broadcast/markets', '/earthquakes'].includes(url.pathname)) return Response.json([]);
      }
      this.unexpected.push(url.toString());
      throw new Error(`Unexpected schedule fixture request: ${url}`);
    };
  }

  /** Moves the wall clock so the local time reads minutes:seconds of the current hour. */
  setLocalClock(minutes: number, seconds: number) {
    const Real = this.OriginalDate;
    const target = new Real();
    target.setMinutes(minutes, seconds, 0);
    this.clockOffset = target.getTime() - Real.now();
    if (globalThis.Date !== Real) return;
    const fixture = this;
    class FixtureDate extends Real {
      constructor(...args: ConstructorParameters<DateConstructor> | []) {
        if (args.length === 0) super(Real.now() + (fixture.clockOffset ?? 0));
        else super(...(args as ConstructorParameters<DateConstructor>));
      }
      static now() { return Real.now() + (fixture.clockOffset ?? 0); }
    }
    globalThis.Date = FixtureDate as DateConstructor;
  }

  render(node: React.ReactNode) {
    flushSync(() => this.root!.render(node));
  }

  dispose() {
    this.root?.unmount();
    globalThis.Date = this.OriginalDate;
    globalThis.fetch = this.originalFetch;
  }
}

let fixture: ScheduleFixture;

function content(overrides: Record<string, unknown> = {}) {
  return {
    'fifthbell-content': {
      showArticles: true,
      showWeather: false,
      showEarthquakes: false,
      showMarkets: false,
      showLiveEvents: false,
      showCallsignTake: true,
      callsignPrelaunchUntilNyc: '2000-01-01T00:00:00',
      callsignWindowStartSecond: 50,
      callsignWindowEndSecond: 3,
      audioCueEnabled: false,
      languageRotation: ['en'],
      ...overrides,
    },
    'fifthbell-corner': { showWorldClocks: false, showBellIcon: false },
  };
}

function program(metadata: Record<string, unknown>, activeComponents = ['fifthbell-content'], programId = 'schedule-acceptance') {
  return <LiveProgram programId={programId} embedded sceneMetadata={metadata} activeComponents={activeComponents} />;
}

const meta = {
  title: 'React/LiveProgram schedule acceptance',
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Actual LiveProgram in scene-renderer mode: callsign schedule, layers and language rotation, driven only by scene metadata, in-memory HTTP fixtures and, where stated, a shifted wall clock.' } },
  },
  beforeEach: () => {
    const current = new ScheduleFixture();
    fixture = current;
    return () => current.dispose();
  },
  render: () => {
    const container = document.createElement('div');
    container.style.height = '600px';
    fixture.root = createRoot(container);
    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const callsignShown = (canvasElement: HTMLElement) => /This is fifth\s*bell/.test(canvasElement.textContent ?? '');

export const CallsignBeforeLaunchHoldsThePlaylist: Story = {
  play: async ({ canvasElement }) => {
    fixture.setLocalClock(30, 0);
    fixture.render(program(content({ callsignPrelaunchUntilNyc: '2099-01-01T00:00:00' })));
    await waitFor(() => expect(callsignShown(canvasElement)).toBe(true), { timeout: 4000 });
    await expect(canvasElement).not.toHaveTextContent('Fictional fixture story');
    // After launch, outside the schedule window, the playlist resumes with the article.
    fixture.render(program(content()));
    await within(canvasElement).findByText('Fictional fixture story', {}, { timeout: 4000 });
    await expect(callsignShown(canvasElement)).toBe(false);
    await expect(fixture.unexpected).toEqual([]);
  },
};

export const CallsignWindowSpansTheTopOfTheHour: Story = {
  play: async ({ canvasElement }) => {
    // 59:55 is inside the window that opens at second 50.
    fixture.setLocalClock(59, 55);
    fixture.render(program(content()));
    await waitFor(() => expect(callsignShown(canvasElement)).toBe(true), { timeout: 4000 });
    // 00:02 is inside the window that closes at second 3.
    fixture.setLocalClock(0, 2);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await expect(callsignShown(canvasElement)).toBe(true);
    // 59:20 and 00:10 are outside it.
    fixture.setLocalClock(59, 20);
    await within(canvasElement).findByText('Fictional fixture story', {}, { timeout: 4000 });
    fixture.setLocalClock(0, 10);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await expect(callsignShown(canvasElement)).toBe(false);
  },
};

export const MarqueeOnlySceneLeavesTheStageBlack: Story = {
  play: async ({ canvasElement }) => {
    fixture.setLocalClock(30, 0);
    // A blank program id falls back to fifthbell; the scene names only the marquee layer.
    fixture.render(program(content({ callsignPrelaunchUntilNyc: '2099-01-01T00:00:00' }), ['fifthbell-marquee'], '   '));
    await expect(callsignShown(canvasElement)).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await expect(callsignShown(canvasElement)).toBe(false);
    await expect(canvasElement).not.toHaveTextContent('Fictional fixture story');
  },
};

export const MarqueeCycleWithoutPendingEventsKeepsTheMarquee: Story = {
  play: async ({ canvasElement }) => {
    fixture.setLocalClock(30, 0);
    fixture.render(program({
      ...content({ showCallsignTake: false }),
      'fifthbell-marquee': { showMarquee: true, marqueeMinPostsCount: 0, marqueeMinAverageRelevance: 0, marqueeMinMedianRelevance: 0 },
    }, ['fifthbell-content', 'fifthbell-marquee']));
    const title = await within(canvasElement).findByText('Fictional marquee event', {}, { timeout: 4000 });
    title.parentElement!.parentElement!.dispatchEvent(new AnimationEvent('animationiteration', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(within(canvasElement).getByText('Fictional marquee event')).toBeInTheDocument();
  },
};

export const LanguageRotationAdvancesOnEachPlaylistLoop: Story = {
  play: async ({ canvasElement }) => {
    fixture.setLocalClock(30, 0);
    const rotation = (languageRotation: string[]) => content({
      showCallsignTake: false, showMarkets: true, languageRotation,
      articlesDurationMs: 1000, marketsDurationMs: 1000, playlistUpdateIntervalMs: 50,
    });
    fixture.render(program(rotation(['en', 'es'])));
    await within(canvasElement).findByText('Loading market data...', {}, { timeout: 4000 });
    // After one loop through articles and markets, the program speaks Spanish.
    await within(canvasElement).findByText('Cargando datos del mercado...', {}, { timeout: 6000 });
    // Shortening the rotation while on its second language falls back to the first at once.
    fixture.render(program(rotation(['en'])));
    await within(canvasElement).findByText('Loading market data...', {}, { timeout: 1000 });
    // The playlist keeps looping through the article.
    await within(canvasElement).findByText('Fictional fixture story', {}, { timeout: 4000 });
  },
};

export const BlockedHourlyCueIsReportedNotThrown: Story = {
  play: async ({ canvasElement }) => {
    // This page has had no user activation, so the browser's autoplay policy refuses the cue.
    const cueAt = new Date(Date.now() + 3000);
    const logs: unknown[][] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => { logs.push(args); originalLog(...args); };
    try {
      fixture.render(program(content({
        showCallsignTake: false, audioCueEnabled: true,
        audioCueMinute: cueAt.getMinutes(), audioCueSecond: cueAt.getSeconds(),
      })));
      await within(canvasElement).findByText('Fictional fixture story', {}, { timeout: 4000 });
      await waitFor(() => expect(logs.some(([message]) => message === 'Audio playback prevented:')).toBe(true), { timeout: 8000 });
    } finally {
      console.log = originalLog;
    }
  },
};
