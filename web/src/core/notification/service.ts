import { http } from '@/core/http/client';
import type {
  AdminMessageItem,
  AdminMessageListResult,
  AdminMessageQuery,
  AdminMessageUnreadCount,
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
