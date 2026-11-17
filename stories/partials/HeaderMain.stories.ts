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
    const cities = canvasElement
      .querySelector<HTMLElement>('[data-weather-utility-bar]')
      ?.dataset.weatherCities?.split('|') ?? [];
    await expect(cities.sort()).toEqual(['Antofagasta', 'New York City', 'Rome']);
    await expect(sequence.length).toBe(cities.length);
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

const previewPayloads: Record<string, unknown> = {
  '/content/homepage-current-en.json': {
    categories: [{ slug: 'politics', name: 'Politics' }, { slug: 'world', name: 'World' }],
    docs: [
      { title: 'Absolute URL story', url: 'https://fifthbell.com/politics/absolute-story' },
      { title: 'Trailing slash story', url: '/politics/trailing-story/' },
      { title: 'Multi-segment slug story', slug: 'politics/multi-story' },
      { title: 'Category and slug story', slug: 'category-story', categories: [{ slug: 'politics', name: 'Politics' }] }
    ]
  },
  '/content/politics-current-en.json': {
    category: { name: 'Politics' },
    docs: [{ title: 'Politics preview lead', slug: 'politics-lead' }, { title: 'Politics preview second', slug: 'politics-second' }]
  }
};

export const MenuPreviewLinksAndCategoryName: Story = {
  name: 'Menu preview links and category name',
  // Repository fixtures for the two menu payloads; any other request is
  // served normally. The stub is removed when the story ends.
  beforeEach: () => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url = new URL(String(input instanceof Request ? input.url : input), window.location.href);
      const payload = url.origin === 'https://cdn.fifthbell.com' ? previewPayloads[url.pathname] : undefined;
      return payload ? new Response(JSON.stringify(payload)) : originalFetch(input, init);
    };
    return () => {
      window.fetch = originalFetch;
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }));
    const featured = canvasElement.querySelector<HTMLElement>('#mini-featured');
    const hrefOf = (title: string) => within(featured!).getByRole('link', { name: title }).getAttribute('href');
    await waitFor(() => expect(within(featured!).getByRole('link', { name: 'Category and slug story' })).toBeInTheDocument());
    await expect(featured?.querySelector('h3')?.textContent?.trim()).toBe('FEATURED STORIES');
    await expect(hrefOf('Absolute URL story')).toBe('/politics/absolute-story');
    await expect(hrefOf('Trailing slash story')).toBe('/politics/trailing-story');
    await expect(hrefOf('Multi-segment slug story')).toBe('/politics/multi-story');
    await expect(hrefOf('Category and slug story')).toBe('/politics/category-story');

    const politicsLink = canvasElement.querySelector<HTMLElement>('.category-link[data-category-slug="politics"]');
    if (politicsLink) await userEvent.hover(politicsLink);
    await waitFor(() => expect(featured?.querySelector('h3')?.textContent?.trim()).toBe('POLITICS'));
    await expect(featured?.textContent).not.toContain('GENERAL');
  },
  parameters: {
    docs: {
      description: {
        story:
          'Menu previews link each story to its own path (absolute URL, trailing slash, multi-segment slug, category plus slug) and title a category preview with the category name. Top stories keep the "Featured Stories" heading.'
      }
    }
  }
};
