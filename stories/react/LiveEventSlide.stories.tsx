import type { Meta, StoryObj } from '@storybook/html';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { LiveEventSlide } from '../../src/components/live-program/components/slides/LiveEventSlide';
import type { LiveEventData } from '../../src/components/live-program/segments/fetchLiveEvents';

const sportsEvent: LiveEventData = {
  category: 'MLS',
  title: 'New York City FC vs. Inter Miami CF',
  excerpt: 'Live updates from the decisive semifinal match at Yankee Stadium.',
  image: 'https://picsum.photos/seed/sports-event/1920/1080',
  alt: 'Soccer match at Yankee Stadium',
  url: 'https://fifthbell.com/sports/nycfc-vs-miami',
  sofascore_id: 1234567,
  updatedAt: new Date().toISOString(),
  updates: [
    { timestamp: new Date(Date.now() - 5000).toISOString(), text: 'GOAL! Miami takes the lead with a brilliant strike from Messi.' },
    { timestamp: new Date(Date.now() - 30000).toISOString(), text: 'Yellow card for NYC FC defender after a late tackle.' },
    { timestamp: new Date(Date.now() - 120000).toISOString(), text: 'Second half underway. Miami with possession early.' },
    { timestamp: new Date(Date.now() - 300000).toISOString(), text: 'Halftime: NYCFC 1-1 Inter Miami. An intense first half.' },
    { timestamp: new Date(Date.now() - 600000).toISOString(), text: 'Miami equalizes in the 38th minute! 1-1.' },
  ],
};

const breakingEvent: LiveEventData = {
  category: 'U.S.',
  title: 'Major Winter Storm Moves Across the Northeast',
  excerpt: 'Millions under winter storm warnings as heavy snow and high winds impact travel and power grids.',
  image: 'https://picsum.photos/seed/winter-storm/1920/1080',
  alt: 'Snow-covered city streets',
  url: 'https://fifthbell.com/us/winter-storm-northeast',
  updatedAt: new Date().toISOString(),
  updates: [
    { timestamp: new Date(Date.now() - 60000).toISOString(), text: 'Governor declares state of emergency in New York, New Jersey, Connecticut.' },
    { timestamp: new Date(Date.now() - 300000).toISOString(), text: 'Over 200,000 without power across the tri-state area.' },
    { timestamp: new Date(Date.now() - 600000).toISOString(), text: 'JFK and Newark airports suspend all flights until further notice.' },
    { timestamp: new Date(Date.now() - 1800000).toISOString(), text: 'National Guard deployed to assist with emergency response.' },
    { timestamp: new Date(Date.now() - 3600000).toISOString(), text: 'Snowfall rates of 2-3 inches per hour reported in parts of Massachusetts.' },
  ],
};

const meta: Meta = {
  title: 'React/LiveEventSlide',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Broadcast typography calibration: Encode Sans Bold carries titles, labels, and categories; the secondary sans is reserved for excerpts and live-update copy. Encode Sans Condensed is never rendered alongside Encode Sans.'
      }
    }
  },
  argTypes: {
    variant: { control: 'select', options: ['sports', 'breaking'] },
    progress: { control: { type: 'range', min: 0, max: 100, step: 1 } },
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.width = '1920px';
    container.style.height = '1080px';
    container.style.overflow = 'hidden';

    const root = createRoot(container);
    const event = args.variant === 'sports' ? sportsEvent : breakingEvent;
    root.render(<LiveEventSlide event={event} progress={args.progress ?? 45} language='en' />);

    return container;
  },
};

export default meta;

export const Sports: StoryObj = {
  args: { variant: 'sports', progress: 45 },
};

export const BreakingNews: StoryObj = {
  args: { variant: 'breaking', progress: 30 },
};

export const TypographyCalibration: StoryObj = {
  args: { variant: 'breaking', progress: 68 },
  parameters: {
    docs: {
      description: {
        story: 'A focused check of the title, category, lede, and supporting-copy hierarchy in the React broadcast surface.'
      }
    }
  }
};
