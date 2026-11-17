import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import { expect } from 'storybook/test';
import templateSource from '../../src/templates/templates/instagram-image.hbs?raw';
import { buildInstagramImageHtml } from '../../src/instagram-image-template.js';

type InstagramTemplateArgs = {
  imageUrl: string;
  title: string;
  categoryName: string;
  qrCodeHtml: string;
};

const template = Handlebars.compile(templateSource);

const meta = {
  title: 'Templates/Instagram Image',
  render: (args) => template(args),
  args: {
    imageUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1080&h=1350&q=80',
    title: 'Major Update: Shared Instagram Template Now Lives in Brokaw',
    categoryName: 'TECHNOLOGY',
    qrCodeHtml: '<div class="qr-container"><div class="qr-code" aria-label="QR Code">QR supplied by caller</div></div>'
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The declarative raster template consumes complete input data, including caller-supplied QR markup, without executing QR-generation code.'
      }
    }
  }
} satisfies Meta<InstagramTemplateArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongHeadline: Story = {
  args: {
    title: 'Breaking: E corro, corro avanti e torno indietro, scappo, voglio, prendo e tremo, stringo forte il tuo respiro!',
    categoryName: 'EUROVISION',
    imageUrl: 'https://www.bekia.es/images/galeria/57000/57932_emma-actuacion-festival-eurovision-2014.jpg'
  }
};

export const GeneratedHelper: Story = {
  render: () => {
    const el = document.createElement('div');
    el.innerHTML = buildInstagramImageHtml({
      imageUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1080&h=1350&q=80',
      title: 'Helper Generated Instagram Image',
      category: 'TECHNOLOGY',
      url: 'https://fifthbell.com/technology/article',
    });
    return el;
  },
  // In the browser the helper reads the template through Vite's ?raw import.
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent('Helper Generated Instagram Image');
    await expect(canvasElement).toHaveTextContent('TECHNOLOGY');
    await expect(canvasElement.querySelector('img')?.getAttribute('src')).toContain('photo-1495020689067');
  },
};
