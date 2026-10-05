import fs from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const template = fs.readFileSync(new URL('./templates/partials/components/media/main.hbs', import.meta.url), 'utf8');
const script = template.match(/<script>([\s\S]*)<\/script>/)![1];

function run(pathname: string) {
  const elements = new Map<string, { textContent: string; href: string; classList: { add: () => void; remove: () => void }; addEventListener: () => void }>();
  const fetch = vi.fn(() => new Promise(() => {}));
  const document = {
    querySelector: () => ({}),
    getElementById: (id: string) => {
      if (!elements.has(id)) elements.set(id, { textContent: '', href: '', classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} });
      return elements.get(id);
    }
  };
  vm.runInNewContext(script, { document, window: { location: { pathname, href: `https://fifthbell.com${pathname}` }, addEventListener: () => {} }, fetch });
  return { fetch, elements };
}

describe('shared Mediathek browser route', () => {
  it.each(['gotham.angel.20261004', 'photo.jpg', '%E2%9C%93'])('loads assignment JSON for opaque key %s', (key) => {
    const first = run(`/mediathek/${key}`);
    const second = run(`/mediathek/${key}/`);
    for (const result of [first, second]) {
      expect(result.fetch).toHaveBeenCalledOnce();
      expect(result.fetch).toHaveBeenCalledWith(`https://cdn.fifthbell.com/contents/assignments/${encodeURIComponent(decodeURIComponent(key))}.json`, { cache: 'no-store' });
    }
  });
  it('does not treat the media category as an assignment page', () => {
    const { fetch, elements } = run('/media/news');
    expect(fetch).not.toHaveBeenCalled();
    expect(elements.get('media-status')?.textContent).toBe('Missing assignment id.');
  });
});
