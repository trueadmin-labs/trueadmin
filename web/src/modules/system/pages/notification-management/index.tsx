import { CloudUploadOutlined } from '@ant-design/icons';
import { App, Button, DatePicker, Form, Input, Select, Space, Switch, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { TrueAdminConfirmAction } from '@/core/action';
import { TrueAdminCrudPage, TrueAdminCrudTable } from '@/core/crud';
import type {
  CrudColumns,
  CrudExtraQuerySchema,
  CrudFilterSchema,
  CrudService,
} from '@/core/crud/types';
import { TrueAdminQuickFilter } from '@/core/filter/TrueAdminQuickFilter';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminModal } from '@/core/modal';
import {
  type AdminMessageKind,
  type AdminMessageLevel,
  type AdminNotificationBatch,
  type AdminNotificationBatchCreatePayload,
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

const levelColor: Record<AdminMessageLevel, string> = {
  error: 'error',
  info: 'processing',
  success: 'success',
  warning: 'warning',
};

const batchStatusColor: Record<AdminNotificationBatchStatus, string> = {
  draft: 'default',
  offline: 'default',
  published: 'success',
  scheduled: 'processing',
};

const deliveryStatusColor: Record<AdminNotificationDeliveryStatus, string> = {
  failed: 'error',
  pending: 'processing',
  sent: 'success',
};

const toPlainText = (value?: string) =>
  value
    ?.replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`\-[\]|()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toMinuteDateTime = (value: AdminNotificationBatchCreatePayload['scheduledAt']) => {
  if (!value) {
    return null;
  }

  return typeof value === 'string' ? value : value.format('YYYY-MM-DD HH:mm');
};

export default function AdminNotificationManagementPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [deliveryBatch, setDeliveryBatch] = useState<AdminNotificationBatch>();
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [form] = Form.useForm<AdminNotificationBatchCreatePayload>();
  const targetType = Form.useWatch('targetType', form);

  const roleOptions = useMemo(
    () => [
      { label: t('system.users.role.superAdmin', '超级管理员'), value: '超级管理员' },
      { label: t('system.users.role.operator', '运营管理员'), value: '运营管理员' },
      { label: t('system.users.role.auditor', '审计员'), value: '审计员' },
    ],
    [t],
  );

  const kindText = useMemo<Record<AdminMessageKind, string>>(
    () => ({
      announcement: t('notification.kind.announcement', '公告'),
      notification: t('notification.kind.notification', '通知'),
    }),
    [t],
  );

  const levelText = useMemo<Record<AdminMessageLevel, string>>(
    () => ({
      error: t('notification.level.error', '错误'),
      info: t('notification.level.info', '提示'),
      success: t('notification.level.success', '成功'),
      warning: t('notification.level.warning', '警告'),
    }),
    [t],
  );

  const batchStatusText = useMemo<Record<AdminNotificationBatchStatus, string>>(
    () => ({
      draft: t('system.notificationManagement.status.draft', '草稿'),
      offline: t('system.notificationManagement.status.offline', '已下线'),
      published: t('system.notificationManagement.status.published', '已发布'),
      scheduled: t('system.notificationManagement.status.scheduled', '定时发布'),
    }),
    [t],
  );

  const deliveryStatusText = useMemo<Record<AdminNotificationDeliveryStatus, string>>(
    () => ({
      failed: t('system.notificationManagement.deliveryStatus.failed', '失败'),
      pending: t('system.notificationManagement.deliveryStatus.pending', '待投递'),
      sent: t('system.notificationManagement.deliveryStatus.sent', '已投递'),
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
        label: t('system.messages.kind.placeholder', '消息分类'),
        name: 'kind',
        options: [
          { label: kindText.notification, value: 'notification' },
          { label: kindText.announcement, value: 'announcement' },
        ],
        placeholder: t('system.messages.kind.placeholder', '消息分类'),
        type: 'select',
      },
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
    [kindText, levelText, sourceOptions, t, typeOptions],
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
      list: async (params) => adminNotificationManagementApi.listBatches(params).send(),
    }),
    [refreshSeed],
  );

  const extraQuery = useMemo<CrudExtraQuerySchema[]>(() => [{ name: 'status' }], []);

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
                <Space size={6} wrap>
                  <Typography.Text strong>{record.title}</Typography.Text>
                  {record.pinned ? (
                    <Tag color="gold">{t('notification.pinned', '置顶')}</Tag>
                  ) : null}
                </Space>
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
          <Tag color={batchStatusColor[record.status]}>{batchStatusText[record.status]}</Tag>
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
        dataIndex: 'operatorName',
        title: t('system.notificationManagement.column.operator', '操作人'),
        width: 130,
      },
      {
        dataIndex: 'publishedAt',
        render: (_, record) => record.publishedAt ?? record.scheduledAt ?? '-',
        sorter: true,
        title: t('system.notificationManagement.column.publishedAt', '发布时间'),
        width: 180,
      },
    ],
    [batchStatusText, levelText, t, targetTypeText],
  );

  const submitAnnouncement = async () => {
    const values = await form.validateFields();
    await adminNotificationManagementApi
      .createAnnouncement({
        ...values,
        scheduledAt: toMinuteDateTime(values.scheduledAt),
      })
      .send();
    message.success(t('system.notificationManagement.success.createAnnouncement', '公告已创建'));
    closeAnnouncementModal();
    setRefreshSeed((seed) => seed + 1);
  };

  const closeAnnouncementModal = () => {
    setAnnouncementOpen(false);
    form.resetFields();
  };

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
          '管理通知批次、公告发布和管理员投递记录。',
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
        extraQuery={extraQuery}
        extra={
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={() => setAnnouncementOpen(true)}
          >
            {t('system.notificationManagement.action.createAnnouncement', '发布公告')}
          </Button>
        }
        rowActions={{
          width: 220,
          render: ({ record, action }) => (
            <Space size={4} wrap>
              <Button size="small" type="link" onClick={() => setDeliveryBatch(record)}>
                {t('system.notificationManagement.action.deliveries', '投递记录')}
              </Button>
              {record.status !== 'published' ? (
                <TrueAdminConfirmAction
                  size="small"
                  type="link"
                  confirm={t(
                    'system.notificationManagement.confirm.publish',
                    '确认发布该通知批次吗？',
                  )}
                  successMessage={t(
                    'system.notificationManagement.success.publish',
                    '通知批次已发布',
                  )}
                  action={async () => {
                    await adminNotificationManagementApi.publishBatch(record.id).send();
                    action.reload();
                  }}
                >
                  {t('system.notificationManagement.action.publish', '发布')}
                </TrueAdminConfirmAction>
              ) : null}
              {record.status === 'published' ? (
                <TrueAdminConfirmAction
                  danger
                  size="small"
                  type="link"
                  confirm={t(
                    'system.notificationManagement.confirm.offline',
                    '确认下线该通知批次吗？',
                  )}
                  successMessage={t(
                    'system.notificationManagement.success.offline',
                    '通知批次已下线',
                  )}
                  action={async () => {
                    await adminNotificationManagementApi.offlineBatch(record.id).send();
                    action.reload();
                  }}
                >
                  {t('system.notificationManagement.action.offline', '下线')}
                </TrueAdminConfirmAction>
              ) : null}
            </Space>
          ),
        }}
        toolbarRender={({ query, response }) => {
          const currentStatus =
            (query.values.status as AdminNotificationBatchStatus | undefined) ?? 'all';
          const scheduledCount = response?.meta?.statusStats?.scheduled ?? 0;
          return (
            <TrueAdminQuickFilter<AdminNotificationBatchStatus | 'all'>
              value={currentStatus}
              items={[
                { label: t('notification.tab.all', '全部'), value: 'all' },
                { label: batchStatusText.draft, value: 'draft' },
                { count: scheduledCount, label: batchStatusText.scheduled, value: 'scheduled' },
                { label: batchStatusText.published, value: 'published' },
                { label: batchStatusText.offline, value: 'offline' },
              ]}
              onChange={(nextStatus) => {
                query.setValue('status', nextStatus === 'all' ? undefined : nextStatus);
              }}
            />
          );
        }}
        locale={{
          actionColumnTitle: t('crud.column.action', '操作'),
          advancedFilterText: t('crud.filter.advanced', '高级筛选'),
          filterResetText: t('crud.filter.reset', '重置'),
          filterSearchText: t('crud.filter.search', '查询'),
          paginationTotalText: (total) =>
            t('crud.pagination.total', '共 {{total}} 条').replace('{{total}}', String(total)),
          quickSearchPlaceholder: t(
            'system.notificationManagement.keyword.placeholder',
            '搜索标题 / 内容 / 操作人',
          ),
          searchText: t('crud.action.search', '搜索'),
        }}
        toolbarProps={{
          quickSearchInputProps: { allowClear: true },
          reloadButtonProps: { title: t('crud.action.reload', '刷新') },
        }}
        tableProps={{ size: 'middle' }}
        paginationProps={{ showQuickJumper: true }}
        tableScrollX={1320}
      />

      <TrueAdminModal
        destroyOnHidden
        open={announcementOpen}
        title={t('system.notificationManagement.modal.createAnnouncement', '发布公告')}
        width={760}
        footer={
          <Space>
            <Button onClick={closeAnnouncementModal}>{t('modal.action.close', '关闭')}</Button>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() => void submitAnnouncement()}
            >
              {t('system.notificationManagement.action.createAnnouncement', '发布公告')}
            </Button>
          </Space>
        }
        onCancel={closeAnnouncementModal}
      >
        <Form<AdminNotificationBatchCreatePayload>
          form={form}
          layout="vertical"
          initialValues={{ level: 'info', pinned: false, targetType: 'all', type: 'announcement' }}
        >
          <Form.Item
            label={t('system.notificationManagement.form.title', '公告标题')}
            name="title"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t('system.notificationManagement.form.content', '公告正文')}
            name="content"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={6} />
          </Form.Item>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item
              label={t('system.notificationManagement.form.level', '公告等级')}
              name="level"
            >
              <Select
                style={{ width: 160 }}
                options={Object.entries(levelText).map(([value, label]) => ({ label, value }))}
              />
            </Form.Item>
            <Form.Item label={t('system.notificationManagement.form.type', '消息类型')} name="type">
              <Select style={{ width: 180 }} options={typeOptions} />
            </Form.Item>
            <Form.Item
              label={t('system.notificationManagement.form.targetType', '接收范围')}
              name="targetType"
            >
              <Select
                style={{ width: 180 }}
                options={[
                  { label: targetTypeText.all, value: 'all' },
                  { label: targetTypeText.role, value: 'role' },
                ]}
              />
            </Form.Item>
          </Space>
          {targetType === 'role' ? (
            <Form.Item
              label={t('system.notificationManagement.form.targetRoleIds', '目标角色')}
              name="targetRoleIds"
              rules={[{ required: true }]}
            >
              <Select mode="multiple" options={roleOptions} />
            </Form.Item>
          ) : null}
          <Form.Item
            label={t('system.notificationManagement.form.pinned', '置顶公告')}
            name="pinned"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label={t('system.notificationManagement.form.scheduledAt', '定时发布时间')}
            name="scheduledAt"
          >
            <DatePicker
              format="YYYY-MM-DD HH:mm"
              showTime={{ format: 'HH:mm' }}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </TrueAdminModal>

      <DeliveryRecordsModal
        batch={deliveryBatch}
        deliveryStatusText={deliveryStatusText}
        onClose={() => setDeliveryBatch(undefined)}
      />
    </>
  );
}

type DeliveryRecordsModalProps = {
  batch?: AdminNotificationBatch;
  deliveryStatusText: Record<AdminNotificationDeliveryStatus, string>;
  onClose: () => void;
};

function DeliveryRecordsModal({ batch, deliveryStatusText, onClose }: DeliveryRecordsModalProps) {
  const { t } = useI18n();
  const deliveryService = useMemo<CrudService<AdminNotificationDelivery>>(
    () => ({
      list: async (params) =>
        batch
          ? adminNotificationManagementApi.listDeliveries(batch.id, params).send()
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
      {
        dataIndex: 'updatedAt',
        title: t('notification.detail.createdAt', '时间'),
        width: 180,
      },
    ],
    [deliveryStatusText, t],
  );

  return (
    <TrueAdminModal
      destroyOnHidden
      open={Boolean(batch)}
      title={
        batch
          ? `${t('system.notificationManagement.modal.deliveries', '投递记录')} - ${batch.title}`
          : ''
      }
      width={980}
      footer={<Button onClick={onClose}>{t('modal.action.close', '关闭')}</Button>}
      onCancel={onClose}
    >
      {batch ? (
        <TrueAdminCrudTable<AdminNotificationDelivery>
          resource="system.notificationManagement.delivery"
          rowKey="id"
          columns={deliveryColumns}
          service={deliveryService}
          quickSearch={{
            placeholder: t('system.notificationManagement.column.receiver', '接收人'),
          }}
          filters={[
            {
              label: t('system.notificationManagement.column.deliveryStatus', '投递状态'),
              name: 'status',
              options: Object.entries(deliveryStatusText).map(([value, label]) => ({
                label,
                value,
              })),
              type: 'select',
            },
          ]}
          rowActions={{
            width: 100,
            render: ({ record, action }) =>
              record.status === 'failed' ? (
                <TrueAdminConfirmAction
                  size="small"
                  type="link"
                  confirm={t(
                    'system.notificationManagement.confirm.resend',
                    '确认重发该投递记录吗？',
                  )}
                  successMessage={t(
                    'system.notificationManagement.success.resend',
                    '投递记录已重发',
                  )}
                  action={async () => {
                    await adminNotificationManagementApi.resendDelivery(batch.id, record.id).send();
                    action.reload();
                  }}
                >
                  {t('system.notificationManagement.action.resend', '重发')}
                </TrueAdminConfirmAction>
              ) : null,
          }}
          locale={{
            actionColumnTitle: t('crud.column.action', '操作'),
            advancedFilterText: t('crud.filter.advanced', '高级筛选'),
            filterResetText: t('crud.filter.reset', '重置'),
            filterSearchText: t('crud.filter.search', '查询'),
            paginationTotalText: (total) =>
              t('crud.pagination.total', '共 {{total}} 条').replace('{{total}}', String(total)),
            searchText: t('crud.action.search', '搜索'),
          }}
          tableProps={{ size: 'middle' }}
          tableScrollX={980}
        />
      ) : null}
    </TrueAdminModal>
  );
}
