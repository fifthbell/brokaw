import type { Preview } from '@storybook/html-vite';
import '../src/styles/compiled.css';
import { initCarousels } from '../src/carousels';

const preview: Preview = {
  decorators: [
    (story) => {
      const html = story();
      queueMicrotask(() => initCarousels(document));
      return html;
    }
  ],
  parameters: {
    layout: 'fullscreen',
    options: {
      storySort: {
        order: ['Pages', ['Homepage', 'ArticlePage', 'CategoryPage', 'SearchPage', 'LiveStoryPage', 'LinkInBioPage', 'MediaPage'], 'Partials', 'Example']
      }
    }
  }
};

export default preview;
