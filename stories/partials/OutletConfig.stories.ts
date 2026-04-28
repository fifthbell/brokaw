import type { Meta, StoryObj } from '@storybook/html';
import { outletConfig, version } from '../../src/renderer';

const meta = {
  title: 'Partials/Outlet Config',
  render: () => {
    const requiredKeys = [
      'publicSiteUrl',
      'cdnUrl',
      'siteName',
      'contentPath',
      'inventoryFilename',
      'defaultLanguage',
      'supportedLanguages',
      'prefixDefaultLocale',
      'defaultAuthor',
      'defaultCategory',
      'linkInBioRoute',
      'searchTitle',
      'searchDescriptions',
      'socialLanguages',
      'socialUserAgent',
      'socialImageExport',
      'hashtagServiceBaseUrl'
    ];

    const rows = requiredKeys
      .map((key) => {
        const value = (outletConfig as Record<string, unknown>)[key];
        const display = Array.isArray(value) || (value && typeof value === 'object') ? JSON.stringify(value) : String(value);

        return `<tr><th scope="row">${key}</th><td>${display}</td></tr>`;
      })
      .join('');

    return `
      <main style="font-family: system-ui, sans-serif; padding: 24px; max-width: 960px;">
        <h1 style="font-size: 24px; margin: 0 0 4px;">Brokaw renderer contract</h1>
        <p style="margin: 0 0 20px; color: #4b5563;">@fifthbell/brokaw@${version}</p>
        <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
          <tbody>${rows}</tbody>
        </table>
      </main>
    `;
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const CronkiteOutletConfig: Story = {};
