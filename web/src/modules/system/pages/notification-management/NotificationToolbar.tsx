import type { CrudQueryController } from '@/core/crud/types';
import { TrueAdminQuickFilter } from '@/core/filter/TrueAdminQuickFilter';
import type { TranslateFunction } from '@/core/i18n/trans';
import type { AdminNotificationBatchStatus } from '@/core/notification';

type NotificationToolbarProps = {
  query: CrudQueryController;
  statusText: Record<AdminNotificationBatchStatus, string>;
  t: TranslateFunction;
};

export function NotificationToolbar({ query, statusText, t }: NotificationToolbarProps) {
  const currentStatus = (query.values.status as AdminNotificationBatchStatus | undefined) ?? 'all';

  return (
    <TrueAdminQuickFilter<AdminNotificationBatchStatus | 'all'>
      value={currentStatus}
      items={[
        { label: t('notification.tab.all', '全部'), value: 'all' },
        { label: statusText.completed, value: 'completed' },
        { label: statusText.partial_failed, value: 'partial_failed' },
        { label: statusText.failed, value: 'failed' },
      ]}
      onChange={(nextStatus) =>
        query.setValue('status', nextStatus === 'all' ? undefined : nextStatus)
      }
    />
  );
}
