import { App } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import type { CrudExtraQuerySchema, CrudFilterSchema, CrudService } from '@/core/crud/types';
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
  useAdminNotificationStore,
} from '@/core/notification';
import { createMessageColumns } from './MessageTableColumns';
import { toMessageRowKey } from './messagePageModel';

type BatchActionOptions = {
  action: () => Promise<unknown>;
  reload: () => void;
  successText: string;
};

export function useMessagesPage() {
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
    async ({ action, reload, successText }: BatchActionOptions) => {
      await action();
      setSelectedRows([]);
      message.success(successText);
      await refreshAfterAction(reload);
    },
    [message, refreshAfterAction],
  );

  const closeDetail = () => {
    setDetailMessage(undefined);
    void refreshBell();
  };

  return {
    closeDetail,
    columns,
    detailMessage,
    extraQuery,
    filters,
    runBatchAction,
    selectedRowKeys: selectedRows.map(toMessageRowKey),
    selectedRows,
    service,
    setDetailMessage,
    setSelectedRows,
    statusText,
    t,
    unreadCount,
  };
}
