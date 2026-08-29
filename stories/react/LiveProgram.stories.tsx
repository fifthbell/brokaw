import type { Meta, StoryObj } from '@storybook/html';
import React from 'react';
import { createRoot } from 'react-dom/client';
import LiveProgram from '../../src/components/live-program/LiveProgram';

const meta: Meta = {
  title: 'React/LiveProgram',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The complete React broadcast program. The standalone bundle loads an initial versioned snapshot and program-scoped SSE updates from Alcantara; embedded scene renderers can continue to provide scene metadata directly.'
      }
    }
  },
  argTypes: {
    programId: { control: 'text' },
    embedded: { control: 'boolean' },
    apiBaseUrl: { control: 'text' }
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.width = '100vw';
    container.style.height = '100vh';

    const root = createRoot(container);
    root.render(<LiveProgram {...args} />);

    return container;
  }
};

export default meta;

export const Default: StoryObj = {
  args: {
    programId: 'fifthbell',
    embedded: false
  }
};

export const Embedded: StoryObj = {
  args: {
    programId: 'fifthbell',
    embedded: true
  }
};

export const EmbeddedSceneRenderer: StoryObj = {
  args: {
    programId: 'fifthbell',
    embedded: true,
    sceneMetadata: {},
    activeComponents: []
  },
  parameters: {
    docs: {
      description: {
        story: 'The renderer-owned presentation can run without fetching Alcantara state when a host provides scene metadata.'
      }
    }
  }
};
