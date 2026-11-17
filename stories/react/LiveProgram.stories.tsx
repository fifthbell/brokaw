import type { Meta, StoryObj } from '@storybook/html';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect, waitFor } from 'storybook/test';
import LiveProgram from '../../src/components/live-program/LiveProgram';

const IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E';
const LOADED_ROOT_CLASS = 'min-h-screen bg-black flex items-center justify-center overflow-hidden';

let currentRoot: Root | undefined;

/**
 * Every source the standalone program reads answers at once with fictional
 * fixtures, so the story leaves its loading stage the same way on every
 * machine instead of waiting on the network. Alcantara is absent: its snapshot
 * and event stream answer 503, which the program reports and survives.
 */
function stubProgramSources(): () => void {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
    if (url.origin === 'https://cdn.fifthbell.com' && /^\/content\/homepage-current-(en|es|it)\.json$/.test(url.pathname)) {
      return Response.json({
        articles: [{ id: 1, title: 'Fictional standalone story', excerpt: 'Never published.', slug: 'standalone', featuredImage: { url: IMAGE }, publishedAt: new Date().toISOString() }],
        breakingNews: { updates: [] },
      });
    }
    if (url.origin === 'https://api.monitor.gaulatti.com') {
      if (url.pathname === '/events') return Response.json({ events: [], total: 0 });
      if (['/broadcast/weather', '/broadcast/markets', '/earthquakes'].includes(url.pathname)) return Response.json([]);
    }
    if (url.pathname === '/events' && url.port === '3000') return Response.json({ data: [] });
    return new Response('not part of this story', { status: 503 });
  };
  return () => {
    globalThis.fetch = originalFetch;
  };
}

const meta: Meta = {
  title: 'React/LiveProgram',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The complete React broadcast program. The standalone bundle loads an initial versioned snapshot and program-scoped SSE updates from Alcantara; embedded scene renderers can continue to provide scene metadata directly.'
      }
    }
  },
  argTypes: {
    programId: { control: 'text' },
    embedded: { control: 'boolean' },
    apiBaseUrl: { control: 'text' }
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.width = '100vw';
    container.style.height = '100vh';

    currentRoot = createRoot(container);
    currentRoot.render(<LiveProgram {...args} />);

    return container;
  }
};

export default meta;

export const Default: StoryObj = {
  args: {
    programId: 'fifthbell',
    embedded: false
  },
  beforeEach: () => {
    const restoreFetch = stubProgramSources();
    return () => {
      currentRoot?.unmount();
      currentRoot = undefined;
      restoreFetch();
    };
  },
  play: async ({ canvasElement }) => {
    // The loaded stage is the only one that mounts the program's own audio
    // element beside the stage; the loading stage renders the stage alone.
    const root = await waitFor(
      () => {
        const loaded = canvasElement.querySelector(':scope > div > div:has(> audio)');
        if (!loaded) throw new Error('LiveProgram is still on its loading stage');
        return loaded;
      },
      { timeout: 5000 },
    );
    // Standalone (not embedded): the program centres its 1920x1080 stage on a full-height black page.
    await expect(root.className).toBe(LOADED_ROOT_CLASS);
  }
};

export const Embedded: StoryObj = {
  args: {
    programId: 'fifthbell',
    embedded: true
  }
};

export const EmbeddedSceneRenderer: StoryObj = {
  args: {
    programId: 'fifthbell',
    embedded: true,
    sceneMetadata: {},
    activeComponents: []
  },
  parameters: {
    docs: {
      description: {
        story: 'The renderer-owned presentation can run without fetching Alcantara state when a host provides scene metadata.'
      }
    }
  }
};
