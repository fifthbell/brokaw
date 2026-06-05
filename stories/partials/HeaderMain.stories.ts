import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import headerMainHbs from '../../src/templates/partials/headers/header-main.hbs?raw';
import navCategoriesHbs from '../../src/templates/partials/nav/nav-categories.hbs?raw';
import { homepageFixture } from '../fixtures/homepage.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('nav/nav-categories', navCategoriesHbs);

const template = Handlebars.compile(headerMainHbs);

const meta = {
  title: 'Partials/Headers/Main',
  render: (args) => template(args),
  args: { ...homepageFixture, logoLink: '/' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Language buttons switch locale path and explicitly close the menu overlay before navigation.'
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
