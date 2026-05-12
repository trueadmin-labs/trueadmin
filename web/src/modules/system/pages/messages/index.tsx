import { Button } from 'antd';
import { TrueAdminCrudPage } from '@/core/crud/TrueAdminCrudPage';
import type { CrudListParams } from '@/core/crud/types';
import { type AdminMessageItem, TrueAdminMessageDetailModal } from '@/core/notification';
import { MessageToolbar } from './MessageToolbar';
import { toMessageRowKey } from './messagePageModel';
import { useMessagesPage } from './useMessagesPage';

export default function AdminMessagesPage() {
  const page = useMessagesPage();

  return (
    <>
      <TrueAdminCrudPage<AdminMessageItem>
        title={page.t('system.messages.title', '消息中心')}
        description={page.t(
          'system.messages.description',
          '查看个人通知和系统公告，处理已读、归档和历史追踪。',
        )}
        resource="system.message"
        rowKey={toMessageRowKey}
        columns={page.columns}
        service={page.service}
        quickSearch={{
          placeholder: page.t('system.messages.keyword.placeholder', '搜索标题 / 内容 / 来源'),
        }}
        filters={page.filters}
        extraQuery={page.extraQuery}
        defaultFiltersExpanded={false}
        transformParams={(params) => ({ kind: 'all', status: 'all', ...params }) as CrudListParams}
        rowActions={{
          render: ({ record }) => (
            <Button
              key="detail"
              size="small"
              type="link"
              onClick={() => page.setDetailMessage(record)}
            >
              {page.t('system.messages.action.detail', '详情')}
            </Button>
          ),
          width: 100,
        }}
        rowSelection={{
          selectedRowKeys: page.selectedRowKeys,
          onChange: (_, rows) => page.setSelectedRows(rows),
        }}
        toolbarRender={({ action, query, selectedRows }) => (
          <MessageToolbar
            action={action}
            query={query}
            selectedRows={selectedRows as AdminMessageItem[]}
            statusText={page.statusText}
            t={page.t}
            unreadCount={page.unreadCount}
            onClearSelection={() => page.setSelectedRows([])}
            onRunBatchAction={(options) => void page.runBatchAction(options)}
          />
        )}
        locale={{
          actionColumnTitle: page.t('crud.column.action', '操作'),
          advancedFilterText: page.t('crud.filter.advanced', '高级筛选'),
          filterResetText: page.t('crud.filter.reset', '重置'),
          filterSearchText: page.t('crud.filter.search', '查询'),
          paginationTotalText: (total) =>
            page.t('crud.pagination.total', '共 {{total}} 条').replace('{{total}}', String(total)),
          quickSearchPlaceholder: page.t(
            'system.messages.keyword.placeholder',
            '搜索标题 / 内容 / 来源',
          ),
          searchText: page.t('crud.action.search', '搜索'),
        }}
        toolbarProps={{
          quickSearchInputProps: { allowClear: true },
          reloadButtonProps: { title: page.t('crud.action.reload', '刷新') },
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
        open={Boolean(page.detailMessage)}
        message={page.detailMessage}
        onClose={page.closeDetail}
      />
    </>
  );
}
