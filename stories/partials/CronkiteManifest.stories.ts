import type { Meta, StoryObj } from '@storybook/html';
import { cronkiteManifest } from '../../src/renderer';

const meta = {
  title: 'Partials/Cronkite Manifest',
  render: () => {
    const rows = [
      ['Package', `${cronkiteManifest.package}@${cronkiteManifest.version}`],
      ['Layouts', cronkiteManifest.layouts.join(', ')],
      ['Languages', cronkiteManifest.languages.join(', ')],
      [
        'System pages',
        cronkiteManifest.systemPages.map((page) => page.layout).join(', '),
      ],
      ['Renderables', Object.keys(cronkiteManifest.renderables).join(', ')],
      ['Capabilities', Object.keys(cronkiteManifest.capabilities).join(', ')],
    ]
      .map(
        ([label, value]) =>
          `<tr><th scope="row">${label}</th><td>${value}</td></tr>`,
      )
      .join('');

    return `
      <main style="font-family: system-ui, sans-serif; padding: 24px; max-width: 960px;">
        <h1 style="font-size: 24px; margin: 0 0 4px;">Cronkite renderer declaration</h1>
        <p style="margin: 0 0 20px; color: #4b5563;">Build-validated package capabilities</p>
        <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
          <tbody>${rows}</tbody>
        </table>
      </main>
    `;
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const DeclaredCapabilities: Story = {};
