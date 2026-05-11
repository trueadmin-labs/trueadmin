import type { CrudPageResult, CrudQueryController } from '@/core/crud/types';
import { TrueAdminQuickFilter } from '@/core/filter/TrueAdminQuickFilter';
import type { TranslateFunction } from '@/core/i18n/trans';
import type { AdminAnnouncementListMeta, AdminAnnouncementStatus } from '@/core/notification';

type AnnouncementStatusFilterProps = {
  query: CrudQueryController;
  response?: CrudPageResult<unknown, AdminAnnouncementListMeta>;
  statusText: Record<AdminAnnouncementStatus, string>;
  t: TranslateFunction;
};

export function AnnouncementStatusFilter({
  query,
  response,
  statusText,
  t,
}: AnnouncementStatusFilterProps) {
  const currentStatus = (query.values.status as AdminAnnouncementStatus | undefined) ?? 'all';
  const scheduledCount = response?.meta?.statusStats?.scheduled ?? 0;

  return (
    <TrueAdminQuickFilter<AdminAnnouncementStatus | 'all'>
      value={currentStatus}
      items={[
        { label: t('notification.tab.all', '全部'), value: 'all' },
        { label: statusText.draft, value: 'draft' },
        { count: scheduledCount, label: statusText.scheduled, value: 'scheduled' },
        { label: statusText.active, value: 'active' },
        { label: statusText.expired, value: 'expired' },
        { label: statusText.offline, value: 'offline' },
      ]}
      onChange={(nextStatus) =>
        query.setValue('status', nextStatus === 'all' ? undefined : nextStatus)
      }
    />
  );
}
