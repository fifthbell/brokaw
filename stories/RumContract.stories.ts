import type { Meta, StoryObj } from '@storybook/html';
import { expect, within } from 'storybook/test';
import { render } from '../src/renderer.browser';
import type { CanonicalArticle, RumConfig } from '../src/types/canonical-article';
import { articleFixture } from './fixtures/article.fixture';
import { mediaPageFixture } from './fixtures/media-page.fixture';

const rumConfig: RumConfig = {
  appMonitorId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  applicationVersion: 'storybook-1.0.0',
  region: 'us-east-1',
  identityPoolId: 'us-east-1:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  guestRoleArn: 'arn:aws:iam::111111111111:role/example-rum-guest'
};

const notFoundFixture: CanonicalArticle = {
  ...articleFixture,
  id: 'not-found',
  slug: '/missing',
  layout: '404',
  canonicalUrl: 'https://example.test/missing',
  title: 'Page not found',
  body: []
};

function renderContract(page: CanonicalArticle): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = render({ ...page, rumConfig });
  return root;
}

async function verifyContract(canvasElement: HTMLElement, pageType: CanonicalArticle['layout'], language: CanonicalArticle['language']) {
  const canvas = within(canvasElement);
  const loader = canvasElement.querySelector<HTMLScriptElement>('script[data-brokaw-rum-loader]');

  await expect(canvas.getByRole('main')).toBeInTheDocument();
  await expect(loader).not.toBeNull();
  await expect(loader?.textContent).toContain('pageId: window.location.pathname');
  await expect(loader?.textContent).toContain(`page_type: ${JSON.stringify(pageType)}`);
  await expect(loader?.textContent).toContain(`content_language: ${JSON.stringify(language)}`);
  await expect(loader?.textContent).toContain('recordResourceUrl: false');
}

const meta = {
  title: 'Pages/RUM Privacy Contract',
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component: 'Standard, not-found, and media shells share the same conditional, tenant-neutral RUM loader. Scripts inserted by Storybook are inert; these stories verify rendered markup only.'
      }
    }
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  render: () => renderContract(articleFixture),
  play: async ({ canvasElement }) => verifyContract(canvasElement, 'article-page', 'en')
};

export const NotFound: Story = {
  render: () => renderContract({ ...notFoundFixture, language: 'es' }),
  play: async ({ canvasElement }) => verifyContract(canvasElement, '404', 'es')
};

export const Media: Story = {
  render: () => renderContract({ ...mediaPageFixture, language: 'it' }),
  play: async ({ canvasElement }) => verifyContract(canvasElement, 'media-page', 'it')
};
