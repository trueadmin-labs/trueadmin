import type { ReactNode } from 'react';
import type { PageResult } from '@/core/http/types';
import type { TransText } from '@/core/i18n/trans';
import type { TrueAdminAttachmentValue } from '@/core/upload';

export type AdminMessageKind = 'notification' | 'announcement';

export type AdminMessageLevel = 'info' | 'success' | 'warning' | 'error';

export type AdminMessageReadStatus = 'all' | 'unread' | 'read' | 'archived';

export type AdminMessageItem = {
  id: number;
  kind: AdminMessageKind;
  title: string;
  content?: string;
  level: AdminMessageLevel;
  type: string;
  source?: string;
  targetUrl?: string;
  payload?: Record<string, unknown>;
  attachments?: TrueAdminAttachmentValue[];
  readAt?: string | null;
  archivedAt?: string | null;
  pinned?: boolean;
  createdAt: string;
};

export type AdminMessageQuery = {
  page?: number;
  pageSize?: number;
  kind?: AdminMessageKind | 'all';
  status?: AdminMessageReadStatus;
  level?: AdminMessageLevel;
  type?: string;
  source?: string;
  keyword?: string;
  startAt?: string;
  endAt?: string;
};

export type AdminMessageUnreadCount = {
  total: number;
  notification: number;
  announcement: number;
};

export type AdminMessageListResult = PageResult<AdminMessageItem>;

export type AdminMessageTypeClickContext = {
  defaultOpen: () => void;
  defaultNavigate: () => void;
};

export type AdminMessageLabel = ReactNode | TransText;

export type AdminMessagePayloadRenderContext = {
  message: AdminMessageItem;
  payload: Record<string, unknown>;
};

export type AdminMessageTypeConfig = {
  label?: AdminMessageLabel;
  icon?: ReactNode;
  color?: string;
  payloadRender?: (context: AdminMessagePayloadRenderContext) => ReactNode;
  onClick?: (
    message: AdminMessageItem,
    context: AdminMessageTypeClickContext,
  ) => void | Promise<void>;
};

export type AdminMessageSourceConfig = {
  label?: AdminMessageLabel;
  payloadRender?: (context: AdminMessagePayloadRenderContext) => ReactNode;
};

export type AdminNotificationRealtimeMode = 'auto' | 'polling' | 'sse' | 'disabled';

export type AdminNotificationRealtimeEvent = {
  type: 'sync_required';
  reason?: string;
};

export type AdminNotificationRealtimeAdapter = {
  start: () => void;
  stop: () => void;
  refresh?: () => void;
};

export type AdminNotificationRealtimeAdapterContext = {
  onEvent: (event: AdminNotificationRealtimeEvent) => void;
  onError?: (error: unknown) => void;
};

export type AdminNotificationRealtimeConfig = {
  mode?: AdminNotificationRealtimeMode;
  pollingIntervalMs?: number;
  hiddenPollingIntervalMs?: number;
  sseRetryIntervalMs?: number;
  maxSseFailures?: number;
};
