import { http } from '@/core/http/client';
import type {
  AdminMessageItem,
  AdminMessageListResult,
  AdminMessageQuery,
  AdminMessageUnreadCount,
  AdminNotificationBatch,
  AdminNotificationBatchCreatePayload,
  AdminNotificationBatchListResult,
  AdminNotificationBatchQuery,
  AdminNotificationDelivery,
  AdminNotificationDeliveryListResult,
  AdminNotificationDeliveryQuery,
} from './types';

export type AdminMessageIdentity = {
  kind: AdminMessageItem['kind'];
  id: number;
};

export const adminMessageApi = {
  list: (params?: AdminMessageQuery) =>
    http.Get<AdminMessageListResult>('/admin/messages', { params }),
  unreadCount: () => http.Get<AdminMessageUnreadCount>('/admin/messages/unread-count'),
  detail: ({ kind, id }: AdminMessageIdentity) =>
    http.Get<AdminMessageItem>(`/admin/messages/${kind}/${String(id)}`),
  markRead: (messages: AdminMessageIdentity[]) =>
    http.Post<null>('/admin/messages/read', { messages }),
  archive: (messages: AdminMessageIdentity[]) =>
    http.Post<null>('/admin/messages/archive', { messages }),
  restore: (messages: AdminMessageIdentity[]) =>
    http.Post<null>('/admin/messages/restore', { messages }),
  readAll: (kind?: AdminMessageItem['kind'] | 'all') =>
    http.Post<null>('/admin/messages/read-all', { kind }),
};

export const adminNotificationManagementApi = {
  listBatches: (params?: AdminNotificationBatchQuery) =>
    http.Get<AdminNotificationBatchListResult>('/admin/notification-batches', {
      params,
    }),
  createAnnouncement: (payload: AdminNotificationBatchCreatePayload) =>
    http.Post<AdminNotificationBatch>('/admin/notification-batches/announcements', payload),
  publishBatch: (id: number) =>
    http.Post<AdminNotificationBatch>(`/admin/notification-batches/${String(id)}/publish`),
  cancelScheduledBatch: (id: number) =>
    http.Post<AdminNotificationBatch>(`/admin/notification-batches/${String(id)}/cancel-scheduled`),
  offlineBatch: (id: number) =>
    http.Post<AdminNotificationBatch>(`/admin/notification-batches/${String(id)}/offline`),
  listDeliveries: (batchId: number, params?: AdminNotificationDeliveryQuery) =>
    http.Get<AdminNotificationDeliveryListResult>(
      `/admin/notification-batches/${String(batchId)}/deliveries`,
      { params },
    ),
  resendDelivery: (batchId: number, deliveryId: number) =>
    http.Post<AdminNotificationDelivery>(
      `/admin/notification-batches/${String(batchId)}/deliveries/${String(deliveryId)}/resend`,
    ),
};
