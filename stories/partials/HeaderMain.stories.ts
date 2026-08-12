import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import headerMainHbs from '../../src/templates/partials/headers/header-main.hbs?raw';
import navCategoriesHbs from '../../src/templates/partials/nav/nav-categories.hbs?raw';
import { loadHomepagePreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('nav/nav-categories', navCategoriesHbs);

const template = Handlebars.compile(headerMainHbs);

const meta = {
  title: 'Partials/Headers/Main',
  loaders: [async () => ({ homepage: await loadHomepagePreviewData() })],
  render: (args, { loaded }) => template({ ...loaded.homepage, logoLink: '/', ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The restrained masthead includes a localized editorial date and an animated, country-aware weather rotation above its navigation.'
      }
    }
  }
};

export const OpenMenu: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menuButton = canvas.getByRole('button', { name: 'Menu' });

    await userEvent.click(menuButton);
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    const menu = canvasElement.querySelector<HTMLElement>('#dropdown-menu');
    await expect(menu).not.toBeNull();
    await waitFor(() => expect(menu?.getBoundingClientRect().height ?? 0).toBeGreaterThan(window.innerHeight * 0.8));
    await waitFor(() => expect(canvasElement.querySelectorAll('.category-link').length).toBeGreaterThan(1));

    const featuredStories = canvasElement.querySelector<HTMLElement>('#mini-featured');
    await expect(featuredStories).not.toBeNull();
    await waitFor(() => expect(featuredStories?.querySelectorAll('a').length ?? 0).toBeGreaterThan(1));

    const initialFeaturedStories = featuredStories?.textContent;
    const politicsLink = canvasElement.querySelector<HTMLElement>('.category-link[data-category-slug="politics"]');
    await expect(politicsLink).not.toBeNull();
    if (politicsLink) await userEvent.hover(politicsLink);
    await waitFor(() => expect(politicsLink).toHaveAttribute('aria-current', 'page'));
    await waitFor(() => expect(featuredStories?.textContent).not.toBe(initialFeaturedStories));
  },
  parameters: {
    docs: {
      description: {
        story:
          'Regression coverage for the production hamburger: the real menu runtime opens a viewport-height panel, loads section links and featured stories from the Fifthbell CDN, then swaps the story panel to category JSON on hover.'
      }
    }
  }
};

export const WeatherRotation: Story = {
  args: { language: 'en' },
  play: async ({ canvasElement }) => {
    const payload = {
      cities: [
        { name: 'Antofagasta', country: 'Chile', temp: 66, condition: 'sunny' },
        { name: 'Viña del Mar', country: 'Chile', temp: 61, condition: 'cloudy' },
        { name: 'Rome', country: 'Italy', temp: 84, condition: 'sunny' },
        { name: 'Tala', country: 'Uruguay', temp: 57, condition: 'rainy' },
        { name: 'New York City', country: 'United States', temp: 79, condition: 'windy' }
      ]
    };
    window.dispatchEvent(new CustomEvent('fifthbell:weather', { detail: payload }));

    const weather = canvasElement.querySelector<HTMLElement>('[data-weather-current]');
    await waitFor(() => expect(weather).not.toHaveAttribute('hidden'));
    await expect(weather).toHaveAttribute('data-weather-unit', 'celsius');
    const expectedMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
    await expect(canvasElement.querySelector('[data-weather-date]')?.textContent).toContain(expectedMonth);

    const sequence = canvasElement
      .querySelector<HTMLElement>('[data-weather-utility-bar]')
      ?.dataset.weatherSequence?.split('|') ?? [];
    await expect(sequence.length).toBe(payload.cities.length);
    sequence.forEach((country, index) => {
      expect(country).not.toBe(sequence[(index + 1) % sequence.length]);
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'The production weather payload drives the utility bar without involving the live-program surface.'
      }
    }
  }
};

export const LocalizedDate: Story = {
  args: { language: 'es' },
  play: async ({ canvasElement }) => {
    const expectedDate = new Intl.DateTimeFormat('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
    await waitFor(() => expect(canvasElement.querySelector('[data-weather-date]')?.textContent).toBe(expectedDate));
  },
  parameters: {
    docs: {
      description: {
        story: 'The editorial date follows the active Brokaw language; this example renders the Spanish locale.'
      }
    }
  }
};

export const MourningMode: Story = {
  args: { mourningMode: true },
  parameters: {
    docs: {
      description: {
        story:
          'Mourning mode: logo background is black, theme selector is hidden, dark mode is forced.'
      }
    }
  }
};
