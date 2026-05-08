import { create } from 'zustand';
import { createPollingNotificationAdapter } from './adapters/polling';
import { createSseNotificationAdapter } from './adapters/sse';
import { adminMessageApi } from './service';
import type {
  AdminMessageItem,
  AdminMessageQuery,
  AdminMessageUnreadCount,
  AdminNotificationRealtimeAdapter,
  AdminNotificationRealtimeConfig,
  AdminNotificationRealtimeMode,
} from './types';

const defaultUnreadCount: AdminMessageUnreadCount = {
  announcement: 0,
  notification: 0,
  total: 0,
};

const defaultRealtimeConfig: Required<AdminNotificationRealtimeConfig> = {
  hiddenPollingIntervalMs: 180_000,
  maxSseFailures: 3,
  mode: 'auto',
  pollingIntervalMs: 30_000,
  sseRetryIntervalMs: 30_000,
};

type NotificationStoreState = {
  initialized: boolean;
  loading: boolean;
  error?: unknown;
  unreadCount: AdminMessageUnreadCount;
  latestMessages: AdminMessageItem[];
  realtimeMode: AdminNotificationRealtimeMode;
  activeRealtime: Exclude<AdminNotificationRealtimeMode, 'auto'>;
  sseFailures: number;
  refreshUnreadCount: () => Promise<void>;
  refreshLatestMessages: (query?: AdminMessageQuery) => Promise<void>;
  refresh: () => Promise<void>;
  markRead: (messages: Array<Pick<AdminMessageItem, 'id' | 'kind'>>) => Promise<void>;
  archive: (messages: Array<Pick<AdminMessageItem, 'id' | 'kind'>>) => Promise<void>;
  restore: (messages: Array<Pick<AdminMessageItem, 'id' | 'kind'>>) => Promise<void>;
  readAll: (kind?: AdminMessageItem['kind'] | 'all') => Promise<void>;
  startRealtime: (config?: AdminNotificationRealtimeConfig) => void;
  stopRealtime: () => void;
};

let realtimeAdapter: AdminNotificationRealtimeAdapter | undefined;

const toMessageIdentities = (messages: Array<Pick<AdminMessageItem, 'id' | 'kind'>>) =>
  messages.map((message) => ({ id: message.id, kind: message.kind }));

export const useAdminNotificationStore = create<NotificationStoreState>((set, get) => ({
  activeRealtime: 'disabled',
  initialized: false,
  latestMessages: [],
  loading: false,
  realtimeMode: 'disabled',
  sseFailures: 0,
  unreadCount: defaultUnreadCount,

  refreshUnreadCount: async () => {
    const unreadCount = await adminMessageApi.unreadCount().send();
    set({ unreadCount });
  },

  refreshLatestMessages: async (query) => {
    const result = await adminMessageApi
      .list({ kind: 'all', page: 1, pageSize: 5, status: 'all', ...query })
      .send();
    set({ latestMessages: result.items ?? [] });
  },

  refresh: async () => {
    set({ loading: true });
    try {
      await Promise.all([get().refreshUnreadCount(), get().refreshLatestMessages()]);
      set({ error: undefined, initialized: true });
    } catch (error) {
      set({ error });
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (messages) => {
    await adminMessageApi.markRead(toMessageIdentities(messages)).send();
    await get().refresh();
  },

  archive: async (messages) => {
    await adminMessageApi.archive(toMessageIdentities(messages)).send();
    await get().refresh();
  },

  restore: async (messages) => {
    await adminMessageApi.restore(toMessageIdentities(messages)).send();
    await get().refresh();
  },

  readAll: async (kind) => {
    await adminMessageApi.readAll(kind).send();
    await get().refresh();
  },

  startRealtime: (config) => {
    const realtimeConfig = { ...defaultRealtimeConfig, ...config };
    realtimeAdapter?.stop();
    realtimeAdapter = undefined;

    if (realtimeConfig.mode === 'disabled') {
      set({ activeRealtime: 'disabled', realtimeMode: 'disabled' });
      return;
    }

    const startPolling = () => {
      realtimeAdapter?.stop();
      realtimeAdapter = createPollingNotificationAdapter(
        {
          onEvent: () => {
            void get().refresh();
          },
          onError: (error) => set({ error }),
        },
        {
          hiddenIntervalMs: realtimeConfig.hiddenPollingIntervalMs,
          intervalMs: realtimeConfig.pollingIntervalMs,
        },
      );
      set({ activeRealtime: 'polling', realtimeMode: realtimeConfig.mode });
      realtimeAdapter.start();
    };

    if (realtimeConfig.mode === 'polling') {
      startPolling();
      return;
    }

    realtimeAdapter = createSseNotificationAdapter(
      {
        onEvent: () => {
          set({ sseFailures: 0 });
          void get().refresh();
        },
        onError: (error) => {
          const nextFailures = get().sseFailures + 1;
          set({ error, sseFailures: nextFailures });
          if (realtimeConfig.mode === 'auto' && nextFailures >= realtimeConfig.maxSseFailures) {
            startPolling();
          }
        },
      },
      { retryIntervalMs: realtimeConfig.sseRetryIntervalMs },
    );
    set({ activeRealtime: 'sse', realtimeMode: realtimeConfig.mode });
    realtimeAdapter.start();
  },

  stopRealtime: () => {
    realtimeAdapter?.stop();
    realtimeAdapter = undefined;
    set({ activeRealtime: 'disabled', realtimeMode: 'disabled', sseFailures: 0 });
  },
}));
