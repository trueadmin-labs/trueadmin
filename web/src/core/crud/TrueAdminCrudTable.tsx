import type { TableProps } from 'antd';
import { App, Button, Card, Empty, Pagination, Popconfirm, Result, Table, Typography } from 'antd';
import type { SorterResult, TablePaginationConfig } from 'antd/es/table/interface';
import type { Key } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Permission } from '@/core/auth/Permission';
import { errorCenter } from '@/core/error/errorCenter';
import { useI18n } from '@/core/i18n/I18nProvider';
import {
  getColumnSortKey,
  getSorterKey,
  getSorterResult,
  toCrudOrder,
  toPermissionCode,
} from './crudTableUtils';
import { TrueAdminImportModal } from './TrueAdminImportModal';
import { TrueAdminTableFilterPanel } from './TrueAdminTableFilterPanel';
import { TrueAdminTableToolbar } from './TrueAdminTableToolbar';
import type { CrudColumns, CrudImportConfig, TrueAdminCrudTableProps } from './types';
import { useCrudTableData } from './useCrudTableData';
import { useCrudTableLayout } from './useCrudTableLayout';
import { useCrudTableQueryState } from './useCrudTableQueryState';

const DEFAULT_PAGE_SIZE = 20;

type RowSelectionOnChange<TRecord extends Record<string, unknown>> = NonNullable<
  NonNullable<TableProps<TRecord>['rowSelection']>['onChange']
>;

export function TrueAdminCrudTable<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({
  defaultFiltersExpanded,
  filters = [],
  quickSearch,
  resource,
  rowKey,
  columns,
  service,
  beforeRequest,
  transformParams,
  transformResponse,
  onLoadSuccess,
  onLoadError,
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
  emptyRender,
  errorRender,
  toolbarRender,
  toolbarExtraRender,
  summaryRender,
  tableExtraRender,
  tableViewRender,
  tableRender,
  tableAlertRender,
  tableAlertOptionRender,
  rowActions,
  importExport,
  rowSelection,
  tableScrollX,
}: Pick<
  TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>,
  | 'defaultFiltersExpanded'
  | 'filters'
  | 'quickSearch'
  | 'resource'
  | 'rowKey'
  | 'columns'
  | 'service'
  | 'beforeRequest'
  | 'transformParams'
  | 'transformResponse'
  | 'onLoadSuccess'
  | 'onLoadError'
  | 'onCreateSuccess'
  | 'onUpdateSuccess'
  | 'onDeleteSuccess'
  | 'emptyRender'
  | 'errorRender'
  | 'toolbarRender'
  | 'toolbarExtraRender'
  | 'summaryRender'
  | 'tableExtraRender'
  | 'tableViewRender'
  | 'tableRender'
  | 'tableAlertRender'
  | 'tableAlertOptionRender'
  | 'rowActions'
  | 'importExport'
  | 'rowSelection'
  | 'tableScrollX'
>) {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [filtersExpanded, setFiltersExpanded] = useState(defaultFiltersExpanded ?? false);
  const [innerSelectedRowKeys, setInnerSelectedRowKeys] = useState<Key[]>([]);
  const [innerSelectedRows, setInnerSelectedRows] = useState<TRecord[]>([]);
  const [queryResetSeed, setQueryResetSeed] = useState(0);
  const [importModalConfig, setImportModalConfig] = useState<
    CrudImportConfig<TRecord, TMeta, TCreate, TUpdate> | undefined
  >();
  const queryState = useCrudTableQueryState({
    filters,
    quickSearch,
    defaultPageSize: DEFAULT_PAGE_SIZE,
  });
  const hasFilters = filters.length > 0;
  const selectedRowKeys = rowSelection?.selectedRowKeys ?? innerSelectedRowKeys;
  const selectedRows = rowSelection ? innerSelectedRows : [];
  const selectedCount = rowSelection ? selectedRowKeys.length : 0;
  const hasSelectedStatus = Boolean(
    rowSelection && selectedCount > 0 && tableAlertRender !== false,
  );
  const clearSelected = useCallback(() => {
    setInnerSelectedRowKeys([]);
    setInnerSelectedRows([]);
    rowSelection?.onChange?.([], [], { type: 'none' } as Parameters<
      RowSelectionOnChange<TRecord>
    >[2]);
  }, [rowSelection]);

  const { action, dataSource, deleteRecord, error, loading, reload, response, total } =
    useCrudTableData<TRecord, TCreate, TUpdate, TMeta>({
      beforeRequest,
      clearSelected,
      onCreateSuccess,
      onDeleteSuccess,
      onLoadError,
      onLoadSuccess,
      onUpdateSuccess,
      requestParams: queryState.requestParams,
      resource,
      service,
      transformParams,
      transformResponse,
    });

  const {
    beginFilterPanelTransition,
    finishFilterPanelTransition,
    tableBodyScrollY,
    tableMainRef,
    tableMainStyle,
  } = useCrudTableLayout({ dataSourceLength: dataSource.length });

  const toggleFiltersExpanded = useCallback(() => {
    beginFilterPanelTransition(() => setFiltersExpanded((value) => !value));
  }, [beginFilterPanelTransition]);

  const tableRenderContext = useMemo(
    () => ({
      action,
      dataSource,
      error,
      loading,
      response,
      selectedRowKeys,
      selectedRows,
      total,
    }),
    [action, dataSource, error, loading, response, selectedRowKeys, selectedRows, total],
  );

  const getRecordKey = useCallback(
    (record: TRecord) => {
      if (typeof rowKey === 'function') {
        return rowKey(record);
      }
      return record[(rowKey ?? 'id') as keyof TRecord] as Key;
    },
    [rowKey],
  );

  const operationColumn = useMemo<CrudColumns<TRecord>>(
    () =>
      rowActions !== false && (service.delete || rowActions?.render)
        ? [
            {
              title: rowActions?.title ?? t('crud.column.action', '操作'),
              key: '__actions',
              fixed: 'right',
              width: rowActions?.width ?? 120,
              render: (_, record) => (
                <>
                  {rowActions?.render?.({ ...tableRenderContext, record })}
                  {service.delete && rowActions?.delete !== false ? (
                    <Permission code={toPermissionCode(resource, 'delete')}>
                      <Popconfirm
                        title={t('crud.action.deleteConfirm', '确认删除这条记录吗？')}
                        onConfirm={async () => {
                          try {
                            await deleteRecord(getRecordKey(record));
                            if (!onDeleteSuccess) {
                              message.success(t('crud.action.deleteSuccess', '删除成功'));
                            }
                          } catch (error) {
                            errorCenter.emit(error);
                          }
                        }}
                      >
                        <Button danger type="link" size="small">
                          {t('crud.action.delete', '删除')}
                        </Button>
                      </Popconfirm>
                    </Permission>
                  ) : null}
                </>
              ),
            },
          ]
        : [],
    [
      deleteRecord,
      getRecordKey,
      message,
      onDeleteSuccess,
      resource,
      rowActions,
      service.delete,
      t,
      tableRenderContext,
    ],
  );

  const mergedColumns = useMemo<CrudColumns<TRecord>>(() => {
    const merged = [...columns, ...operationColumn];
    return merged.map((column) => {
      const sortKey = getColumnSortKey(column);
      if (!sortKey || !column.sorter) {
        return column;
      }
      return {
        ...column,
        sortOrder:
          queryState.sort === sortKey && queryState.order
            ? queryState.order === 'asc'
              ? 'ascend'
              : 'descend'
            : undefined,
      };
    });
  }, [columns, operationColumn, queryState.order, queryState.sort]);

  const toolbarTitle = toolbarRender?.(tableRenderContext) ?? null;
  const toolbarExtra = toolbarExtraRender?.(tableRenderContext) ?? null;

  const handleTableChange = (
    _pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<TRecord> | SorterResult<TRecord>[],
  ) => {
    const sorterResult = getSorterResult(sorter);
    queryState.changeSort(
      sorterResult ? getSorterKey(sorterResult) : undefined,
      toCrudOrder(sorterResult?.order),
    );
  };

  const mergedRowSelection = rowSelection
    ? {
        ...rowSelection,
        selectedRowKeys,
        onChange: (
          keys: Key[],
          rows: TRecord[],
          info: Parameters<RowSelectionOnChange<TRecord>>[2],
        ) => {
          setInnerSelectedRowKeys(keys);
          setInnerSelectedRows(rows);
          rowSelection.onChange?.(keys, rows, info);
        },
      }
    : undefined;

  const resetQuery = useCallback(() => {
    queryState.resetFilters();
    setQueryResetSeed((seed) => seed + 1);
  }, [queryState]);

  const searchDom = hasFilters ? (
    <TrueAdminTableFilterPanel
      expanded={filtersExpanded}
      filters={filters}
      values={queryState.values}
      onReset={resetQuery}
      onSubmit={queryState.submitFilters}
      onTransitionEnd={finishFilterPanelTransition}
    />
  ) : null;

  const summaryDom = summaryRender ? (
    <div className="trueadmin-crud-table-summary">{summaryRender(tableRenderContext)}</div>
  ) : null;

  const extraDom = tableExtraRender ? (
    <div className="trueadmin-crud-table-extra">{tableExtraRender(tableRenderContext)}</div>
  ) : null;

  const toolbarDom = (
    <div className="trueadmin-crud-table-toolbar">
      <div className="trueadmin-crud-table-toolbar-left">{toolbarTitle}</div>
      <div className="trueadmin-crud-table-toolbar-right">
        <TrueAdminTableToolbar
          activeFilterCount={queryState.activeFilterCount}
          filtersExpanded={filtersExpanded}
          hasFilters={hasFilters}
          loading={loading}
          extra={toolbarExtra}
          importExport={importExport as never}
          renderContext={tableRenderContext as never}
          selectedCount={selectedCount}
          t={t}
          quickSearch={quickSearch}
          quickSearchName={queryState.quickSearchName}
          quickSearchResetSeed={queryResetSeed}
          quickSearchValue={
            queryState.quickSearchName ? queryState.values[queryState.quickSearchName] : undefined
          }
          onOpenImport={(config) =>
            setImportModalConfig(config as CrudImportConfig<TRecord, TMeta, TCreate, TUpdate>)
          }
          onClearQuickSearch={queryState.clearQuickSearch}
          onReload={reload}
          onSubmitQuickSearch={queryState.submitQuickSearch}
          onToggleFilters={toggleFiltersExpanded}
        />
      </div>
    </div>
  );

  const selectedStatusContent = tableAlertRender ? (
    tableAlertRender(tableRenderContext)
  ) : (
    <Typography.Text type="secondary">
      {t('crud.selection.count', '已选择 {{count}} 项').replace('{{count}}', String(selectedCount))}
    </Typography.Text>
  );
  const selectedStatusOptionContent = tableAlertOptionRender ? (
    tableAlertOptionRender(tableRenderContext)
  ) : (
    <Button type="link" size="small" onClick={clearSelected}>
      {t('crud.selection.clear', '清空')}
    </Button>
  );
  const selectedStatusDom = hasSelectedStatus ? (
    <div className="trueadmin-crud-table-selected-status">
      <div className="trueadmin-crud-table-selected-status-content">{selectedStatusContent}</div>
      {tableAlertOptionRender !== false ? (
        <div className="trueadmin-crud-table-selected-status-options">
          {selectedStatusOptionContent}
        </div>
      ) : null}
    </div>
  ) : null;

  const emptyContent = emptyRender?.(tableRenderContext) ?? (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
  );
  const tableDom = error ? (
    (errorRender?.(tableRenderContext) ?? (
      <Result
        status="error"
        title={t('crud.error.loadFailed', '数据加载失败')}
        subTitle={t('crud.error.loadFailedDescription', '请稍后重试或联系管理员。')}
        extra={
          <Button type="primary" onClick={reload}>
            {t('crud.action.reload', '刷新')}
          </Button>
        }
      />
    ))
  ) : (
    <Table<TRecord>
      rowKey={rowKey as TableProps<TRecord>['rowKey']}
      columns={mergedColumns}
      dataSource={dataSource}
      loading={loading}
      locale={{ emptyText: emptyContent }}
      pagination={false}
      rowSelection={mergedRowSelection}
      scroll={{ x: tableScrollX, y: tableBodyScrollY }}
      onChange={handleTableChange}
    />
  );
  const tableViewDom = tableViewRender ? tableViewRender(tableRenderContext, tableDom) : tableDom;
  const paginationDom = (
    <div className="trueadmin-crud-table-pagination">
      <div className="trueadmin-crud-table-pagination-left">{selectedStatusDom}</div>
      <div className="trueadmin-crud-table-pagination-right">
        <Pagination
          current={queryState.current}
          pageSize={queryState.pageSize}
          total={total}
          showSizeChanger
          showTotal={(nextTotal) =>
            t('crud.pagination.total', '共 {{total}} 条').replace('{{total}}', String(nextTotal))
          }
          onChange={(current, pageSize) => queryState.changePage(current, pageSize)}
        />
      </div>
    </div>
  );
  const tableAreaDom = (
    <Card className="trueadmin-crud-table-card" styles={{ body: { padding: 0 } }}>
      {toolbarDom}
      <div ref={tableMainRef} className="trueadmin-crud-table-main" style={tableMainStyle}>
        {tableViewDom}
      </div>
      {paginationDom}
    </Card>
  );
  const domList = {
    alert: selectedStatusDom,
    extra: extraDom,
    pagination: paginationDom,
    search: searchDom,
    summary: summaryDom,
    table: tableViewDom,
    toolbar: toolbarDom,
  };
  const defaultDom = (
    <div className="trueadmin-crud-shell">
      {summaryDom}
      {searchDom}
      {extraDom}
      {tableAreaDom}
    </div>
  );

  const contentDom = tableRender
    ? tableRender(tableRenderContext, defaultDom, domList)
    : defaultDom;

  return (
    <>
      {contentDom}
      <TrueAdminImportModal
        config={importModalConfig as never}
        context={tableRenderContext as never}
        open={Boolean(importModalConfig)}
        t={t}
        onClose={() => setImportModalConfig(undefined)}
      />
    </>
  );
}
