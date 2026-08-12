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
          'The restrained three-zone masthead keeps navigation left, the Fifthbell lockup centered, and search plus the live action right. Its standard page runtime also loads the shared weather JSON at startup and refreshes it hourly.'
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
