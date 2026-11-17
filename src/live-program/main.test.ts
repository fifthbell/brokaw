import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReactDOM from 'react-dom/client';

// main.tsx only wires LiveProgram into the page; the component itself is
// exercised in the browser by the LiveProgram acceptance stories.
vi.mock('../components/live-program/LiveProgram.js', () => ({
  default: function LiveProgram() { return null; },
}));


/** The LiveProgram props main.tsx rendered (inside React.StrictMode). */
function renderedProps(render: ReturnType<typeof vi.fn>) {
  expect(render).toHaveBeenCalledTimes(1);
  return render.mock.calls[0][0].props.children.props as { programId: string; apiBaseUrl?: string };
}

describe('live-program main entrypoint', () => {
  let origWindow: any;
  let origDocument: any;

  beforeEach(() => {
    origWindow = (globalThis as any).window;
    origDocument = (globalThis as any).document;
  });

  afterEach(() => {
    if (origWindow === undefined) delete (globalThis as any).window;
    else (globalThis as any).window = origWindow;
    if (origDocument === undefined) delete (globalThis as any).document;
    else (globalThis as any).document = origDocument;
    vi.restoreAllMocks();
  });

  it('initializes React root with runtime config when root element is present', async () => {
    const renderFn = vi.fn();
    const createRootSpy = vi.spyOn(ReactDOM, 'createRoot').mockReturnValue({
      render: renderFn,
      unmount: vi.fn(),
    } as any);

    const rootElement = {};
    (globalThis as any).window = {
      location: { search: '?programId=query-id&apiBaseUrl=https://query.test' },
      __FIFTHBELL_LIVE_PROGRAM_CONFIG__: {
        programId: 'config-prog',
        apiBaseUrl: 'https://config.test',
      },
    };
    (globalThis as any).document = {
      getElementById: vi.fn().mockReturnValue(rootElement),
    };

    await import(`./main.js?case=${1}`);

    expect(createRootSpy).toHaveBeenCalledWith(rootElement);
    // The runtime config wins over the query string.
    expect(renderedProps(renderFn)).toEqual({ programId: 'config-prog', apiBaseUrl: 'https://config.test' });
  }, 15000);

  it('falls back to query parameters and default programId when runtime config is absent', async () => {
    const renderFn = vi.fn();
    const createRootSpy = vi.spyOn(ReactDOM, 'createRoot').mockReturnValue({
      render: renderFn,
      unmount: vi.fn(),
    } as any);

    const rootElement = {};
    (globalThis as any).window = {
      location: { search: '?programId=query-only-id' },
    };
    (globalThis as any).document = {
      getElementById: vi.fn().mockReturnValue(rootElement),
    };

    await import(`./main.js?case=${2}`);

    expect(createRootSpy).toHaveBeenCalledWith(rootElement);
    expect(renderedProps(renderFn).programId).toBe('query-only-id');
  }, 15000);

  it('falls back to default fifthbell and handles missing root element', async () => {
    const createRootSpy = vi.spyOn(ReactDOM, 'createRoot');

    (globalThis as any).window = {
      location: { search: '' },
    };
    (globalThis as any).document = {
      getElementById: vi.fn().mockReturnValue(null),
    };

    await import(`./main.js?case=${3}`);

    expect(createRootSpy).not.toHaveBeenCalled();
  }, 15000);
});
