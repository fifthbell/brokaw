import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import type { CanonicalArticle } from '../src/types/canonical-article';
import {
  mediaAssignmentFixture,
  type MediaAssignmentFixture
} from './fixtures/media-page.fixture';
import { loadMediaPagePreviewData } from './preview-data';

const PAGE_SIZE = 48;

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

function pageHref(pageNumber: number): string {
  return pageNumber <= 1 ? '/media/assignment-storybook' : `/media/assignment-storybook?page=${pageNumber}`;
}

function paginationPages(currentPage: number, totalPages: number): Array<{ ellipsis?: boolean; label?: number; page?: number; current?: boolean }> {
  const pages: Array<{ ellipsis?: boolean; label?: number; page?: number; current?: boolean }> = [];
  let lastAdded = 0;

  function addPage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === lastAdded) return;
    if (lastAdded > 0 && pageNumber > lastAdded + 1) pages.push({ ellipsis: true });
    pages.push({ label: pageNumber, page: pageNumber, current: pageNumber === currentPage });
    lastAdded = pageNumber;
  }

  addPage(1);
  for (let pageNumber = currentPage - 2; pageNumber <= currentPage + 2; pageNumber += 1) {
    addPage(pageNumber);
  }
  addPage(totalPages);

  return pages;
}

function renderPagination(currentPage: number, totalPages: number): string {
  if (totalPages <= 1) return '';

  const prev =
    currentPage > 1
      ? `<a href="${escapeHtml(pageHref(currentPage - 1))}" class="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-[#b21100] dark:text-slate-400 dark:hover:text-[#ff2e1a]" aria-label="Previous page"><svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true"><path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd"/></svg>Prev</a>`
      : '<span class="inline-flex items-center gap-1 text-sm font-medium text-slate-300 dark:text-slate-700" aria-disabled="true"><svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true"><path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd"/></svg>Prev</span>';

  const items = paginationPages(currentPage, totalPages)
    .map((item) => {
      if (item.ellipsis) {
        return '<li><span class="inline-flex h-9 w-9 items-center justify-center text-sm text-slate-400 dark:text-slate-500">...</span></li>';
      }
      if (item.current) {
        return `<li><span aria-current="page" class="inline-flex h-9 w-9 items-center justify-center border-b-2 border-[#b21100] text-sm font-bold text-[#b21100] dark:border-[#ff2e1a] dark:text-[#ff2e1a]">${item.label}</span></li>`;
      }
      return `<li><a href="${escapeHtml(pageHref(item.page || 1))}" class="inline-flex h-9 w-9 items-center justify-center text-sm font-medium text-slate-600 transition-colors hover:text-[#b21100] dark:text-slate-300 dark:hover:text-[#ff2e1a]">${item.label}</a></li>`;
    })
    .join('');

  const next =
    currentPage < totalPages
      ? `<a href="${escapeHtml(pageHref(currentPage + 1))}" class="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-[#b21100] dark:text-slate-400 dark:hover:text-[#ff2e1a]" aria-label="Next page">Next<svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true"><path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg></a>`
      : '<span class="inline-flex items-center gap-1 text-sm font-medium text-slate-300 dark:text-slate-700" aria-disabled="true">Next<svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true"><path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg></span>';

  return `${prev}<ol class="flex items-center gap-0.5">${items}</ol>${next}`;
}

function hydrateMediaFixture(root: HTMLElement, data: MediaAssignmentFixture, page = 1): void {
  const title = root.querySelector<HTMLElement>('#media-title');
  const meta = root.querySelector<HTMLElement>('#media-meta');
  const status = root.querySelector<HTMLElement>('#media-status');
  const grid = root.querySelector<HTMLElement>('#media-grid');
  const pagination = root.querySelector<HTMLElement>('#media-pagination');
  const refresh = root.querySelector<HTMLAnchorElement>('#media-refresh');

  if (!title || !meta || !status || !grid || !pagination || !refresh) return;

  const totalPages = Math.max(1, Math.ceil(data.photos.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visiblePhotos = data.photos.slice(start, start + PAGE_SIZE);

  title.textContent = data.assignment.name;
  meta.textContent = `${data.photos.length} photos${totalPages > 1 ? ` - Page ${currentPage} of ${totalPages}` : ''} updated ${formatDate(data.generatedAt)}`;
  refresh.href = '/media/assignment-storybook';

  if (data.photos.length === 0) {
    status.textContent = 'No photos have been published for this assignment yet.';
    status.classList.remove('hidden');
    grid.classList.add('hidden');
    pagination.classList.add('hidden');
    return;
  }

  grid.innerHTML = visiblePhotos
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
  pagination.innerHTML = renderPagination(currentPage, totalPages);
  pagination.classList.toggle('hidden', totalPages <= 1);
  pagination.classList.toggle('flex', totalPages > 1);
}

function renderMediaStory(args: CanonicalArticle, assignment = mediaAssignmentFixture, page = 1): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = render(args);
  hydrateMediaFixture(root, assignment, page);
  return root;
}

function createLargeAssignment(count: number): MediaAssignmentFixture {
  return {
    ...mediaAssignmentFixture,
    assignment: {
      ...mediaAssignmentFixture.assignment,
      name: 'Championship weekend upload desk'
    },
    photos: Array.from({ length: count }, (_, index) => {
      const source = mediaAssignmentFixture.photos[index % mediaAssignmentFixture.photos.length];
      const number = index + 1;
      return {
        ...source,
        id: 2000 + number,
        filename: source.filename.replace(/-\d+\.avif$/, `-${String(number).padStart(4, '0')}.avif`),
        originalFilename: `UPLOAD_${String(number).padStart(4, '0')}.JPG`,
        alt: `${source.alt} ${number}`,
        caption: `${source.caption} (${number})`
      };
    })
  };
}

const meta = {
  title: 'Pages/MediaPage',
  loaders: [async () => ({ mediaPage: await loadMediaPagePreviewData() })],
  render: (args, { loaded }) => renderMediaStory({ ...(loaded.mediaPage as CanonicalArticle), ...args })
} satisfies Meta<CanonicalArticle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  render: (_args, { loaded }) =>
    renderMediaStory(loaded.mediaPage as CanonicalArticle, {
      ...mediaAssignmentFixture,
      generatedAt: '2026-05-05T14:15:00.000Z',
      assignment: {
        ...mediaAssignmentFixture.assignment,
        name: 'Awaiting field uploads'
      },
      photos: []
    })
};

export const PaginatedLargeGallery: Story = {
  render: (_args, { loaded }) => renderMediaStory(loaded.mediaPage as CanonicalArticle, createLargeAssignment(1044), 11)
};
