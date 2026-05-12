import { TrueAdminQuickFilter } from '@trueadmin/web-antd/filter';
import { Button, Statistic, Tag } from 'antd';
import { useMemo } from 'react';
import { TrueAdminCrudTable } from '@/core/crud';
import type { CrudColumns, CrudExtraQuerySchema, CrudService } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminModal } from '@/core/modal';
import {
  type AdminNotificationBatch,
  type AdminNotificationDelivery,
  type AdminNotificationDeliveryStatus,
  adminNotificationManagementApi,
} from '@/core/notification';
import { deliveryStatusColor } from './notificationManagementModel';

type DeliveryRecordsModalProps = {
  open: boolean;
  batch?: AdminNotificationBatch;
  deliveryStatusText: Record<AdminNotificationDeliveryStatus, string>;
  onClose: () => void;
  afterOpenChange?: (open: boolean) => void;
};

export function DeliveryRecordsModal({
  open,
  batch,
  deliveryStatusText,
  onClose,
  afterOpenChange,
}: DeliveryRecordsModalProps) {
  const { t } = useI18n();
  const deliveryExtraQuery = useMemo<CrudExtraQuerySchema[]>(
    () => [
      {
        name: 'status',
        transform: ({ value }) => ({ filters: [{ field: 'status', op: 'eq', value }] }),
      },
    ],
    [],
  );
  const deliveryService = useMemo<CrudService<AdminNotificationDelivery>>(
    () => ({
      list: async (params, options) =>
        batch
          ? adminNotificationManagementApi.listDeliveries(batch.id, params).send(options?.force)
          : { items: [], page: 1, pageSize: 20, total: 0 },
    }),
    [batch],
  );
  const deliveryColumns = useMemo<CrudColumns<AdminNotificationDelivery>>(
    () => [
      {
        dataIndex: 'receiverName',
        title: t('system.notificationManagement.column.receiver', '接收人'),
        width: 160,
      },
      {
        dataIndex: 'status',
        render: (_, record) => (
          <Tag color={deliveryStatusColor[record.status]}>{deliveryStatusText[record.status]}</Tag>
        ),
        title: t('system.notificationManagement.column.deliveryStatus', '投递状态'),
        width: 120,
      },
      {
        dataIndex: 'readAt',
        render: (_, record) => record.readAt ?? '-',
        title: t('system.notificationManagement.column.readAt', '已读时间'),
        width: 180,
      },
      {
        dataIndex: 'failedReason',
        render: (_, record) => record.failedReason ?? '-',
        title: t('system.notificationManagement.column.failedReason', '失败原因'),
        width: 220,
      },
      {
        dataIndex: 'retryCount',
        title: t('system.notificationManagement.column.retryCount', '重试次数'),
        width: 100,
      },
      { dataIndex: 'updatedAt', title: t('notification.detail.createdAt', '时间'), width: 180 },
    ],
    [deliveryStatusText, t],
  );

  return (
    <TrueAdminModal
      destroyOnHidden
      className="trueadmin-notification-delivery-modal"
      open={open}
      title={
        batch
          ? `${t('system.notificationManagement.modal.deliveries', '投递记录')} - ${batch.title}`
          : ''
      }
      width={980}
      footer={<Button onClick={onClose}>{t('modal.action.close', '关闭')}</Button>}
      onCancel={onClose}
      afterOpenChange={afterOpenChange}
    >
      {batch ? (
        <div className="trueadmin-notification-delivery-modal-body">
          <div className="trueadmin-notification-management-stats">
            <Statistic
              title={t('system.notificationManagement.stats.total', '总投递')}
              value={batch.deliveryTotal}
            />
            <Statistic
              title={t('system.notificationManagement.stats.sent', '已投递')}
              value={batch.sentTotal}
            />
            <Statistic
              title={t('system.notificationManagement.stats.failed', '失败')}
              value={batch.failedTotal}
              valueStyle={batch.failedTotal > 0 ? { color: 'var(--ant-color-error)' } : undefined}
            />
            <Statistic
              title={t('system.notificationManagement.stats.read', '已读')}
              value={batch.readTotal}
            />
          </div>
          <TrueAdminCrudTable<AdminNotificationDelivery>
            resource="system.notificationManagement.delivery"
            rowKey="id"
            columns={deliveryColumns}
            service={deliveryService}
            quickSearch={{
              placeholder: t('system.notificationManagement.column.receiver', '接收人'),
            }}
            queryMode="local"
            extraQuery={deliveryExtraQuery}
            toolbarRender={({ query }) => {
              const currentStatus =
                (query.values.status as AdminNotificationDeliveryStatus | undefined) ?? 'all';
              return (
                <TrueAdminQuickFilter<AdminNotificationDeliveryStatus | 'all'>
                  value={currentStatus}
                  items={[
                    { label: t('notification.tab.all', '全部'), value: 'all' },
                    { label: deliveryStatusText.pending, value: 'pending' },
                    { label: deliveryStatusText.sent, value: 'sent' },
                    { label: deliveryStatusText.failed, value: 'failed' },
                    { label: deliveryStatusText.skipped, value: 'skipped' },
                  ]}
                  onChange={(nextStatus) =>
                    query.setValue('status', nextStatus === 'all' ? undefined : nextStatus)
                  }
                />
              );
            }}
            tableProps={{ size: 'middle' }}
            tableScrollX={980}
          />
        </div>
      ) : null}
    </TrueAdminModal>
  );
}
