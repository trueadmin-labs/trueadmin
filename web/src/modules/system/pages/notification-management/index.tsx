import { App } from 'antd';
import { useMemo, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud';
import type { CrudExtraQuerySchema, CrudFilterSchema, CrudService } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import {
  type AdminMessageLevel,
  type AdminNotificationBatch,
  type AdminNotificationBatchListMeta,
  type AdminNotificationBatchStatus,
  type AdminNotificationDeliveryStatus,
  type AdminNotificationTargetType,
  adminNotificationManagementApi,
  getAdminMessageSourceConfig,
  getAdminMessageTypeConfig,
  getRegisteredAdminMessageSources,
  getRegisteredAdminMessageTypes,
  resolveAdminMessageLabel,
} from '@/core/notification';
import { DeliveryRecordsModal } from './DeliveryRecordsModal';
import { NotificationDetailModal } from './NotificationDetailModal';
import { NotificationRowActions } from './NotificationRowActions';
import { createNotificationColumns } from './NotificationTableColumns';
import { NotificationToolbar } from './NotificationToolbar';

export default function AdminNotificationManagementPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [detail, setDetail] = useState<AdminNotificationBatch>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [deliveryBatch, setDeliveryBatch] = useState<AdminNotificationBatch>();
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const levelText = useMemo<Record<AdminMessageLevel, string>>(
    () => ({
      error: t('notification.level.error', '错误'),
      info: t('notification.level.info', '提示'),
      success: t('notification.level.success', '成功'),
      warning: t('notification.level.warning', '警告'),
    }),
    [t],
  );

  const statusText = useMemo<Record<AdminNotificationBatchStatus, string>>(
    () => ({
      completed: t('system.notificationManagement.status.completed', '已完成'),
      failed: t('system.notificationManagement.status.failed', '失败'),
      partial_failed: t('system.notificationManagement.status.partialFailed', '部分失败'),
      sending: t('system.notificationManagement.status.sending', '发送中'),
    }),
    [t],
  );

  const deliveryStatusText = useMemo<Record<AdminNotificationDeliveryStatus, string>>(
    () => ({
      failed: t('system.notificationManagement.deliveryStatus.failed', '失败'),
      pending: t('system.notificationManagement.deliveryStatus.pending', '待投递'),
      sent: t('system.notificationManagement.deliveryStatus.sent', '已投递'),
      skipped: t('system.notificationManagement.deliveryStatus.skipped', '已跳过'),
    }),
    [t],
  );

  const targetTypeText = useMemo<Record<AdminNotificationTargetType, string>>(
    () => ({
      all: t('system.notificationManagement.target.all', '全员'),
      role: t('system.notificationManagement.target.role', '指定角色'),
      user: t('system.notificationManagement.target.user', '指定用户'),
    }),
    [t],
  );

  const typeOptions = useMemo(
    () =>
      getRegisteredAdminMessageTypes().map((type) => {
        const config = getAdminMessageTypeConfig(type);
        return { label: resolveAdminMessageLabel(config.label, t, type), value: type };
      }),
    [t],
  );

  const sourceOptions = useMemo(
    () =>
      getRegisteredAdminMessageSources().map((source) => ({
        label: resolveAdminMessageLabel(getAdminMessageSourceConfig(source)?.label, t, source),
        value: source,
      })),
    [t],
  );

  const filters = useMemo<CrudFilterSchema[]>(
    () => [
      {
        label: t('system.messages.level.placeholder', '等级'),
        name: 'level',
        options: Object.entries(levelText).map(([value, label]) => ({ label, value })),
        placeholder: t('system.messages.level.placeholder', '等级'),
        type: 'select',
      },
      {
        label: t('system.messages.type.placeholder', '消息类型'),
        name: 'type',
        options: typeOptions,
        placeholder: t('system.messages.type.placeholder', '消息类型'),
        type: 'select',
      },
      {
        label: t('notification.detail.source', '来源'),
        name: 'source',
        options: sourceOptions,
        placeholder: t('notification.detail.source', '来源'),
        type: 'select',
      },
    ],
    [levelText, sourceOptions, t, typeOptions],
  );

  const service = useMemo<
    CrudService<
      AdminNotificationBatch,
      Partial<AdminNotificationBatch>,
      Partial<AdminNotificationBatch>,
      AdminNotificationBatchListMeta
    >
  >(
    () => ({
      list: async (params, options) =>
        adminNotificationManagementApi.listNotifications(params).send(options?.force),
    }),
    [refreshSeed],
  );

  const columns = useMemo(
    () => createNotificationColumns({ levelText, statusText, targetTypeText, t }),
    [levelText, statusText, t, targetTypeText],
  );

  return (
    <>
      <TrueAdminCrudPage<
        AdminNotificationBatch,
        Partial<AdminNotificationBatch>,
        Partial<AdminNotificationBatch>,
        AdminNotificationBatchListMeta
      >
        title={t('system.notificationManagement.title', '通知管理')}
        description={t(
          'system.notificationManagement.description',
          '查看通知批次、投递记录和失败重发。',
        )}
        resource="system.notificationManagement"
        rowKey="id"
        columns={columns}
        service={service}
        quickSearch={{
          placeholder: t(
            'system.notificationManagement.keyword.placeholder',
            '搜索标题 / 内容 / 操作人',
          ),
        }}
        filters={filters}
        extraQuery={useMemo<CrudExtraQuerySchema[]>(
          () => [
            {
              name: 'status',
              transform: ({ value }) => ({ filters: [{ field: 'status', op: 'eq', value }] }),
            },
          ],
          [],
        )}
        rowActions={{
          width: 190,
          render: ({ record, action }) => (
            <NotificationRowActions
              action={action}
              record={record}
              t={t}
              onOpenDetail={(nextDetail) => {
                setDetail(nextDetail);
                setDetailOpen(true);
              }}
              onOpenDeliveries={(nextDeliveryBatch) => {
                setDeliveryBatch(nextDeliveryBatch);
                setDeliveryOpen(true);
              }}
              onResendSuccess={(resent) => {
                message.success(
                  t(
                    'system.notificationManagement.success.resendCount',
                    '已重发 {{count}} 条',
                  ).replace('{{count}}', String(resent)),
                );
                setRefreshSeed((seed) => seed + 1);
              }}
            />
          ),
        }}
        toolbarRender={({ query }) => (
          <NotificationToolbar query={query} statusText={statusText} t={t} />
        )}
        tableProps={{ size: 'middle' }}
        paginationProps={{ showQuickJumper: true }}
        tableScrollX={1320}
      />

      <NotificationDetailModal
        open={detailOpen}
        batch={detail}
        statusText={statusText}
        levelText={levelText}
        targetTypeText={targetTypeText}
        onClose={() => setDetailOpen(false)}
        afterOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDetail(undefined);
          }
        }}
      />
      <DeliveryRecordsModal
        open={deliveryOpen}
        batch={deliveryBatch}
        deliveryStatusText={deliveryStatusText}
        onClose={() => setDeliveryOpen(false)}
        afterOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeliveryBatch(undefined);
          }
        }}
      />
    </>
  );
}
