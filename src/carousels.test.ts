import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initCarousels } from './carousels.js';

class MockClassList {
  private classes = new Set<string>();

  constructor(initial: string[] = []) {
    initial.forEach((c) => this.classes.add(c));
  }

  contains(name: string): boolean {
    return this.classes.has(name);
  }

  toggle(name: string, force?: boolean): boolean {
    if (force !== undefined) {
      if (force) this.classes.add(name);
      else this.classes.delete(name);
      return force;
    }
    if (this.classes.has(name)) {
      this.classes.delete(name);
      return false;
    }
    this.classes.add(name);
    return true;
  }
}

class MockElement {
  classList: MockClassList;
  dataset: Record<string, string> = {};
  listeners = new Map<string, Function[]>();

  constructor(classes: string[] = []) {
    this.classList = new MockClassList(classes);
  }

  addEventListener(event: string, handler: Function) {
    const list = this.listeners.get(event) || [];
    list.push(handler);
    this.listeners.set(event, list);
  }

  trigger(event: string) {
    const list = this.listeners.get(event) || [];
    for (const handler of list) {
      handler();
    }
  }
}

describe('initCarousels', () => {
  let origWindow: any;
  let origDocument: any;

  beforeEach(() => {
    vi.useFakeTimers();
    origWindow = (globalThis as any).window;
    origDocument = (globalThis as any).document;
    (globalThis as any).window = globalThis;
    (globalThis as any).document = { contains: () => true };
  });

  afterEach(() => {
    vi.useRealTimers();
    (globalThis as any).window = origWindow;
    (globalThis as any).document = origDocument;
  });

  it('does nothing when no carousels exist', () => {
    const root = {
      querySelectorAll: vi.fn().mockReturnValue([]),
    };
    initCarousels(root as any);
    expect(root.querySelectorAll).toHaveBeenCalledWith('[data-carousel]');
  });

  it('skips scopes that are already bound', () => {
    const scope = new MockElement();
    scope.dataset.carouselBound = 'true';
    const root = {
      querySelectorAll: vi.fn().mockReturnValue([scope]),
    };
    initCarousels(root as any);
    expect(scope.listeners.size).toBe(0);
  });

  it('marks carousel as bound when it contains zero slides', () => {
    const scope = new MockElement();
    (scope as any).querySelectorAll = vi.fn().mockReturnValue([]);
    const root = {
      querySelectorAll: vi.fn().mockReturnValue([scope]),
    };
    initCarousels(root as any);
    expect(scope.dataset.carouselBound).toBe('true');
  });

  it('initializes carousel with single slide without starting auto-advance timer', () => {
    const slide1 = new MockElement(['carousel-slide']);
    const scope = new MockElement();
    (scope as any).querySelectorAll = vi.fn((sel: string) => {
      if (sel === '.carousel-slide') return [slide1];
      return [];
    });
    (scope as any).querySelector = vi.fn().mockReturnValue(null);

    const root = {
      querySelectorAll: vi.fn().mockReturnValue([scope]),
    };

    initCarousels(root as any);

    expect(slide1.classList.contains('active')).toBe(true);
    expect(scope.dataset.carouselBound).toBe('true');
    expect((scope as any).__brokawCarouselTimer).toBeUndefined();
  });

  it('handles multi-slide carousel navigation, next button, dots, and timer lifecycle', () => {
    const slide1 = new MockElement(['carousel-slide', 'active']);
    const slide2 = new MockElement(['carousel-slide']);
    const dot1 = new MockElement(['carousel-dot']);
    const dot2 = new MockElement(['carousel-dot']);
    const nextBtn = new MockElement(['carousel-next']);
    const scope = new MockElement();

    (scope as any).querySelectorAll = vi.fn((sel: string) => {
      if (sel === '.carousel-slide') return [slide1, slide2];
      if (sel === '.carousel-dot') return [dot1, dot2];
      return [];
    });
    (scope as any).querySelector = vi.fn((sel: string) => {
      if (sel === '.carousel-next') return nextBtn;
      return null;
    });

    const root = {
      querySelectorAll: vi.fn().mockReturnValue([scope]),
    };

    initCarousels(root as any);

    expect((scope as any).__brokawCarouselTimer).toBeDefined();
    expect(slide1.classList.contains('active')).toBe(true);
    expect(dot1.classList.contains('active')).toBe(true);

    // Click next button
    nextBtn.trigger('click');
    expect(slide2.classList.contains('active')).toBe(true);
    expect(dot2.classList.contains('active')).toBe(true);

    // Click dot 1
    dot1.trigger('click');
    expect(slide1.classList.contains('active')).toBe(true);
    expect(dot1.classList.contains('active')).toBe(true);

    // Mouseenter pauses timer
    scope.trigger('mouseenter');
    expect((scope as any).__brokawCarouselTimer).toBeUndefined();

    // Mouseleave resumes timer
    scope.trigger('mouseleave');
    expect((scope as any).__brokawCarouselTimer).toBeDefined();

    // Timer advances slides
    vi.advanceTimersByTime(6000);
    expect(slide2.classList.contains('active')).toBe(true);

    // When element is removed from DOM, timer clears
    (globalThis as any).document.contains = vi.fn().mockReturnValue(false);
    vi.advanceTimersByTime(6000);
    expect((scope as any).__brokawCarouselTimer).toBeUndefined();
  });
});
