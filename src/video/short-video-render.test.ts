import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as videoPkg from './index.js';
import { RemotionRoot } from './Root.js';
import { ShortVideo } from './ShortVideo.js';
import type { ShortVideoProps } from './types.js';

let mockFrame = 15;

vi.mock('remotion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('remotion')>();
  return {
    ...actual,
    useCurrentFrame: () => mockFrame,
    useVideoConfig: () => ({ fps: 30, durationInFrames: 300, width: 1080, height: 1920 }),
    AbsoluteFill: ({ children, style }: any) => React.createElement('div', { style }, children),
    Sequence: ({ children }: any) => React.createElement('div', null, children),
    Img: ({ src, style }: any) => React.createElement('img', { src, style }),
    Audio: ({ src, volume }: any) => React.createElement('audio', { src, 'data-volume': volume }),
    registerRoot: vi.fn(),
  };
});

describe('video package and RemotionRoot', () => {
  it('exports components and registers root', () => {
    expect(typeof videoPkg.getDurationInFrames).toBe('function');
    expect(videoPkg.ShortVideo).toBeDefined();

    const rootElement = RemotionRoot();
    expect(rootElement.props.id).toBe('BrokawShort');
    expect(rootElement.props.fps).toBe(30);
    expect(rootElement.props.width).toBe(1080);
    expect(rootElement.props.height).toBe(1920);

    const meta = rootElement.props.calculateMetadata({
      props: {
        title: 'T',
        byline: 'B',
        brand: { name: 'N', siteUrl: 'https://ex.com' },
        slides: [{ type: 'HOOK', title: 'H', byline: 'B', durationInFrames: 60 }],
      },
    });
    expect(meta.durationInFrames).toBe(60);
    expect(meta.fps).toBe(30);
  });
});

describe('ShortVideo rendering', () => {
  beforeEach(() => {
    mockFrame = 15;
  });

  const baseProps: ShortVideoProps = {
    title: 'Daily Briefing',
    byline: 'Newsdesk',
    audioUrl: 'https://cdn.example.test/audio.mp3',
    brand: {
      name: 'Custom Brand',
      siteUrl: 'https://news.example.test',
      logoUrl: 'https://cdn.example.test/logo.png',
      backgroundImageUrl: 'https://cdn.example.test/bg.jpg',
      primaryColor: '#ff0000',
      secondaryColor: '#00ff00',
    },
    slides: [
      {
        type: 'HOOK',
        title: 'Breaking Alert',
        byline: 'By Reporter',
        durationInFrames: 90,
      },
      {
        type: 'ARTICLE',
        title: 'Story One',
        excerpt: 'Summary of story one',
        url: 'https://news.example.test/explicit/story',
        imageUrl: 'https://cdn.example.test/story1.jpg',
        durationInFrames: 120,
      },
      {
        type: 'ARTICLE',
        title: 'Story Two',
        excerpt: 'Summary of story two with slug',
        slug: '/story-two',
        durationInFrames: 120,
      },
      {
        type: 'OUTRO',
        text: 'Follow for more updates',
        durationInFrames: 60,
      },
    ],
  };

  it('renders all slides with full branding and audio', () => {
    const html = renderToStaticMarkup(React.createElement(ShortVideo, baseProps));
    expect(html).toContain('Breaking Alert');
    expect(html).toContain('Story One');
    expect(html).toContain('Story Two');
    expect(html).toContain('Follow for more updates');
    expect(html).toContain('https://news.example.test/explicit/story');
    expect(html).toContain('https://news.example.test/story-two');
    expect(html).toContain('https://cdn.example.test/logo.png');
    expect(html).toContain('audio');
  });

  it('renders with minimal brand and fallback text when logo, text, or url are absent', () => {
    const minimalProps: ShortVideoProps = {
      title: 'Minimal Briefing',
      byline: 'Reporter',
      brand: {
        name: 'Plain Brand',
        siteUrl: 'https://plain.example.test/',
      },
      slides: [
        {
          type: 'HOOK',
          title: 'Hook',
          byline: 'Desk',
          durationInFrames: 30,
        },
        {
          type: 'ARTICLE',
          title: 'Article Without Slug Or Url',
          excerpt: 'Short excerpt',
          durationInFrames: 30,
        },
        {
          type: 'OUTRO',
          durationInFrames: 30,
        },
      ],
    };

    // frame near end to test volume fading
    mockFrame = 85;

    const html = renderToStaticMarkup(React.createElement(ShortVideo, minimalProps));
    expect(html).toContain('Plain Brand');
    expect(html).toContain('https://plain.example.test/');
    expect(html).not.toContain('<audio');
  });
});
