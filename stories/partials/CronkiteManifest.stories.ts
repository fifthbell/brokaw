import type { Meta, StoryObj } from '@storybook/html';
import { cronkiteManifest } from '../../src/renderer';

const meta = {
  title: 'Partials/Cronkite Manifest',
  render: () => {
    const rendering = cronkiteManifest.templateRendering;
    const rows = [
      ['Package', `${cronkiteManifest.package}@${cronkiteManifest.version}`],
      ['Contract', `${rendering.contract}@${rendering.contractVersion}`],
      ['Layouts', Object.keys(rendering.renderables).filter((name) => name !== 'social-image').join(', ')],
      ['Languages', rendering.helperConfig.supportedLanguages.join(', ')],
      [
        'System pages',
        rendering.systemPages.map((page) => page.renderable).join(', '),
      ],
      ['Renderables', Object.keys(rendering.renderables).join(', ')],
      ['Partials', String(Object.keys(rendering.partials).length)],
      ['Static assets', String(Object.keys(rendering.staticAssets).length)],
    ]
      .map(
        ([label, value]) =>
          `<tr><th scope="row">${label}</th><td>${value}</td></tr>`,
      )
      .join('');

    return `
      <main style="font-family: system-ui, sans-serif; padding: 24px; max-width: 960px;">
        <h1 style="font-size: 24px; margin: 0 0 4px;">Cronkite renderer declaration</h1>
        <p style="margin: 0 0 20px; color: #4b5563;">Build-validated declarative templates and assets</p>
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
