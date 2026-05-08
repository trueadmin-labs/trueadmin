import type {
  AdminNotificationRealtimeAdapter,
  AdminNotificationRealtimeAdapterContext,
} from '../types';

export type PollingNotificationAdapterOptions = {
  intervalMs: number;
  hiddenIntervalMs: number;
};

export function createPollingNotificationAdapter(
  context: AdminNotificationRealtimeAdapterContext,
  options: PollingNotificationAdapterOptions,
): AdminNotificationRealtimeAdapter {
  let timer: number | undefined;
  let started = false;

  const clearTimer = () => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
    }
  };

  const getInterval = () =>
    document.visibilityState === 'hidden' ? options.hiddenIntervalMs : options.intervalMs;

  const emitSyncRequired = (reason: string) => {
    context.onEvent({ reason, type: 'sync_required' });
  };

  const schedule = () => {
    clearTimer();

    if (!started) {
      return;
    }

    timer = window.setTimeout(() => {
      emitSyncRequired('polling_interval');
      schedule();
    }, getInterval());
  };

  const handleVisibilityChange = () => {
    if (!started) {
      return;
    }

    if (document.visibilityState === 'visible') {
      emitSyncRequired('page_visible');
    }

    schedule();
  };

  return {
    start: () => {
      if (started) {
        return;
      }

      started = true;
      document.addEventListener('visibilitychange', handleVisibilityChange);
      emitSyncRequired('polling_start');
      schedule();
    },
    stop: () => {
      started = false;
      clearTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    },
    refresh: () => {
      emitSyncRequired('manual_refresh');
      schedule();
    },
  };
}
