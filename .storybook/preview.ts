import type { Preview } from '@storybook/html-vite';
import '../src/styles/compiled.css';
import { initCarousels } from '../src/carousels';

function executeRenderedTemplateScripts(): void {
  const storyRoot = document.getElementById('storybook-root');
  if (!storyRoot) return;

  storyRoot.querySelectorAll<HTMLScriptElement>('script:not([src]):not([data-storybook-executed])').forEach((script) => {
    const executable = document.createElement('script');
    executable.dataset.storybookExecuted = 'true';
    executable.textContent = script.textContent;
    script.replaceWith(executable);
  });
}

const preview: Preview = {
  decorators: [
    (story) => {
      const html = story();
      queueMicrotask(() => {
        executeRenderedTemplateScripts();
        initCarousels(document);
      });
      return html;
    }
  ],
  parameters: {
    layout: 'fullscreen',
    options: {
      storySort: {
        order: ['Foundations', ['Luxury Calibration'], 'Pages', ['Homepage', 'ArticlePage', 'CategoryPage', 'SearchPage', 'LiveStoryPage', 'LinkInBioPage', 'MediaPage'], 'Templates', 'Partials', 'React', 'Example']
      }
    }
  }
};

export default preview;
