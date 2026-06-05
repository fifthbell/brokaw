import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import headerMinimalHbs from '../../src/templates/partials/headers/header-minimal.hbs?raw';

const template = Handlebars.compile(headerMinimalHbs);

const meta = {
  title: 'Partials/Headers/Minimal',
  render: (args) => template(args),
  args: { logoLink: '/' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const MourningMode: Story = {
  args: { mourningMode: true },
};
