import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import notFoundMainHbs from '../../src/templates/partials/components/not-found/main.hbs?raw';
import { loadHomepagePreviewData } from '../preview-data';

const template = Handlebars.compile(notFoundMainHbs);

const meta = {
  title: 'Partials/NotFound/Main',
  loaders: [async () => ({ homepage: await loadHomepagePreviewData() })],
  render: (args, { loaded }) => template({
    title: 'Page Not Found',
    excerpt: 'The page you are looking for does not exist.',
    homeLinkLabel: 'Go to Homepage',
    categoriesLabel: 'Or explore our categories:',
    logoLink: '/',
    navigation: loaded.homepage.navigation,
    ...args
  }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
