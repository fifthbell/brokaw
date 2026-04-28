import articleLayoutHbs from './templates/layouts/article-page.hbs?raw';
import homepageLayoutHbs from './templates/layouts/homepage.hbs?raw';
import categoryLayoutHbs from './templates/layouts/category-page.hbs?raw';
import searchLayoutHbs from './templates/layouts/search-page.hbs?raw';
import notFoundLayoutHbs from './templates/layouts/404.hbs?raw';
import liveStoryLayoutHbs from './templates/layouts/live-story.hbs?raw';
import linkInBioLayoutHbs from './templates/layouts/link-in-bio.hbs?raw';

import headerMainHbs from './templates/partials/headers/header-main.hbs?raw';
import headerMinimalHbs from './templates/partials/headers/header-minimal.hbs?raw';
import footerFullHbs from './templates/partials/footers/footer-full.hbs?raw';
import footerMinimalHbs from './templates/partials/footers/footer-minimal.hbs?raw';
import navCategoriesHbs from './templates/partials/nav/nav-categories.hbs?raw';
import shellDocStartStandardHbs from './templates/partials/shell/doc-start-standard.hbs?raw';
import shellDocStart404Hbs from './templates/partials/shell/doc-start-404.hbs?raw';
import shellDocEndHbs from './templates/partials/shell/doc-end.hbs?raw';

import blockRichTextHbs from './templates/partials/blocks/rich-text.hbs?raw';
import blockHeadingHbs from './templates/partials/blocks/heading.hbs?raw';
import blockImageHbs from './templates/partials/blocks/image.hbs?raw';
import blockListHbs from './templates/partials/blocks/list.hbs?raw';
import blockDividerHbs from './templates/partials/blocks/divider.hbs?raw';
import blockInfoBoxHbs from './templates/partials/blocks/info-box.hbs?raw';
import blockKeyPointsHbs from './templates/partials/blocks/key-points.hbs?raw';
import blockDataTableHbs from './templates/partials/blocks/data-table.hbs?raw';
import blockLiveUpdateHbs from './templates/partials/blocks/live-update.hbs?raw';
import blockAudioHbs from './templates/partials/blocks/audio.hbs?raw';
import blockYoutubeHbs from './templates/partials/blocks/youtube.hbs?raw';
import blockXHbs from './templates/partials/blocks/x.hbs?raw';
import blockInstagramHbs from './templates/partials/blocks/instagram.hbs?raw';
import blockTikTokHbs from './templates/partials/blocks/tiktok.hbs?raw';
import blockPullQuoteHbs from './templates/partials/blocks/pull-quote.hbs?raw';

import componentArticleMainHbs from './templates/partials/components/article-main.hbs?raw';
import componentBreakingNewsHbs from './templates/partials/components/breaking-news.hbs?raw';
import componentBreakingNewsLiveUpdatesColumnHbs from './templates/partials/components/breaking-news/live-updates-column.hbs?raw';
import componentSnackHbs from './templates/partials/components/snack.hbs?raw';
import componentHeadlineHbs from './templates/partials/components/headline.hbs?raw';
import componentHeroHbs from './templates/partials/components/hero.hbs?raw';
import componentHeroEditorialHbs from './templates/partials/components/hero-editorial.hbs?raw';
import componentSpotlightHeroHbs from './templates/partials/components/spotlight-hero.hbs?raw';
import componentEditorialHeroHbs from './templates/partials/components/editorial-hero.hbs?raw';
import componentTrendingHbs from './templates/partials/components/trending.hbs?raw';
import componentHomeMainHbs from './templates/partials/components/home/main.hbs?raw';
import componentHomeLandingHbs from './templates/partials/components/home/landing.hbs?raw';
import componentHomeMustReadHbs from './templates/partials/components/home/must-read.hbs?raw';
import componentHomeMoreStoriesHbs from './templates/partials/components/home/more-stories.hbs?raw';
import componentCategoryMainHbs from './templates/partials/components/category/main.hbs?raw';
import componentCategoryHeaderHbs from './templates/partials/components/category/header.hbs?raw';
import componentCategoryMainGridHbs from './templates/partials/components/category/main-grid.hbs?raw';
import componentCategoryMoreGridHbs from './templates/partials/components/category/more-grid.hbs?raw';
import componentSearchMainHbs from './templates/partials/components/search/main.hbs?raw';
import componentNotFoundMainHbs from './templates/partials/components/not-found/main.hbs?raw';
import componentLiveStoryMainHbs from './templates/partials/components/live-story/main.hbs?raw';
import componentUiAccordionHbs from './templates/partials/components/ui/accordion.hbs?raw';
import componentUiBreadcrumbHbs from './templates/partials/components/ui/breadcrumb.hbs?raw';
import componentUiIconButtonHbs from './templates/partials/components/ui/icon-button.hbs?raw';
import componentUiLoadingSpinnerHbs from './templates/partials/components/ui/loading-spinner.hbs?raw';
import componentUiPaginationHbs from './templates/partials/components/ui/pagination.hbs?raw';
import componentUiScrollAreaHbs from './templates/partials/components/ui/scroll-area.hbs?raw';
import componentUiStatusBadgeHbs from './templates/partials/components/ui/status-badge.hbs?raw';

import styles from './styles/compiled.css?raw';

import type { CanonicalDocument } from './types/canonical-article.js';
import { renderWithAssets, type RendererAssets } from './renderer.core.js';

const assets: RendererAssets = {
  layouts: {
    'article-page': articleLayoutHbs,
    homepage: homepageLayoutHbs,
    'category-page': categoryLayoutHbs,
    'search-page': searchLayoutHbs,
    '404': notFoundLayoutHbs,
    'live-story': liveStoryLayoutHbs,
    'link-in-bio': linkInBioLayoutHbs
  },
  partials: {
    'headers/header-main': headerMainHbs,
    'headers/header-minimal': headerMinimalHbs,
    'footers/footer-full': footerFullHbs,
    'footers/footer-minimal': footerMinimalHbs,
    'nav/nav-categories': navCategoriesHbs,
    'shell/doc-start-standard': shellDocStartStandardHbs,
    'shell/doc-start-404': shellDocStart404Hbs,
    'shell/doc-end': shellDocEndHbs,
    'blocks/rich-text': blockRichTextHbs,
    'blocks/heading': blockHeadingHbs,
    'blocks/image': blockImageHbs,
    'blocks/list': blockListHbs,
    'blocks/divider': blockDividerHbs,
    'blocks/info-box': blockInfoBoxHbs,
    'blocks/key-points': blockKeyPointsHbs,
    'blocks/data-table': blockDataTableHbs,
    'blocks/live-update': blockLiveUpdateHbs,
    'blocks/audio': blockAudioHbs,
    'blocks/youtube': blockYoutubeHbs,
    'blocks/x': blockXHbs,
    'blocks/instagram': blockInstagramHbs,
    'blocks/tiktok': blockTikTokHbs,
    'blocks/pull-quote': blockPullQuoteHbs,
    'components/article-main': componentArticleMainHbs,
    'components/breaking-news': componentBreakingNewsHbs,
    'components/breaking-news/live-updates-column': componentBreakingNewsLiveUpdatesColumnHbs,
    'components/snack': componentSnackHbs,
    'components/headline': componentHeadlineHbs,
    'components/spotlight-hero': componentSpotlightHeroHbs,
    'components/editorial-hero': componentEditorialHeroHbs,
    'components/hero': componentHeroHbs,
    'components/hero-editorial': componentHeroEditorialHbs,
    'components/trending': componentTrendingHbs,
    'components/home/main': componentHomeMainHbs,
    'components/home/landing': componentHomeLandingHbs,
    'components/home/must-read': componentHomeMustReadHbs,
    'components/home/more-stories': componentHomeMoreStoriesHbs,
    'components/category/main': componentCategoryMainHbs,
    'components/category/header': componentCategoryHeaderHbs,
    'components/category/main-grid': componentCategoryMainGridHbs,
    'components/category/more-grid': componentCategoryMoreGridHbs,
    'components/search/main': componentSearchMainHbs,
    'components/not-found/main': componentNotFoundMainHbs,
    'components/live-story/main': componentLiveStoryMainHbs,
    'components/ui/accordion': componentUiAccordionHbs,
    'components/ui/breadcrumb': componentUiBreadcrumbHbs,
    'components/ui/icon-button': componentUiIconButtonHbs,
    'components/ui/loading-spinner': componentUiLoadingSpinnerHbs,
    'components/ui/pagination': componentUiPaginationHbs,
    'components/ui/scroll-area': componentUiScrollAreaHbs,
    'components/ui/status-badge': componentUiStatusBadgeHbs
  },
  styles
};

export function render(document: CanonicalDocument): string {
  return renderWithAssets(document, assets);
}
