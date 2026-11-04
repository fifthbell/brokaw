import type { Meta, StoryObj } from '@storybook/html';
import React, { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { useSSE } from '../../src/components/live-program/hooks/useSSE';

const PREFIX = '/__sse_acceptance__/';
const PRIMARY = `${PREFIX}primary`;
const SECONDARY = `${PREFIX}secondary`;
const RECONNECT_MS = 300;
const encoder = new TextEncoder();

type Plan = 'stream' | 'pending' | 'empty' | 'unavailable' | 'network-error';
type Message = { type: string; text: string };
type Diagnostic = { version: number; message: string; data: string; errorName: string };
type RequestRecord = {
  url: string;
  cache: RequestCache | undefined;
  signal: AbortSignal;
  aborts: number;
  cancellations: unknown[];
  pulls: number;
  controller?: ReadableStreamDefaultController<Uint8Array>;
};

// Only the HTTP/stream boundary is controlled. React, AbortController,
// ReadableStream readers, UTF-8 decoding and the production hook remain real.
class StreamBoundary {
  requests: RequestRecord[] = [];

  constructor(private plans: Plan[] = []) {}

  async fetch(url: string, init: RequestInit = {}): Promise<Response> {
    const record: RequestRecord = {
      url,
      cache: init.cache,
      signal: init.signal as AbortSignal,
      aborts: 0,
      cancellations: [],
      pulls: 0,
    };
    this.requests.push(record);
    record.signal.addEventListener('abort', () => { record.aborts += 1; }, { once: true });
    const plan = this.plans.shift() ?? 'stream';
    if (plan === 'unavailable') return new Response(null, { status: 503 });
    if (plan === 'empty') return new Response(null, { status: 200 });
    if (plan === 'network-error') throw new TypeError('Fixture connection unavailable');
    if (plan === 'pending') {
      return new Promise<Response>((_resolve, reject) => {
        record.signal.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted', 'AbortError'));
        }, { once: true });
      });
    }
    const body = new ReadableStream<Uint8Array>({
      start(controller) { record.controller = controller; },
      pull() { record.pulls += 1; },
      cancel(reason) { record.cancellations.push(reason); },
    });
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  send(index: number, value: string | Uint8Array) {
    this.requests[index].controller!.enqueue(
      typeof value === 'string' ? encoder.encode(value) : value,
    );
  }

  end(index: number) {
    this.requests[index].controller!.close();
  }
}

type FeedProps = {
  enabled: boolean;
  url: string;
  version: number;
  message: (value: string) => void;
  opened: (value: string) => void;
  diagnostic: (value: Diagnostic) => void;
};

function Feed({ enabled, url, version, message, opened, diagnostic }: FeedProps) {
  const state = useSSE({
    enabled,
    url,
    reconnectInterval: RECONNECT_MS,
    onMessage: (value) => message(`v${version}:${(value as Message).text}`),
    onOpen: async () => {
      await Promise.resolve();
      opened(`v${version}:${url}`);
    },
    onDiagnostic: (reason, payload) => {
      const detail = payload as { data: string; error: Error };
      diagnostic({ version, message: reason, data: detail.data, errorName: detail.error.name });
    },
  });
  return <section aria-label="SSE feed">
    <output data-testid="connection">{state.isConnected ? 'connected' : 'disconnected'}</output>
    <output data-testid="error">{state.error?.message ?? 'none'}</output>
  </section>;
}

function Harness({ initiallyEnabled = true }: { initiallyEnabled?: boolean }) {
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [mounted, setMounted] = useState(true);
  const [url, setUrl] = useState(PRIMARY);
  const [version, setVersion] = useState(1);
  const [messages, setMessages] = useState<string[]>([]);
  const [opens, setOpens] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const message = useCallback((value: string) => setMessages((all) => [...all, value]), []);
  const opened = useCallback((value: string) => setOpens((all) => [...all, value]), []);
  const diagnostic = useCallback((value: Diagnostic) => setDiagnostics((all) => [...all, value]), []);
  return <div>
    <button onClick={() => setEnabled((value) => !value)}>{enabled ? 'Disable feed' : 'Enable feed'}</button>
    <button onClick={() => setMounted(false)}>Unmount feed</button>
    <button onClick={() => setVersion(2)}>Use callback version 2</button>
    <button onClick={() => setUrl(SECONDARY)}>Switch feed URL</button>
    {mounted
      ? <Feed {...{ enabled, url, version, message, opened, diagnostic }} />
      : <p data-testid="unmounted">Feed unmounted</p>}
    <pre data-testid="messages">{JSON.stringify(messages)}</pre>
    <pre data-testid="opens">{JSON.stringify(opens)}</pre>
    <pre data-testid="diagnostics">{JSON.stringify(diagnostics)}</pre>
  </div>;
}

const meta = {
  title: 'React/SSEAcceptance',
  parameters: { layout: 'padded' },
  render: () => {
    const container = document.createElement('div');
    container.dataset.sseFixture = '';
    return container;
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
type Canvas = ReturnType<typeof within>;

function values<T>(canvas: Canvas, name: string): T {
  return JSON.parse(canvas.getByTestId(name).textContent!);
}

async function settleReconnectWindow() {
  await new Promise<void>((resolve) => window.setTimeout(resolve, RECONNECT_MS * 2));
}

async function scenario(
  canvasElement: HTMLElement,
  options: { plans?: Plan[]; initiallyEnabled?: boolean },
  exercise: (canvas: Canvas, boundary: StreamBoundary) => Promise<void>,
) {
  const host = canvasElement.querySelector<HTMLElement>('[data-sse-fixture]') ?? canvasElement;
  const boundary = new StreamBoundary(options.plans);
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    return url.includes(PREFIX)
      ? boundary.fetch(url, init)
      : previousFetch(input, init);
  };
  const root = createRoot(host);
  try {
    root.render(<Harness initiallyEnabled={options.initiallyEnabled} />);
    const canvas = within(host);
    await waitFor(() => expect(canvas.getByTestId('connection')).toBeInTheDocument());
    await exercise(canvas, boundary);
  } finally {
    root.unmount();
    globalThis.fetch = previousFetch;
  }
}

async function connected(canvas: Canvas, boundary: StreamBoundary, count = 1, openCount = count) {
  await waitFor(() => {
    expect(boundary.requests).toHaveLength(count);
    expect(canvas.getByTestId('connection')).toHaveTextContent(/^connected$/);
    expect(values<string[]>(canvas, 'opens')).toHaveLength(openCount);
  });
}

async function consumed(boundary: StreamBoundary, index: number, text: string) {
  const before = boundary.requests[index].pulls;
  boundary.send(index, text);
  await waitFor(() => expect(boundary.requests[index].pulls).toBeGreaterThan(before));
}

export const ChunkParsingAndFreshCallbacks: Story = {
  play: async ({ canvasElement }) => scenario(canvasElement, {}, async (canvas, boundary) => {
    await connected(canvas, boundary);
    expect(boundary.requests[0].url).toBe(PRIMARY);
    expect(boundary.requests[0].cache).toBe('no-store');
    expect(boundary.requests[0].signal.aborted).toBe(false);
    const wire = encoder.encode(': heartbeat\nevent: state\ndata: {"type":"state","text":"café"}\n\ndata: [DONE]\r\ndata: {broken}\ndata: {"type":"state","text":"second"}\r\n');
    const split = wire.indexOf(0xc3) + 1;
    boundary.send(0, wire.slice(0, split));
    boundary.send(0, wire.slice(split));
    await waitFor(() => {
      expect(values<string[]>(canvas, 'messages')).toEqual(['v1:café', 'v1:second']);
      expect(values<Diagnostic[]>(canvas, 'diagnostics')).toEqual([{
        version: 1,
        message: 'Ignored malformed SSE JSON payload',
        data: '{broken}',
        errorName: 'SyntaxError',
      }]);
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Use callback version 2' }));
    await consumed(boundary, 0, 'data: {"type":"state","text":"pending"}');
    expect(values<string[]>(canvas, 'messages')).toEqual(['v1:café', 'v1:second']);
    boundary.send(0, '\ndata: {bad-again}\n');
    await waitFor(() => {
      expect(values<string[]>(canvas, 'messages')).toEqual(['v1:café', 'v1:second', 'v2:pending']);
      expect(values<Diagnostic[]>(canvas, 'diagnostics')[1]).toMatchObject({
        version: 2, data: '{bad-again}', errorName: 'SyntaxError',
      });
    });
    expect(boundary.requests).toHaveLength(1);
    expect(canvas.getByTestId('error')).toHaveTextContent(/^none$/);
  }),
};

export const ReconnectDiscardsIncompleteFrame: Story = {
  play: async ({ canvasElement }) => scenario(canvasElement, {}, async (canvas, boundary) => {
    await connected(canvas, boundary);
    await consumed(boundary, 0, 'data: {"type":"state","text":"unfinished');
    await userEvent.click(canvas.getByRole('button', { name: 'Use callback version 2' }));
    boundary.end(0);
    await connected(canvas, boundary, 2);
    boundary.send(1, 'data: {"type":"state","text":"fresh"}\n');
    await waitFor(() => expect(values<string[]>(canvas, 'messages')).toEqual(['v2:fresh']));
    expect(values<string[]>(canvas, 'opens')).toEqual([`v1:${PRIMARY}`, `v2:${PRIMARY}`]);
    expect(values<Diagnostic[]>(canvas, 'diagnostics')).toEqual([]);
    expect(boundary.requests.map((request) => request.url)).toEqual([PRIMARY, PRIMARY]);
    expect(boundary.requests[0].signal).not.toBe(boundary.requests[1].signal);
  }),
};

function recoverFrom(plan: Plan, message: string): Story {
  return {
    play: async ({ canvasElement }) => scenario(canvasElement, { plans: [plan] }, async (canvas, boundary) => {
      await waitFor(() => {
        expect(canvas.getByTestId('connection')).toHaveTextContent(/^disconnected$/);
        expect(canvas.getByTestId('error')).toHaveTextContent(message);
      });
      expect(values<string[]>(canvas, 'opens')).toEqual([]);
      await connected(canvas, boundary, 2, 1);
      expect(canvas.getByTestId('error')).toHaveTextContent(/^none$/);
      boundary.send(1, 'data: {"type":"state","text":"recovered"}\n');
      await waitFor(() => expect(values<string[]>(canvas, 'messages')).toEqual(['v1:recovered']));
      expect(boundary.requests.every((request) => request.cache === 'no-store')).toBe(true);
    }),
  };
}

export const HttpFailureRecovers = recoverFrom('unavailable', 'SSE fetch failed: 503');
export const EmptyBodyRecovers = recoverFrom('empty', 'SSE response has no body');
export const NetworkFailureRecovers = recoverFrom('network-error', 'Fixture connection unavailable');

export const UnmountAbortsPendingFetch: Story = {
  play: async ({ canvasElement }) => scenario(canvasElement, { plans: ['pending'] }, async (canvas, boundary) => {
    await waitFor(() => expect(boundary.requests).toHaveLength(1));
    await userEvent.click(canvas.getByRole('button', { name: 'Unmount feed' }));
    await waitFor(() => expect(boundary.requests[0].aborts).toBe(1));
    expect(boundary.requests[0].signal.aborted).toBe(true);
    expect(boundary.requests[0].cancellations).toEqual([]);
    await settleReconnectWindow();
    expect(boundary.requests).toHaveLength(1);
    expect(values<string[]>(canvas, 'opens')).toEqual([]);
    expect(values<string[]>(canvas, 'messages')).toEqual([]);
    expect(canvas.queryByTestId('connection')).not.toBeInTheDocument();
  }),
};

export const UnmountCancelsActiveReader: Story = {
  play: async ({ canvasElement }) => scenario(canvasElement, {}, async (canvas, boundary) => {
    await connected(canvas, boundary);
    boundary.send(0, 'data: {"type":"state","text":"before-unmount"}\n');
    await waitFor(() => expect(values<string[]>(canvas, 'messages')).toEqual(['v1:before-unmount']));
    await userEvent.click(canvas.getByRole('button', { name: 'Unmount feed' }));
    await waitFor(() => {
      expect(boundary.requests[0].cancellations).toEqual([undefined]);
      expect(boundary.requests[0].aborts).toBe(1);
    });
    expect(boundary.requests[0].signal.aborted).toBe(true);
    await settleReconnectWindow();
    expect(boundary.requests).toHaveLength(1);
    expect(values<string[]>(canvas, 'messages')).toEqual(['v1:before-unmount']);
    expect(canvas.getByTestId('unmounted')).toHaveTextContent('Feed unmounted');
  }),
};

export const DisabledFeedAndUrlChange: Story = {
  play: async ({ canvasElement }) => scenario(canvasElement, { initiallyEnabled: false }, async (canvas, boundary) => {
    expect(canvas.getByTestId('connection')).toHaveTextContent(/^disconnected$/);
    await settleReconnectWindow();
    expect(boundary.requests).toEqual([]);
    await userEvent.click(canvas.getByRole('button', { name: 'Enable feed' }));
    await connected(canvas, boundary);
    await consumed(boundary, 0, 'data: {"type":"state","text":"old-url');
    await userEvent.click(canvas.getByRole('button', { name: 'Switch feed URL' }));
    await connected(canvas, boundary, 2);
    expect(boundary.requests[0].cancellations).toEqual([undefined]);
    expect(boundary.requests[0].signal.aborted).toBe(true);
    expect(boundary.requests[1].url).toBe(SECONDARY);
    boundary.send(1, 'data: {"type":"state","text":"new-url"}\n');
    await waitFor(() => expect(values<string[]>(canvas, 'messages')).toEqual(['v1:new-url']));
    await userEvent.click(canvas.getByRole('button', { name: 'Disable feed' }));
    await waitFor(() => expect(canvas.getByTestId('connection')).toHaveTextContent(/^disconnected$/));
    expect(boundary.requests[1].signal.aborted).toBe(true);
    expect(boundary.requests[1].cancellations).toEqual([undefined]);
    await settleReconnectWindow();
    expect(boundary.requests).toHaveLength(2);
  }),
};

export const DisableClearsErrorAndPendingReconnect: Story = {
  play: async ({ canvasElement }) => scenario(canvasElement, { plans: ['unavailable'] }, async (canvas, boundary) => {
    await waitFor(() => expect(canvas.getByTestId('error')).toHaveTextContent('SSE fetch failed: 503'));
    await userEvent.click(canvas.getByRole('button', { name: 'Disable feed' }));
    await waitFor(() => expect(canvas.getByTestId('error')).toHaveTextContent(/^none$/));
    await settleReconnectWindow();
    expect(boundary.requests).toHaveLength(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Enable feed' }));
    await connected(canvas, boundary, 2, 1);
    expect(values<string[]>(canvas, 'opens')).toEqual([`v1:${PRIMARY}`]);
  }),
};
