import type {
  AdminAnnouncementCreatePayload,
  AdminAnnouncementStatus,
  AdminMessageLevel,
} from '@/core/notification';

export const levelColor: Record<AdminMessageLevel, string> = {
  error: 'error',
  info: 'processing',
  success: 'success',
  warning: 'warning',
};

export const announcementStatusColor: Record<AdminAnnouncementStatus, string> = {
  active: 'success',
  draft: 'default',
  expired: 'default',
  offline: 'default',
  scheduled: 'processing',
};

export const toPlainText = (value?: string) =>
  value
    ?.replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`\-[\]|()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export type AnnouncementFormValues = Partial<AdminAnnouncementCreatePayload>;

export type AnnouncementSubmitMode = 'draft' | 'publish';

export const getInitialAnnouncementValues = (): AnnouncementFormValues => ({
  attachments: [],
  content: undefined,
  expireAt: null,
  level: 'info',
  pinned: false,
  scheduledAt: null,
  targetRoleIds: undefined,
  targetType: 'all',
  title: undefined,
});

export const toMinuteDateTime = (value: AnnouncementFormValues['scheduledAt']) => {
  if (!value) {
    return null;
  }

  return typeof value === 'string' ? value : value.format('YYYY-MM-DD HH:mm');
};
