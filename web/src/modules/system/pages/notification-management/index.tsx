import { RedoOutlined } from '@ant-design/icons';
import { App, Button, Collapse, Descriptions, Space, Statistic, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { TrueAdminConfirmAction } from '@/core/action';
import { TrueAdminCrudPage, TrueAdminCrudTable } from '@/core/crud';
import type { CrudColumns, CrudExtraQuerySchema, CrudFilterSchema, CrudService } from '@/core/crud/types';
import { TrueAdminQuickFilter } from '@/core/filter/TrueAdminQuickFilter';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminMarkdown } from '@/core/markdown';
import { TrueAdminModal } from '@/core/modal';
import {
  type AdminMessageLevel,
  type AdminNotificationBatch,
  type AdminNotificationBatchListMeta,
  type AdminNotificationBatchStatus,
  type AdminNotificationDelivery,
  type AdminNotificationDeliveryStatus,
  type AdminNotificationTargetType,
  adminNotificationManagementApi,
  getAdminMessageSourceConfig,
  getAdminMessageTypeConfig,
  getRegisteredAdminMessageSources,
  getRegisteredAdminMessageTypes,
  resolveAdminMessageLabel,
} from '@/core/notification';
import { TrueAdminAttachmentUpload } from '@/core/upload';

const levelColor: Record<AdminMessageLevel, string> = {
  error: 'error',
  info: 'processing',
  success: 'success',
  warning: 'warning',
};

const batchStatusColor: Record<AdminNotificationBatchStatus, string> = {
  completed: 'success',
  failed: 'error',
  partial_failed: 'warning',
  sending: 'processing',
};

const deliveryStatusColor: Record<AdminNotificationDeliveryStatus, string> = {
  failed: 'error',
  pending: 'processing',
  sent: 'success',
  skipped: 'default',
};

const toPlainText = (value?: string) =>
  value
    ?.replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`\-[\]|()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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

  const service = useMemo<CrudService<AdminNotificationBatch, Partial<AdminNotificationBatch>, Partial<AdminNotificationBatch>, AdminNotificationBatchListMeta>>(
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
                {summary ? <Typography.Text type="secondary" ellipsis>{summary}</Typography.Text> : null}
              </Space>
            </div>
          );
        },
        title: t('system.messages.column.title', '消息'),
        width: 560,
      },
      {
        dataIndex: 'status',
        render: (_, record) => <Tag color={batchStatusColor[record.status]}>{statusText[record.status]}</Tag>,
        title: t('system.notificationManagement.column.status', '批次状态'),
        width: 120,
      },
      {
        dataIndex: 'level',
        render: (_, record) => <Tag color={levelColor[record.level]}>{levelText[record.level]}</Tag>,
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
            {record.failedTotal > 0 ? <Typography.Text type="danger"> · {record.failedTotal}</Typography.Text> : null}
          </Typography.Text>
        ),
        title: t('system.notificationManagement.column.delivery', '投递概况'),
        width: 120,
      },
      {
        dataIndex: 'source',
        render: (_, record) => resolveAdminMessageLabel(getAdminMessageSourceConfig(record.source)?.label, t, record.source),
        title: t('notification.detail.source', '来源'),
        width: 160,
      },
      {
        dataIndex: 'createdAt',
        sorter: true,
        title: t('notification.detail.createdAt', '时间'),
        width: 180,
      },
    ],
    [levelText, statusText, t, targetTypeText],
  );

  return (
    <>
      <TrueAdminCrudPage<AdminNotificationBatch, Partial<AdminNotificationBatch>, Partial<AdminNotificationBatch>, AdminNotificationBatchListMeta>
        title={t('system.notificationManagement.title', '通知管理')}
        description={t('system.notificationManagement.description', '查看通知批次、投递记录和失败重发。')}
        resource="system.notificationManagement"
        rowKey="id"
        columns={columns}
        service={service}
        quickSearch={{ placeholder: t('system.notificationManagement.keyword.placeholder', '搜索标题 / 内容 / 操作人') }}
        filters={filters}
        extraQuery={useMemo<CrudExtraQuerySchema[]>(() => [{ name: 'status' }], [])}
        rowActions={{
          width: 190,
          render: ({ record, action }) => (
            <Space size={4} wrap>
              <Button size="small" type="link" onClick={() => { setDetail(record); setDetailOpen(true); }}>{t('system.notificationManagement.action.detail', '详情')}</Button>
              <Button size="small" type="link" onClick={() => { setDeliveryBatch(record); setDeliveryOpen(true); }}>{t('system.notificationManagement.action.deliveries', '投递记录')}</Button>
              {record.failedTotal > 0 ? (
                <TrueAdminConfirmAction size="small" type="link" icon={<RedoOutlined />} confirm={t('system.notificationManagement.confirm.resend', '确认重发失败投递吗？')} successMessage={t('system.notificationManagement.success.resend', '投递记录已重发')} action={async () => { const result = await adminNotificationManagementApi.resendNotification(record.id).send(); message.success(t('system.notificationManagement.success.resendCount', '已重发 {{count}} 条').replace('{{count}}', String(result.resent))); action.reload(); setRefreshSeed((seed) => seed + 1); }}>
                  {t('system.notificationManagement.action.resend', '重发')}
                </TrueAdminConfirmAction>
              ) : null}
            </Space>
          ),
        }}
        toolbarRender={({ query }) => {
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
              onChange={(nextStatus) => query.setValue('status', nextStatus === 'all' ? undefined : nextStatus)}
            />
          );
        }}
        tableProps={{ size: 'middle' }}
        paginationProps={{ showQuickJumper: true }}
        tableScrollX={1320}
      />

      <NotificationDetailModal open={detailOpen} batch={detail} statusText={statusText} levelText={levelText} targetTypeText={targetTypeText} onClose={() => setDetailOpen(false)} afterOpenChange={(nextOpen) => { if (!nextOpen) { setDetail(undefined); } }} />
      <DeliveryRecordsModal open={deliveryOpen} batch={deliveryBatch} deliveryStatusText={deliveryStatusText} onClose={() => setDeliveryOpen(false)} afterOpenChange={(nextOpen) => { if (!nextOpen) { setDeliveryBatch(undefined); } }} />
    </>
  );
}

type NotificationDetailModalProps = {
  open: boolean;
  batch?: AdminNotificationBatch;
  statusText: Record<AdminNotificationBatchStatus, string>;
  levelText: Record<AdminMessageLevel, string>;
  targetTypeText: Record<AdminNotificationTargetType, string>;
  onClose: () => void;
  afterOpenChange?: (open: boolean) => void;
};

function NotificationDetailModal({ open, batch, statusText, levelText, targetTypeText, onClose, afterOpenChange }: NotificationDetailModalProps) {
  const { t } = useI18n();
  const typeConfig = batch ? getAdminMessageTypeConfig(batch.type) : undefined;
  return (
    <TrueAdminModal destroyOnHidden open={open} title={batch?.title ?? ''} width={920} footer={<Button onClick={onClose}>{t('modal.action.close', '关闭')}</Button>} onCancel={onClose} afterOpenChange={afterOpenChange}>
      {batch && typeConfig ? (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Space size={8} wrap>
          <Tag color={batchStatusColor[batch.status]}>{statusText[batch.status]}</Tag>
          <Tag color={typeConfig.color}>{resolveAdminMessageLabel(typeConfig.label, t, batch.type)}</Tag>
          <Tag color={levelColor[batch.level]}>{levelText[batch.level]}</Tag>
        </Space>
        <Descriptions size="small" column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label={t('notification.detail.source', '来源')}>{resolveAdminMessageLabel(getAdminMessageSourceConfig(batch.source)?.label, t, batch.source)}</Descriptions.Item>
          <Descriptions.Item label={t('system.notificationManagement.column.target', '接收范围')}>{batch.targetSummary} · {targetTypeText[batch.targetType]}</Descriptions.Item>
          <Descriptions.Item label={t('system.notificationManagement.column.delivery', '投递概况')}>{batch.sentTotal}/{batch.deliveryTotal}{batch.failedTotal > 0 ? ` · ${String(batch.failedTotal)}` : ''}</Descriptions.Item>
          <Descriptions.Item label={t('system.notificationManagement.column.operator', '操作人')}>{batch.operatorName ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('notification.detail.createdAt', '时间')}>{batch.createdAt ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('system.notificationManagement.form.expireAt', '过期时间')}>{batch.expireAt ?? '-'}</Descriptions.Item>
        </Descriptions>
        <div className="trueadmin-message-detail-content"><TrueAdminMarkdown value={batch.content} /></div>
        {batch.attachments?.length ? <TrueAdminAttachmentUpload readonly value={batch.attachments} /> : null}
        {batch.payload && Object.keys(batch.payload).length > 0 ? (
          <Collapse
            className="trueadmin-message-detail-payload"
            ghost
            items={[
              {
                key: 'payload',
                label: t('notification.detail.payload', '扩展数据'),
                children: (
                  <Typography.Paragraph code className="trueadmin-message-detail-payload-code" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(batch.payload, null, 2)}
                  </Typography.Paragraph>
                ),
              },
            ]}
            size="small"
          />
        ) : null}
      </Space>
      ) : null}
    </TrueAdminModal>
  );
}

type DeliveryRecordsModalProps = {
  open: boolean;
  batch?: AdminNotificationBatch;
  deliveryStatusText: Record<AdminNotificationDeliveryStatus, string>;
  onClose: () => void;
  afterOpenChange?: (open: boolean) => void;
};

function DeliveryRecordsModal({ open, batch, deliveryStatusText, onClose, afterOpenChange }: DeliveryRecordsModalProps) {
  const { t } = useI18n();
  const deliveryExtraQuery = useMemo<CrudExtraQuerySchema[]>(() => [{ name: 'status' }], []);
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
      { dataIndex: 'receiverName', title: t('system.notificationManagement.column.receiver', '接收人'), width: 160 },
      { dataIndex: 'status', render: (_, record) => <Tag color={deliveryStatusColor[record.status]}>{deliveryStatusText[record.status]}</Tag>, title: t('system.notificationManagement.column.deliveryStatus', '投递状态'), width: 120 },
      { dataIndex: 'readAt', render: (_, record) => record.readAt ?? '-', title: t('system.notificationManagement.column.readAt', '已读时间'), width: 180 },
      { dataIndex: 'failedReason', render: (_, record) => record.failedReason ?? '-', title: t('system.notificationManagement.column.failedReason', '失败原因'), width: 220 },
      { dataIndex: 'retryCount', title: t('system.notificationManagement.column.retryCount', '重试次数'), width: 100 },
      { dataIndex: 'updatedAt', title: t('notification.detail.createdAt', '时间'), width: 180 },
    ],
    [deliveryStatusText, t],
  );

  return (
    <TrueAdminModal destroyOnHidden className="trueadmin-notification-delivery-modal" open={open} title={batch ? `${t('system.notificationManagement.modal.deliveries', '投递记录')} - ${batch.title}` : ''} width={980} footer={<Button onClick={onClose}>{t('modal.action.close', '关闭')}</Button>} onCancel={onClose} afterOpenChange={afterOpenChange}>
      {batch ? (
        <div className="trueadmin-notification-delivery-modal-body">
          <div className="trueadmin-notification-management-stats">
            <Statistic title={t('system.notificationManagement.stats.total', '总投递')} value={batch.deliveryTotal} />
            <Statistic title={t('system.notificationManagement.stats.sent', '已投递')} value={batch.sentTotal} />
            <Statistic title={t('system.notificationManagement.stats.failed', '失败')} value={batch.failedTotal} valueStyle={batch.failedTotal > 0 ? { color: 'var(--ant-color-error)' } : undefined} />
            <Statistic title={t('system.notificationManagement.stats.read', '已读')} value={batch.readTotal} />
          </div>
          <TrueAdminCrudTable<AdminNotificationDelivery>
            resource="system.notificationManagement.delivery"
            rowKey="id"
            columns={deliveryColumns}
            service={deliveryService}
            quickSearch={{ placeholder: t('system.notificationManagement.column.receiver', '接收人') }}
            queryMode="local"
            extraQuery={deliveryExtraQuery}
            toolbarRender={({ query }) => {
              const currentStatus = (query.values.status as AdminNotificationDeliveryStatus | undefined) ?? 'all';
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
                  onChange={(nextStatus) => query.setValue('status', nextStatus === 'all' ? undefined : nextStatus)}
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
