import type { Meta, StoryObj } from '@storybook/html';
import { buildInstagramImageHtml } from '../../src/instagram-image-template';

type InstagramTemplateArgs = {
  imageUrl: string;
  title: string;
  category?: string;
  slug?: string;
  url?: string;
};

const meta = {
  title: 'Partials/Instagram Image Template',
  render: (args) => buildInstagramImageHtml(args as InstagramTemplateArgs),
  args: {
    imageUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1080&h=1350&q=80',
    title: 'Major Update: Shared Instagram Template Now Lives in Brokaw',
    category: 'Technology',
    slug: 'technology',
    url: 'https://fifthbell.com/technology/shared-instagram-template'
  },
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoQrCode: Story = {
  args: {
    url: undefined
  }
};

export const LongHeadline: Story = {
  args: {
    title: 'Breaking: E corro, corro avanti e torno indietro, scappo, voglio, prendo e tremo, stringo forte il tuo respiro!',
    category: 'Eurovision',
    imageUrl: 'https://www.bekia.es/images/galeria/57000/57932_emma-actuacion-festival-eurovision-2014.jpg',
    url: 'https://www.youtube.com/watch?v=Jm8tg7waqsw&list=PLqF2nhwqy6AODPTkTcOFHmvaTxrXugim1&index=121'
  }
};
