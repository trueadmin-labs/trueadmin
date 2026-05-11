import type {
  AdminMessageLevel,
  AdminNotificationBatchStatus,
  AdminNotificationDeliveryStatus,
} from '@/core/notification';

export const levelColor: Record<AdminMessageLevel, string> = {
  error: 'error',
  info: 'processing',
  success: 'success',
  warning: 'warning',
};

export const batchStatusColor: Record<AdminNotificationBatchStatus, string> = {
  completed: 'success',
  failed: 'error',
  partial_failed: 'warning',
  sending: 'processing',
};

export const deliveryStatusColor: Record<AdminNotificationDeliveryStatus, string> = {
  failed: 'error',
  pending: 'processing',
  sent: 'success',
  skipped: 'default',
};

export const toPlainText = (value?: string) =>
  value
    ?.replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`\-[\]|()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
