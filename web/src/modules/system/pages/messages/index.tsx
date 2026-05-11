import { App, Button } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud/TrueAdminCrudPage';
import type {
  CrudExtraQuerySchema,
  CrudFilterSchema,
  CrudListParams,
  CrudService,
} from '@/core/crud/types';
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
import { createMessageColumns } from './MessageTableColumns';
import { MessageToolbar } from './MessageToolbar';
import { splitRange, toMessageRowKey } from './messagePageModel';

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
        requestMode: 'param',
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
        requestMode: 'param',
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
        requestMode: 'param',
        options: typeOptions,
        placeholder: t('system.messages.type.placeholder', '消息类型'),
        type: 'select',
      },
      {
        label: t('notification.detail.source', '来源'),
        name: 'source',
        requestMode: 'param',
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

  const columns = useMemo(() => createMessageColumns({ levelText, t }), [levelText, t]);

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

  const selectedRowKeys = selectedRows.map(toMessageRowKey);

  return (
    <>
      <TrueAdminCrudPage<AdminMessageItem>
        title={t('system.messages.title', '消息中心')}
        description={t(
          'system.messages.description',
          '查看个人通知和系统公告，处理已读、归档和历史追踪。',
        )}
        resource="system.message"
        rowKey={toMessageRowKey}
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
        toolbarRender={({ action, query, selectedRows }) => (
          <MessageToolbar
            action={action}
            query={query}
            selectedRows={selectedRows as AdminMessageItem[]}
            statusText={statusText}
            t={t}
            unreadCount={unreadCount}
            onClearSelection={() => setSelectedRows([])}
            onRunBatchAction={(options) => void runBatchAction(options)}
          />
        )}
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
