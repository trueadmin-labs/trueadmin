import { buildStreamUrl, createStreamHeaders } from '@/core/stream/requestUtils';
import type {
  AdminNotificationRealtimeAdapter,
  AdminNotificationRealtimeAdapterContext,
  AdminNotificationRealtimeEvent,
} from '../types';

export type SseNotificationAdapterOptions = {
  url?: string;
  retryIntervalMs: number;
};

type ParsedSseFrame = {
  data: string;
  event?: string;
};

class NotificationSseParser {
  private buffer = '';

  push(chunk: string): ParsedSseFrame[] {
    this.buffer += chunk;
    const frames = this.buffer.split(/\r?\n\r?\n/);
    this.buffer = frames.pop() ?? '';

    return frames.flatMap((frame) => this.parseFrame(frame));
  }

  flush(): ParsedSseFrame[] {
    if (this.buffer.trim() === '') {
      this.buffer = '';
      return [];
    }

    const frame = this.buffer;
    this.buffer = '';
    return this.parseFrame(frame);
  }

  private parseFrame(frame: string): ParsedSseFrame[] {
    let event: string | undefined;
    const data = frame
      .split(/\r?\n/)
      .filter((line) => {
        if (line.startsWith('event:')) {
          event = line.slice(6).trim();
          return false;
        }

        return line.startsWith('data:');
      })
      .map((line) => line.slice(5).trimStart())
      .join('\n');

    if (data === '') {
      return [];
    }

    return [{ data, event }];
  }
}

const parseEventData = ({
  data,
  event,
}: ParsedSseFrame): AdminNotificationRealtimeEvent | undefined => {
  if (data === '[DONE]') {
    return undefined;
  }

  if (!data) {
    return { reason: event ?? 'sse_event', type: 'sync_required' };
  }

  try {
    const payload = JSON.parse(data) as { reason?: string; type?: string };
    if (payload.type !== 'sync_required' && event !== 'sync_required') {
      return undefined;
    }

    return {
      reason: payload.reason ?? event ?? 'sse_event',
      type: 'sync_required',
    };
  } catch {
    return event === 'sync_required'
      ? { reason: data || event || 'sse_event', type: 'sync_required' }
      : undefined;
  }
};

const createSseError = (message: string, cause?: unknown) =>
  Object.assign(new Error(message), { cause, name: 'NotificationSseError' });

export function createSseNotificationAdapter(
  context: AdminNotificationRealtimeAdapterContext,
  options: SseNotificationAdapterOptions,
): AdminNotificationRealtimeAdapter {
  let abortController: AbortController | undefined;
  let retryTimer: number | undefined;
  let started = false;
  const url = buildStreamUrl(options.url ?? '/admin/messages/stream');

  const clearRetryTimer = () => {
    if (retryTimer !== undefined) {
      window.clearTimeout(retryTimer);
      retryTimer = undefined;
    }
  };

  const abortRequest = () => {
    abortController?.abort();
    abortController = undefined;
  };

  const scheduleReconnect = () => {
    clearRetryTimer();
    if (!started) {
      return;
    }

    retryTimer = window.setTimeout(connect, options.retryIntervalMs);
  };

  const handleError = (error: unknown) => {
    if (!started) {
      return;
    }

    context.onError?.(error);
    scheduleReconnect();
  };

  async function readStream(response: Response, signal: AbortSignal) {
    const reader = response.body?.getReader();
    if (!reader) {
      throw createSseError('Notification SSE response does not contain a readable stream.');
    }

    const decoder = new TextDecoder();
    const parser = new NotificationSseParser();

    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      parser.push(chunk).forEach((frame) => {
        const event = parseEventData(frame);
        if (event) {
          context.onEvent(event);
        }
      });
    }

    const tail = decoder.decode();
    if (tail) {
      parser.push(tail).forEach((frame) => {
        const event = parseEventData(frame);
        if (event) {
          context.onEvent(event);
        }
      });
    }

    parser.flush().forEach((frame) => {
      const event = parseEventData(frame);
      if (event) {
        context.onEvent(event);
      }
    });
  }

  async function connect() {
    if (!started) {
      return;
    }

    clearRetryTimer();
    abortRequest();
    const controller = new AbortController();
    abortController = controller;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: createStreamHeaders(),
        credentials: 'include',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw createSseError(
          `Notification SSE request failed with status ${String(response.status)}.`,
          response,
        );
      }

      await readStream(response, controller.signal);
      if (started && !controller.signal.aborted) {
        scheduleReconnect();
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      handleError(error);
    }
  }

  return {
    start: () => {
      if (started) {
        return;
      }

      started = true;
      void connect();
    },
    stop: () => {
      started = false;
      clearRetryTimer();
      abortRequest();
    },
    refresh: () => {
      context.onEvent({ reason: 'manual_refresh', type: 'sync_required' });
    },
  };
}
