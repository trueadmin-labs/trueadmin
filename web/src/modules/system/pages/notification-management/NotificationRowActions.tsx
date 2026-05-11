import { RedoOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import { TrueAdminConfirmAction } from '@/core/action';
import type { CrudTableAction } from '@/core/crud/types';
import type { TranslateFunction } from '@/core/i18n/trans';
import { type AdminNotificationBatch, adminNotificationManagementApi } from '@/core/notification';

type NotificationRowActionsProps = {
  action: CrudTableAction<AdminNotificationBatch>;
  record: AdminNotificationBatch;
  t: TranslateFunction;
  onOpenDeliveries: (record: AdminNotificationBatch) => void;
  onOpenDetail: (record: AdminNotificationBatch) => void;
  onResendSuccess: (resent: number) => void;
};

export function NotificationRowActions({
  action,
  record,
  t,
  onOpenDeliveries,
  onOpenDetail,
  onResendSuccess,
}: NotificationRowActionsProps) {
  return (
    <Space size={4} wrap>
      <Button size="small" type="link" onClick={() => onOpenDetail(record)}>
        {t('system.notificationManagement.action.detail', '详情')}
      </Button>
      <Button size="small" type="link" onClick={() => onOpenDeliveries(record)}>
        {t('system.notificationManagement.action.deliveries', '投递记录')}
      </Button>
      {record.failedTotal > 0 ? (
        <TrueAdminConfirmAction
          size="small"
          type="link"
          icon={<RedoOutlined />}
          confirm={t('system.notificationManagement.confirm.resend', '确认重发失败投递吗？')}
          successMessage={t('system.notificationManagement.success.resend', '投递记录已重发')}
          action={async () => {
            const result = await adminNotificationManagementApi
              .resendNotification(record.id)
              .send();
            onResendSuccess(result.resent);
            action.reload();
          }}
        >
          {t('system.notificationManagement.action.resend', '重发')}
        </TrueAdminConfirmAction>
      ) : null}
    </Space>
  );
}
