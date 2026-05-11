import type { AdminMessageItem, AdminMessageLevel } from '@/core/notification';

export const levelColor: Record<AdminMessageLevel, string> = {
  error: 'error',
  info: 'processing',
  success: 'success',
  warning: 'warning',
};

export const splitRange = (value: unknown) =>
  typeof value === 'string' && value.length > 0 ? value.split(',').filter(Boolean) : [];

export const toMessageRowKey = (message: Pick<AdminMessageItem, 'id' | 'kind'>) =>
  [message.kind, message.id].join(':');

export const toPlainText = (value?: string) =>
  value
    ?.replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`\-[\]|()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
