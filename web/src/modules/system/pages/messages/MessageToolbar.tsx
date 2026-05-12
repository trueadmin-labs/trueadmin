import { CheckOutlined, InboxOutlined, RollbackOutlined } from '@ant-design/icons';
import { TrueAdminQuickFilter } from '@trueadmin/web-antd/filter';
import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Button, Space } from 'antd';
import type { CrudQueryController, CrudTableAction } from '@/core/crud/types';
import {
  type AdminMessageItem,
  type AdminMessageReadStatus,
  adminMessageApi,
} from '@/core/notification';

type MessageToolbarProps = {
  action: CrudTableAction<AdminMessageItem>;
  query: CrudQueryController;
  selectedRows: AdminMessageItem[];
  statusText: Record<AdminMessageReadStatus, string>;
  t: TranslateFunction;
  unreadCount: number;
  onClearSelection: () => void;
  onRunBatchAction: (options: {
    action: () => Promise<unknown>;
    reload: () => void;
    successText: string;
  }) => void;
};

export function MessageToolbar({
  action,
  query,
  selectedRows,
  statusText,
  t,
  unreadCount,
  onClearSelection,
  onRunBatchAction,
}: MessageToolbarProps) {
  const selectedUnreadMessages = selectedRows.filter((row) => !row.readAt);
  const currentStatus = (query.values.status as AdminMessageReadStatus | undefined) ?? 'all';
  const isArchivedView = currentStatus === 'archived';
  const hasSelectedRows = selectedRows.length > 0;

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
          onClearSelection();
          query.setValue('status', nextStatus === 'all' ? undefined : nextStatus);
        }}
      />
      <Button
        disabled={!hasSelectedRows || selectedUnreadMessages.length === 0 || isArchivedView}
        icon={<CheckOutlined />}
        onClick={() =>
          onRunBatchAction({
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
            onRunBatchAction({
              action: () => adminMessageApi.restore(selectedRows).send(),
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
            onRunBatchAction({
              action: () => adminMessageApi.archive(selectedRows).send(),
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
}
