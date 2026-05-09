import { CheckOutlined, InboxOutlined, RollbackOutlined } from '@ant-design/icons';
import { App, Button, Space, Tag, Typography } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud/TrueAdminCrudPage';
import type {
  CrudColumns,
  CrudExtraQuerySchema,
  CrudFilterSchema,
  CrudListParams,
  CrudService,
} from '@/core/crud/types';
import { TrueAdminQuickFilter } from '@/core/filter/TrueAdminQuickFilter';
import { useI18n } from '@/core/i18n/I18nProvider';
import {
  type AdminMessageItem,
  type AdminMessageKind,
  type AdminMessageLevel,
  type AdminMessageReadStatus,
  adminMessageApi,
  getAdminMessageSourceConfig,
  getAdminMessageTypeConfig,
  getRegisteredAdminMessageSources,
  getRegisteredAdminMessageTypes,
  resolveAdminMessageLabel,
  TrueAdminMessageDetailModal,
  useAdminNotificationStore,
} from '@/core/notification';

const levelColor: Record<AdminMessageLevel, string> = {
  error: 'error',
  info: 'processing',
  success: 'success',
  warning: 'warning',
};

const splitRange = (value: unknown) =>
  typeof value === 'string' && value.length > 0 ? value.split(',').filter(Boolean) : [];

const toPlainText = (value?: string) =>
  value
    ?.replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`\-[\]|()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export default function AdminMessagesPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const refreshBell = useAdminNotificationStore((state) => state.refresh);
  const unreadCount = useAdminNotificationStore((state) => state.unreadCount.total);
  const [selectedRows, setSelectedRows] = useState<AdminMessageItem[]>([]);
  const [detailMessage, setDetailMessage] = useState<AdminMessageItem>();

  const kindText = useMemo<Record<AdminMessageKind, string>>(
    () => ({
      announcement: t('notification.kind.announcement', '公告'),
      notification: t('notification.kind.notification', '通知'),
    }),
    [t],
  );

  const statusText = useMemo<Record<AdminMessageReadStatus, string>>(
    () => ({
      all: t('system.messages.status.all', '全部状态'),
      archived: t('system.messages.status.archived', '已归档'),
      read: t('system.messages.status.read', '已读'),
      unread: t('system.messages.status.unread', '未读'),
    }),
    [t],
  );

  const levelText = useMemo<Record<AdminMessageLevel, string>>(
    () => ({
      error: t('system.messages.level.error', '错误'),
      info: t('system.messages.level.info', '提示'),
      success: t('system.messages.level.success', '成功'),
      warning: t('system.messages.level.warning', '警告'),
    }),
    [t],
  );

  const typeOptions = useMemo(
    () =>
      getRegisteredAdminMessageTypes().map((type) => {
        const typeConfig = getAdminMessageTypeConfig(type);
        return {
          label: resolveAdminMessageLabel(typeConfig.label, t, type),
          value: type,
        };
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

  const service = useMemo<CrudService<AdminMessageItem>>(
    () => ({
      list: async (params, options) => adminMessageApi.list(params).send(options?.force),
    }),
    [],
  );

  const extraQuery = useMemo<CrudExtraQuerySchema[]>(() => [{ name: 'status' }], []);

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
        options: [
          { label: levelText.info, value: 'info' },
          { label: levelText.success, value: 'success' },
          { label: levelText.warning, value: 'warning' },
          { label: levelText.error, value: 'error' },
        ],
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
      {
        label: t('notification.detail.createdAt', '时间'),
        name: 'createdAt',
        transform: ({ value }) => {
          const [startAt, endAt] = splitRange(value);
          return { endAt, startAt };
        },
        type: 'dateRange',
      },
    ],
    [kindText, levelText, sourceOptions, t, typeOptions],
  );

  const columns = useMemo<CrudColumns<AdminMessageItem>>(
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
                  <Typography.Text strong={!record.readAt}>{record.title}</Typography.Text>
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
        dataIndex: 'level',
        render: (_, record) => (
          <Tag color={levelColor[record.level]}>{levelText[record.level]}</Tag>
        ),
        title: t('system.messages.column.level', '等级'),
        width: 110,
      },
      {
        dataIndex: 'source',
        render: (_, record) =>
          record.source
            ? resolveAdminMessageLabel(
                getAdminMessageSourceConfig(record.source)?.label,
                t,
                record.source,
              )
            : '-',
        title: t('notification.detail.source', '来源'),
        width: 180,
      },
      {
        dataIndex: 'readAt',
        render: (_, record) =>
          record.readAt ? (
            <Tag>{t('system.messages.status.read', '已读')}</Tag>
          ) : (
            <Tag color="blue">{t('system.messages.status.unread', '未读')}</Tag>
          ),
        title: t('system.messages.column.readStatus', '阅读状态'),
        width: 120,
      },
      {
        dataIndex: 'archivedAt',
        render: (_, record) =>
          record.archivedAt ? <Tag>{t('system.messages.status.archived', '已归档')}</Tag> : '-',
        title: t('system.messages.column.archiveStatus', '归档状态'),
        width: 120,
      },
      {
        dataIndex: 'createdAt',
        sorter: true,
        title: t('notification.detail.createdAt', '时间'),
        width: 180,
      },
    ],
    [levelText, t],
  );

  const refreshAfterAction = useCallback(
    async (reload: () => void) => {
      reload();
      await refreshBell();
    },
    [refreshBell],
  );

  const runBatchAction = useCallback(
    async ({
      action,
      reload,
      successText,
    }: {
      action: () => Promise<unknown>;
      reload: () => void;
      successText: string;
    }) => {
      await action();
      setSelectedRows([]);
      message.success(successText);
      await refreshAfterAction(reload);
    },
    [message, refreshAfterAction],
  );

  const selectedRowKeys = selectedRows.map((row) => [row.kind, row.id].join(':'));

  return (
    <>
      <TrueAdminCrudPage<AdminMessageItem>
        title={t('system.messages.title', '消息中心')}
        description={t(
          'system.messages.description',
          '查看个人通知和系统公告，处理已读、归档和历史追踪。',
        )}
        resource="system.message"
        rowKey={(record) => [record.kind, record.id].join(':')}
        columns={columns}
        service={service}
        quickSearch={{
          placeholder: t('system.messages.keyword.placeholder', '搜索标题 / 内容 / 来源'),
        }}
        filters={filters}
        extraQuery={extraQuery}
        defaultFiltersExpanded={false}
        transformParams={(params) => ({ kind: 'all', status: 'all', ...params }) as CrudListParams}
        rowActions={{
          render: ({ record }) => (
            <Button key="detail" size="small" type="link" onClick={() => setDetailMessage(record)}>
              {t('system.messages.action.detail', '详情')}
            </Button>
          ),
          width: 100,
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        toolbarRender={({ action, query, selectedRows }) => {
          const selectedMessages = selectedRows as AdminMessageItem[];
          const selectedUnreadMessages = selectedMessages.filter((row) => !row.readAt);
          const currentStatus =
            (query.values.status as AdminMessageReadStatus | undefined) ?? 'all';
          const isArchivedView = currentStatus === 'archived';
          const hasSelectedRows = selectedMessages.length > 0;
          return (
            <Space size={8} wrap>
              <TrueAdminQuickFilter<AdminMessageReadStatus>
                value={currentStatus}
                items={[
                  { label: t('notification.tab.all', '全部'), value: 'all' },
                  { count: unreadCount, label: statusText.unread, value: 'unread' },
                  { label: statusText.read, value: 'read' },
                  { label: statusText.archived, value: 'archived' },
                ]}
                onChange={(nextStatus) => {
                  setSelectedRows([]);
                  query.setValue('status', nextStatus === 'all' ? undefined : nextStatus);
                }}
              />
              <Button
                disabled={!hasSelectedRows || selectedUnreadMessages.length === 0 || isArchivedView}
                icon={<CheckOutlined />}
                onClick={() =>
                  void runBatchAction({
                    action: () => adminMessageApi.markRead(selectedUnreadMessages).send(),
                    reload: action.reload,
                    successText: t('system.messages.batch.readSuccess', '已标记为已读'),
                  })
                }
              >
                {t('system.messages.batch.markRead', '标记已读')}
              </Button>
              {isArchivedView ? (
                <Button
                  disabled={!hasSelectedRows}
                  icon={<RollbackOutlined />}
                  onClick={() =>
                    void runBatchAction({
                      action: () => adminMessageApi.restore(selectedMessages).send(),
                      reload: action.reload,
                      successText: t('system.messages.batch.restoreSuccess', '已恢复'),
                    })
                  }
                >
                  {t('system.messages.batch.restore', '恢复')}
                </Button>
              ) : (
                <Button
                  disabled={!hasSelectedRows}
                  icon={<InboxOutlined />}
                  onClick={() =>
                    void runBatchAction({
                      action: () => adminMessageApi.archive(selectedMessages).send(),
                      reload: action.reload,
                      successText: t('system.messages.batch.archiveSuccess', '已归档'),
                    })
                  }
                >
                  {t('system.messages.batch.archive', '归档')}
                </Button>
              )}
            </Space>
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
            'system.messages.keyword.placeholder',
            '搜索标题 / 内容 / 来源',
          ),
          searchText: t('crud.action.search', '搜索'),
        }}
        toolbarProps={{
          quickSearchInputProps: { allowClear: true },
          reloadButtonProps: { title: t('crud.action.reload', '刷新') },
        }}
        filterPanelProps={{
          formProps: { colon: false },
        }}
        tableProps={{
          size: 'middle',
        }}
        paginationProps={{
          showQuickJumper: true,
        }}
        tableScrollX={1280}
      />
      <TrueAdminMessageDetailModal
        open={Boolean(detailMessage)}
        message={detailMessage}
        onClose={() => {
          setDetailMessage(undefined);
          void refreshBell();
        }}
      />
    </>
  );
}
