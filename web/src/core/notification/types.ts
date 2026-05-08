import type { Dayjs } from 'dayjs';
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

export type AdminNotificationBatchListMeta = {
  statusStats?: Partial<Record<AdminNotificationBatchStatus, number>>;
};

export type AdminNotificationBatchListResult = PageResult<
  AdminNotificationBatch,
  AdminNotificationBatchListMeta
>;

export type AdminNotificationDeliveryListResult = PageResult<AdminNotificationDelivery>;

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

export type AdminNotificationBatchStatus = 'draft' | 'scheduled' | 'published' | 'offline';

export type AdminNotificationDeliveryStatus = 'pending' | 'sent' | 'failed';

export type AdminNotificationTargetType = 'all' | 'role' | 'user';

export type AdminNotificationBatch = {
  id: number;
  title: string;
  content?: string;
  kind: AdminMessageKind;
  level: AdminMessageLevel;
  type: string;
  source: string;
  status: AdminNotificationBatchStatus;
  targetType: AdminNotificationTargetType;
  targetSummary: string;
  pinned?: boolean;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  offlineAt?: string | null;
  deliveryTotal: number;
  sentTotal: number;
  failedTotal: number;
  readTotal: number;
  operatorId?: number;
  operatorName?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminNotificationDelivery = {
  id: number;
  batchId: number;
  receiverId: number;
  receiverName: string;
  status: AdminNotificationDeliveryStatus;
  readAt?: string | null;
  archivedAt?: string | null;
  sentAt?: string | null;
  failedReason?: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminNotificationBatchQuery = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  kind?: AdminMessageKind;
  level?: AdminMessageLevel;
  type?: string;
  source?: string;
  status?: AdminNotificationBatchStatus;
};

export type AdminNotificationDeliveryQuery = {
  page?: number;
  pageSize?: number;
  status?: AdminNotificationDeliveryStatus;
  keyword?: string;
};

export type AdminNotificationBatchCreatePayload = {
  title: string;
  content?: string;
  level: AdminMessageLevel;
  type: string;
  targetType: AdminNotificationTargetType;
  targetRoleIds?: string[];
  pinned?: boolean;
  scheduledAt?: string | Dayjs | null;
};
