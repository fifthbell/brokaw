import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
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
          'The restrained three-zone masthead keeps navigation left, the Fifthbell lockup centered, and search plus the live action right. Language controls remain in the editorial menu.'
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
