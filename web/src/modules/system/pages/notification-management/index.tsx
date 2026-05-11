import { RedoOutlined } from '@ant-design/icons';
import { App, Button, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { TrueAdminConfirmAction } from '@/core/action';
import { TrueAdminCrudPage } from '@/core/crud';
import type {
  CrudColumns,
  CrudExtraQuerySchema,
  CrudFilterSchema,
  CrudService,
} from '@/core/crud/types';
import { TrueAdminQuickFilter } from '@/core/filter/TrueAdminQuickFilter';
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
import { batchStatusColor, levelColor, toPlainText } from './notificationManagementModel';

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

  const columns = useMemo<CrudColumns<AdminNotificationBatch>>(
    () => [
      {
        dataIndex: 'title',
        fixed: 'left',
        render: (_, record) => {
          const typeConfig = getAdminMessageTypeConfig(record.type);
          const summary = toPlainText(record.content);
          return (
            <div className="trueadmin-message-cell">
              <div className="trueadmin-message-cell-type">
                <Tag color={typeConfig.color} style={{ marginInlineEnd: 0 }}>
                  {resolveAdminMessageLabel(typeConfig.label, t, record.type)}
                </Tag>
              </div>
              <Space orientation="vertical" size={4} style={{ minWidth: 0 }}>
                <Typography.Text strong>{record.title}</Typography.Text>
                {summary ? (
                  <Typography.Text type="secondary" ellipsis>
                    {summary}
                  </Typography.Text>
                ) : null}
              </Space>
            </div>
          );
        },
        title: t('system.messages.column.title', '消息'),
        width: 560,
      },
      {
        dataIndex: 'status',
        render: (_, record) => (
          <Tag color={batchStatusColor[record.status]}>{statusText[record.status]}</Tag>
        ),
        title: t('system.notificationManagement.column.status', '批次状态'),
        width: 120,
      },
      {
        dataIndex: 'level',
        render: (_, record) => (
          <Tag color={levelColor[record.level]}>{levelText[record.level]}</Tag>
        ),
        title: t('system.messages.column.level', '等级'),
        width: 110,
      },
      {
        dataIndex: 'targetSummary',
        render: (_, record) => (
          <Space orientation="vertical" size={2}>
            <Typography.Text>{record.targetSummary}</Typography.Text>
            <Typography.Text type="secondary">{targetTypeText[record.targetType]}</Typography.Text>
          </Space>
        ),
        title: t('system.notificationManagement.column.target', '接收范围'),
        width: 180,
      },
      {
        dataIndex: 'deliveryTotal',
        render: (_, record) => (
          <Typography.Text>
            {record.sentTotal}/{record.deliveryTotal}
            {record.failedTotal > 0 ? (
              <Typography.Text type="danger"> · {record.failedTotal}</Typography.Text>
            ) : null}
          </Typography.Text>
        ),
        title: t('system.notificationManagement.column.delivery', '投递概况'),
        width: 120,
      },
      {
        dataIndex: 'source',
        render: (_, record) =>
          resolveAdminMessageLabel(
            getAdminMessageSourceConfig(record.source)?.label,
            t,
            record.source,
          ),
        title: t('notification.detail.source', '来源'),
        width: 160,
      },
      {
        dataIndex: 'createdAt',
        key: 'created_at',
        sorter: true,
        title: t('notification.detail.createdAt', '时间'),
        width: 180,
      },
    ],
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
              transform: ({ value }) => ({ filter: { status: value }, op: { status: '=' } }),
            },
          ],
          [],
        )}
        rowActions={{
          width: 190,
          render: ({ record, action }) => (
            <Space size={4} wrap>
              <Button
                size="small"
                type="link"
                onClick={() => {
                  setDetail(record);
                  setDetailOpen(true);
                }}
              >
                {t('system.notificationManagement.action.detail', '详情')}
              </Button>
              <Button
                size="small"
                type="link"
                onClick={() => {
                  setDeliveryBatch(record);
                  setDeliveryOpen(true);
                }}
              >
                {t('system.notificationManagement.action.deliveries', '投递记录')}
              </Button>
              {record.failedTotal > 0 ? (
                <TrueAdminConfirmAction
                  size="small"
                  type="link"
                  icon={<RedoOutlined />}
                  confirm={t(
                    'system.notificationManagement.confirm.resend',
                    '确认重发失败投递吗？',
                  )}
                  successMessage={t(
                    'system.notificationManagement.success.resend',
                    '投递记录已重发',
                  )}
                  action={async () => {
                    const result = await adminNotificationManagementApi
                      .resendNotification(record.id)
                      .send();
                    message.success(
                      t(
                        'system.notificationManagement.success.resendCount',
                        '已重发 {{count}} 条',
                      ).replace('{{count}}', String(result.resent)),
                    );
                    action.reload();
                    setRefreshSeed((seed) => seed + 1);
                  }}
                >
                  {t('system.notificationManagement.action.resend', '重发')}
                </TrueAdminConfirmAction>
              ) : null}
            </Space>
          ),
        }}
        toolbarRender={({ query }) => {
          const currentStatus =
            (query.values.status as AdminNotificationBatchStatus | undefined) ?? 'all';
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
        }}
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
