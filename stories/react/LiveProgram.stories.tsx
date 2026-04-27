import type { Meta, StoryObj } from '@storybook/html';
import React from 'react';
import { createRoot } from 'react-dom/client';
import LiveProgram from '../../src/components/live-program/LiveProgram';

const meta: Meta = {
  title: 'React/LiveProgram',
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    programId: { control: 'text' },
    embedded: { control: 'boolean' },
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
    embedded: false,
  }
};

export const Embedded: StoryObj = {
  args: {
    programId: 'fifthbell',
    embedded: true,
  }
};
