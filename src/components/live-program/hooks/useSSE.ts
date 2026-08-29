import { useEffect, useRef, useState } from 'react';

interface UseSSEOptions {
  url: string;
  onMessage?: (data: unknown) => void;
  onOpen?: () => void | Promise<void>;
  onDiagnostic?: (message: string, payload?: unknown) => void;
  reconnectInterval?: number;
  enabled?: boolean;
}

export function useSSE({ url, onMessage, onOpen, onDiagnostic, reconnectInterval = 3000, enabled = true }: UseSSEOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onDiagnosticRef = useRef(onDiagnostic);
  const bufferRef = useRef('');

  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onDiagnosticRef.current = onDiagnostic;
  }, [onMessage, onOpen, onDiagnostic]);

  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      setError(null);
      return;
    }

    let disposed = false;
    let abortController: AbortController | null = null;
    let reconnectTimer: number | null = null;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    const processLine = (line: string) => {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') return;
        try {
          const data = JSON.parse(dataStr);
          console.log('[SSE] message:', data.type);
          onMessageRef.current?.(data);
        } catch (parseError) {
          onDiagnosticRef.current?.('Ignored malformed SSE JSON payload', { data: dataStr, error: parseError });
        }
      }
    };

    const onChunk = (chunk: string) => {
      bufferRef.current += chunk;
      const lines = bufferRef.current.split('\n');
      bufferRef.current = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) processLine(trimmed);
      }
    };

    const connect = async () => {
      if (disposed) return;

      try {
        abortController = new AbortController();
        bufferRef.current = '';
        const response = await fetch(url, {
          signal: abortController.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`SSE fetch failed: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('SSE response has no body');
        }

        console.log('[SSE] connected to', url);
        setIsConnected(true);
        setError(null);
        await onOpenRef.current?.();

        reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (!disposed) {
          const { done, value } = await reader.read();
          if (done) break;
          onChunk(decoder.decode(value, { stream: true }));
        }
      } catch (err: any) {
        if (disposed) return;
        if (err.name === 'AbortError') return;
        console.error('[SSE] error:', err);
        setIsConnected(false);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!disposed) setIsConnected(false);
        reader = null;
        abortController = null;
        if (!disposed) {
          reconnectTimer = window.setTimeout(connect, reconnectInterval);
        }
      }
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      if (reader) {
        try { reader.cancel(); } catch { /* no-op */ }
      }
      if (abortController) {
        abortController.abort();
      }
    };
  }, [enabled, url, reconnectInterval]);

  return { isConnected, error };
}
