import { requestConfig } from '@config/index';
import type {
  AdminNotificationRealtimeAdapter,
  AdminNotificationRealtimeAdapterContext,
} from '../types';

export type SseNotificationAdapterOptions = {
  url?: string;
  retryIntervalMs: number;
};

const buildUrl = (url: string) =>
  /^https?:\/\//.test(url)
    ? url
    : `${requestConfig.baseURL}${url.startsWith('/') ? url : `/${url}`}`;

const parseEventData = (data: string) => {
  if (!data) {
    return { reason: 'sse_event', type: 'sync_required' } as const;
  }

  try {
    const payload = JSON.parse(data) as { reason?: string; type?: string };
    return {
      reason: payload.reason ?? 'sse_event',
      type: 'sync_required',
    } as const;
  } catch {
    return { reason: data, type: 'sync_required' } as const;
  }
};

export function createSseNotificationAdapter(
  context: AdminNotificationRealtimeAdapterContext,
  options: SseNotificationAdapterOptions,
): AdminNotificationRealtimeAdapter {
  let eventSource: EventSource | undefined;
  let retryTimer: number | undefined;
  let started = false;
  const url = buildUrl(options.url ?? '/admin/messages/stream');

  const clearRetryTimer = () => {
    if (retryTimer !== undefined) {
      window.clearTimeout(retryTimer);
      retryTimer = undefined;
    }
  };

  const closeEventSource = () => {
    eventSource?.close();
    eventSource = undefined;
  };

  const connect = () => {
    if (!started) {
      return;
    }

    clearRetryTimer();
    closeEventSource();

    const nextEventSource = new EventSource(url, { withCredentials: true });
    eventSource = nextEventSource;

    nextEventSource.addEventListener('sync_required', (event) => {
      context.onEvent(parseEventData((event as MessageEvent<string>).data));
    });

    nextEventSource.onmessage = (event) => {
      context.onEvent(parseEventData(event.data));
    };

    nextEventSource.onerror = (error) => {
      context.onError?.(error);
      closeEventSource();
      retryTimer = window.setTimeout(connect, options.retryIntervalMs);
    };
  };

  return {
    start: () => {
      if (started) {
        return;
      }

      started = true;
      connect();
    },
    stop: () => {
      started = false;
      clearRetryTimer();
      closeEventSource();
    },
  };
}
