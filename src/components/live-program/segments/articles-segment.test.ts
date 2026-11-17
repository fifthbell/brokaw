import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createArticlesSegment, type NewsItem } from './ArticlesSegment.js';
import { createMarketsSegment } from './MarketsSegment.js';

const IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E';
const articles: NewsItem[] = [
  { id: '1', headline: 'Article One', summary: 'First', imageUrl: IMAGE, url: '/one' },
  { id: '2', headline: 'Article Two', summary: 'Second', imageUrl: IMAGE, url: '/two' },
];

function element(node: ReactNode): ReactElement<Record<string, unknown>> {
  if (!isValidElement(node)) throw new Error('segment.render returned no element');
  return node as ReactElement<Record<string, unknown>>;
}

// fifthbell/brokaw#34: the playlist renders segment.render(itemIndex, progress) in one
// slot, so React keeps one renderer only while the element's key stays the same.
describe('articles segment slide identity', () => {
  it('keeps one renderer across the items of the segment, so the 800 ms transition can run', () => {
    const segment = createArticlesSegment(articles, undefined, 'en');
    const first = element(segment.render(0, 0));
    const second = element(segment.render(1, 0));
    expect(second.type).toBe(first.type);
    expect(second.key).toBe(first.key);
    expect(second.props.itemIndex).toBe(1);
  });

  it('renders a different element from another segment, so changing segment remounts', () => {
    const articlesSlide = element(createArticlesSegment(articles, undefined, 'en').render(0, 0));
    const marketsSlide = element(createMarketsSegment([], undefined, 'en').render(0, 0));
    expect(articlesSlide.type).not.toBe(marketsSlide.type);
    expect(articlesSlide.key).toBe('articles');
  });

  it('never renders an empty list: without articles it shows the sample stories', () => {
    const slide = element(createArticlesSegment([], undefined, 'en').render(0, 0));
    expect((slide.props.items as NewsItem[]).length).toBeGreaterThan(0);
  });
});
