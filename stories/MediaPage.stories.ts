import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import type { CanonicalArticle } from '../src/types/canonical-article';
import {
  mediaAssignmentFixture,
  mediaPageFixture,
  type MediaAssignmentFixture
} from './fixtures/media-page.fixture';

function escapeHtml(value: unknown): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function hydrateMediaFixture(root: HTMLElement, data: MediaAssignmentFixture): void {
  const title = root.querySelector<HTMLElement>('#media-title');
  const meta = root.querySelector<HTMLElement>('#media-meta');
  const status = root.querySelector<HTMLElement>('#media-status');
  const grid = root.querySelector<HTMLElement>('#media-grid');
  const refresh = root.querySelector<HTMLAnchorElement>('#media-refresh');

  if (!title || !meta || !status || !grid || !refresh) return;

  title.textContent = data.assignment.name;
  meta.textContent = `${data.photos.length} photos updated ${formatDate(data.generatedAt)}`;
  refresh.href = '/media/assignment-storybook';

  if (data.photos.length === 0) {
    status.textContent = 'No photos have been published for this assignment yet.';
    status.classList.remove('hidden');
    grid.classList.add('hidden');
    return;
  }

  grid.innerHTML = data.photos
    .map(
      (photo) => `
        <figure class="group overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <a href="${escapeHtml(photo.url)}" target="_blank" rel="noopener noreferrer" class="block bg-slate-200 dark:bg-slate-800">
            <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.alt)}" loading="lazy" class="aspect-[4/3] h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]" />
          </a>
          <figcaption class="px-3 py-2 text-xs leading-snug text-slate-600 dark:text-slate-400">${escapeHtml(photo.caption || photo.originalFilename)}</figcaption>
        </figure>`
    )
    .join('');
  status.classList.add('hidden');
  grid.classList.remove('hidden');
  grid.classList.add('grid');
}

function renderMediaStory(args: CanonicalArticle, assignment = mediaAssignmentFixture): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = render(args);
  hydrateMediaFixture(root, assignment);
  return root;
}

const meta = {
  title: 'Pages/MediaPage',
  render: (args) => renderMediaStory(args as CanonicalArticle),
  args: mediaPageFixture
} satisfies Meta<CanonicalArticle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  render: (args) =>
    renderMediaStory(args as CanonicalArticle, {
      ...mediaAssignmentFixture,
      generatedAt: '2026-05-05T14:15:00.000Z',
      assignment: {
        ...mediaAssignmentFixture.assignment,
        name: 'Awaiting field uploads'
      },
      photos: []
    })
};
