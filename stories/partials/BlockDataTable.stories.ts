import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import dataTableHbs from '../../src/templates/partials/blocks/data-table.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';

const template = Handlebars.compile(dataTableHbs);

const meta = {
  title: 'Partials/Blocks/DataTable',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'dataTable') ?? { type: 'dataTable', caption: 'Forecast comparison by metro area', headers: ['City', 'Peak Wind', 'Flood Risk'], rows: [['Boston', '48 mph', 'Moderate'], ['Providence', '52 mph', 'High'], ['New York City', '41 mph', 'Moderate']] },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
