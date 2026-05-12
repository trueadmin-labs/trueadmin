import { crudRequestOptions } from '@trueadmin/web-core/crud';
import type { CrudListParams } from '@/core/crud/types';
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
  list: (params?: AdminMessageQuery | CrudListParams) =>
    http.Get<AdminMessageListResult>('/admin/messages', crudRequestOptions(params)),
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
  listNotifications: (params?: AdminNotificationBatchQuery | CrudListParams) =>
    http.Get<AdminNotificationBatchListResult>(
      '/admin/message-management/notifications',
      crudRequestOptions(params),
    ),
  listAnnouncements: (params?: AdminAnnouncementQuery | CrudListParams) =>
    http.Get<AdminAnnouncementListResult>(
      '/admin/message-management/announcements',
      crudRequestOptions(params),
    ),
  createAnnouncement: (payload: AdminAnnouncementCreatePayload) =>
    http.Post<AdminAnnouncement>('/admin/message-management/announcements', payload),
  updateAnnouncement: (id: number, payload: AdminAnnouncementUpdatePayload) =>
    http.Put<AdminAnnouncement>(`/admin/message-management/announcements/${String(id)}`, payload),
  deleteDraftAnnouncement: (id: number) =>
    http.Delete<null>(`/admin/message-management/announcements/${String(id)}`),
  publishAnnouncement: (id: number) =>
    http.Post<AdminAnnouncement>(`/admin/message-management/announcements/${String(id)}/publish`),
  cancelScheduledAnnouncement: (id: number) =>
    http.Post<AdminAnnouncement>(
      `/admin/message-management/announcements/${String(id)}/cancel-scheduled`,
    ),
  offlineAnnouncement: (id: number) =>
    http.Post<AdminAnnouncement>(`/admin/message-management/announcements/${String(id)}/offline`),
  restoreAnnouncement: (id: number) =>
    http.Post<AdminAnnouncement>(`/admin/message-management/announcements/${String(id)}/restore`),
  listDeliveries: (batchId: number, params?: AdminNotificationDeliveryQuery | CrudListParams) =>
    http.Get<AdminNotificationDeliveryListResult>(
      `/admin/message-management/notifications/${String(batchId)}/deliveries`,
      crudRequestOptions(params),
    ),
  resendNotification: (batchId: number) =>
    http.Post<{ resent: number }>(
      `/admin/message-management/notifications/${String(batchId)}/resend`,
    ),
};
