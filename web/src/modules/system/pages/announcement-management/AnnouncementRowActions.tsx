import { TrueAdminConfirmAction } from '@trueadmin/web-antd/action';
import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Button, Space } from 'antd';
import type { CrudTableAction } from '@/core/crud/types';
import type { AdminAnnouncement } from '@/core/notification';
import { adminNotificationManagementApi } from '@/core/notification';

type AnnouncementRowActionsProps = {
  action: CrudTableAction<
    AdminAnnouncement,
    Partial<AdminAnnouncement>,
    Partial<AdminAnnouncement>
  >;
  record: AdminAnnouncement;
  t: TranslateFunction;
  onDetail: (record: AdminAnnouncement) => void;
  onEdit: (record: AdminAnnouncement) => void;
};

export function AnnouncementRowActions({
  action,
  record,
  t,
  onDetail,
  onEdit,
}: AnnouncementRowActionsProps) {
  return (
    <Space size={4} wrap>
      <Button size="small" type="link" onClick={() => onDetail(record)}>
        {t('system.announcementManagement.action.detail', '详情')}
      </Button>
      {['draft', 'scheduled', 'active', 'expired'].includes(record.status) ? (
        <Button size="small" type="link" onClick={() => onEdit(record)}>
          {t('system.announcementManagement.action.edit', '编辑')}
        </Button>
      ) : null}
      {record.status === 'draft' || record.status === 'scheduled' ? (
        <TrueAdminConfirmAction
          size="small"
          type="link"
          confirm={t('system.announcementManagement.confirm.publish', '确认发布该公告吗？')}
          successMessage={t('system.announcementManagement.success.publish', '公告已发布')}
          action={async () => {
            await adminNotificationManagementApi.publishAnnouncement(record.id).send();
            action.reload();
          }}
        >
          {t('system.announcementManagement.action.publish', '发布')}
        </TrueAdminConfirmAction>
      ) : null}
      {record.status === 'scheduled' ? (
        <TrueAdminConfirmAction
          danger
          size="small"
          type="link"
          confirm={t(
            'system.announcementManagement.confirm.cancelScheduled',
            '取消后会退回草稿状态。',
          )}
          successMessage={t(
            'system.announcementManagement.success.cancelScheduled',
            '定时发布已取消',
          )}
          action={async () => {
            await adminNotificationManagementApi.cancelScheduledAnnouncement(record.id).send();
            action.reload();
          }}
        >
          {t('system.announcementManagement.action.cancelScheduled', '取消')}
        </TrueAdminConfirmAction>
      ) : null}
      {record.status === 'draft' ? (
        <TrueAdminConfirmAction
          danger
          size="small"
          type="link"
          confirm={t('system.announcementManagement.confirm.deleteDraft', '删除后不可恢复。')}
          successMessage={t('system.announcementManagement.success.deleteDraft', '草稿已删除')}
          action={async () => {
            await adminNotificationManagementApi.deleteDraftAnnouncement(record.id).send();
            action.reload();
          }}
        >
          {t('system.announcementManagement.action.delete', '删除')}
        </TrueAdminConfirmAction>
      ) : null}
      {record.status === 'active' ? (
        <TrueAdminConfirmAction
          danger
          size="small"
          type="link"
          confirm={t('system.announcementManagement.confirm.offline', '确认下线该公告吗？')}
          successMessage={t('system.announcementManagement.success.offline', '公告已下线')}
          action={async () => {
            await adminNotificationManagementApi.offlineAnnouncement(record.id).send();
            action.reload();
          }}
        >
          {t('system.announcementManagement.action.offline', '下线')}
        </TrueAdminConfirmAction>
      ) : null}
      {record.status === 'offline' || record.status === 'expired' ? (
        <TrueAdminConfirmAction
          size="small"
          type="link"
          confirm={t('system.announcementManagement.confirm.restore', '确认恢复该公告吗？')}
          successMessage={t('system.announcementManagement.success.restore', '公告已恢复')}
          action={async () => {
            await adminNotificationManagementApi.restoreAnnouncement(record.id).send();
            action.reload();
          }}
        >
          {t('system.announcementManagement.action.restore', '恢复')}
        </TrueAdminConfirmAction>
      ) : null}
    </Space>
  );
}
