import type { StorybookConfig } from '@storybook/html-vite';

const config: StorybookConfig = {
  stories: [
    '../stories/ArticlePage.stories.ts',
    '../stories/Homepage.stories.ts',
    '../stories/CategoryPage.stories.ts',
    '../stories/SearchPage.stories.ts',
    '../stories/LiveStoryPage.stories.ts',
    '../stories/LinkInBioPage.stories.ts',
    '../stories/partials/*.stories.ts',
    '../stories/react/**/*.stories.tsx'
  ],
  addons: ['@chromatic-com/storybook', '@storybook/addon-vitest', '@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/html-vite',
  async viteFinal(config) {
    return {
      ...config,
      assetsInclude: ['**/*.hbs']
    };
  }
};

export default config;
