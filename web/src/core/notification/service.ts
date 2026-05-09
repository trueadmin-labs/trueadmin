import { http } from '@/core/http/client';
import type {
  AdminAnnouncement,
  AdminAnnouncementCreatePayload,
  AdminAnnouncementListResult,
  AdminAnnouncementQuery,
  AdminAnnouncementUpdatePayload,
  AdminMessageItem,
  AdminMessageListResult,
  AdminMessageQuery,
  AdminMessageUnreadCount,
  AdminNotificationBatchListResult,
  AdminNotificationBatchQuery,
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
  listNotifications: (params?: AdminNotificationBatchQuery) =>
    http.Get<AdminNotificationBatchListResult>('/admin/notifications', {
      params,
    }),
  listAnnouncements: (params?: AdminAnnouncementQuery) =>
    http.Get<AdminAnnouncementListResult>('/admin/announcements', { params }),
  createAnnouncement: (payload: AdminAnnouncementCreatePayload) =>
    http.Post<AdminAnnouncement>('/admin/announcements', payload),
  updateAnnouncement: (id: number, payload: AdminAnnouncementUpdatePayload) =>
    http.Put<AdminAnnouncement>(`/admin/announcements/${String(id)}`, payload),
  deleteDraftAnnouncement: (id: number) => http.Delete<null>(`/admin/announcements/${String(id)}`),
  publishAnnouncement: (id: number) =>
    http.Post<AdminAnnouncement>(`/admin/announcements/${String(id)}/publish`),
  cancelScheduledAnnouncement: (id: number) =>
    http.Post<AdminAnnouncement>(`/admin/announcements/${String(id)}/cancel-scheduled`),
  offlineAnnouncement: (id: number) =>
    http.Post<AdminAnnouncement>(`/admin/announcements/${String(id)}/offline`),
  restoreAnnouncement: (id: number) =>
    http.Post<AdminAnnouncement>(`/admin/announcements/${String(id)}/restore`),
  listDeliveries: (batchId: number, params?: AdminNotificationDeliveryQuery) =>
    http.Get<AdminNotificationDeliveryListResult>(
      `/admin/notifications/${String(batchId)}/deliveries`,
      { params },
    ),
  resendNotification: (batchId: number) =>
    http.Post<{ resent: number }>(`/admin/notifications/${String(batchId)}/resend`),
};
