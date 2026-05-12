import type { AdminMessageItem, AdminMessageLevel } from '@/core/notification';

export const levelColor: Record<AdminMessageLevel, string> = {
  error: 'error',
  info: 'processing',
  success: 'success',
  warning: 'warning',
};

export const toMessageRowKey = (message: Pick<AdminMessageItem, 'id' | 'kind'>) =>
  [message.kind, message.id].join(':');

export const toPlainText = (value?: string) =>
  value
    ?.replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`\-[\]|()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
