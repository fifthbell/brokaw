import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import type { CanonicalArticle } from '../src/types/canonical-article';
import { loadHomepagePreviewData } from './preview-data';

const meta = {
  title: 'Foundations/Luxury Calibration',
  loaders: [async () => ({ homepage: await loadHomepagePreviewData() })],
  render: (_args, { loaded }) =>
    render({
      ...(loaded.homepage as CanonicalArticle),
      showHero: false,
      showEditorialHero: false,
      showBreakingNews: false,
      showTrending: true,
      showLanding: true,
      showMustRead: true,
      showMoreStories: true
    }),
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'A production-rendered Fifthbell composition using the current homepage JSON from the CDN. This story intentionally uses the real header, editorial components, and full footer so design-system calibration cannot drift from the shipped renderer.'
      }
    }
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const CompleteComposition: Story = {};
