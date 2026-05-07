import type { TableProps } from 'antd';
import { App, Button, Card, Pagination, Popconfirm, Table, Typography } from 'antd';
import type { SorterResult, SortOrder, TablePaginationConfig } from 'antd/es/table/interface';
import type { Key } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Permission } from '@/core/auth/Permission';
import { errorCenter } from '@/core/error/errorCenter';
import { TrueAdminTableFilterPanel } from './TrueAdminTableFilterPanel';
import { TrueAdminTableToolbar } from './TrueAdminTableToolbar';
import type { CrudColumns, CrudPageResult, TrueAdminCrudTableProps } from './types';
import { type CrudOrder, useCrudTableQueryState } from './useCrudTableQueryState';

const DEFAULT_PAGE_SIZE = 20;
const TABLE_HEADER_HEIGHT = 55;

const useElementHeight = <TElement extends HTMLElement>() => {
  const ref = useRef<TElement | null>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) {
      return undefined;
    }

    const updateHeight = () => {
      setHeight(Math.floor(node.getBoundingClientRect().height));
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, height] as const;
};

const toPermissionCode = (resource: string, action: string) =>
  `${resource.replaceAll('.', ':')}:${action}`;

const getColumnSortKey = <TRecord extends Record<string, unknown>>(
  column: CrudColumns<TRecord>[number],
) => {
  if (typeof column.key === 'string') {
    return column.key;
  }
  if (!('dataIndex' in column)) {
    return undefined;
  }
  if (typeof column.dataIndex === 'string') {
    return column.dataIndex;
  }
  if (Array.isArray(column.dataIndex)) {
    return column.dataIndex.join('.');
  }
  return undefined;
};

const toCrudOrder = (order: SortOrder | undefined): CrudOrder | undefined => {
  if (order === 'ascend') {
    return 'asc';
  }
  if (order === 'descend') {
    return 'desc';
  }
  return undefined;
};

const getSorterResult = <TRecord extends Record<string, unknown>>(
  sorter: SorterResult<TRecord> | SorterResult<TRecord>[],
) => (Array.isArray(sorter) ? sorter[0] : sorter);

const getSorterKey = <TRecord extends Record<string, unknown>>(sorter: SorterResult<TRecord>) => {
  if (typeof sorter.columnKey === 'string') {
    return sorter.columnKey;
  }
  if (typeof sorter.field === 'string') {
    return sorter.field;
  }
  if (Array.isArray(sorter.field)) {
    return sorter.field.join('.');
  }
  return undefined;
};

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
  toolbarRender,
  summaryRender,
  tableExtraRender,
  tableViewRender,
  tableRender,
  tableAlertRender,
  tableAlertOptionRender,
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
  | 'toolbarRender'
  | 'summaryRender'
  | 'tableExtraRender'
  | 'tableViewRender'
  | 'tableRender'
  | 'tableAlertRender'
  | 'tableAlertOptionRender'
  | 'rowSelection'
  | 'tableScrollX'
>) {
  const { message } = App.useApp();
  const [filtersExpanded, setFiltersExpanded] = useState(defaultFiltersExpanded ?? false);
  const [dataSource, setDataSource] = useState<TRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CrudPageResult<TRecord, TMeta>>();
  const [innerSelectedRowKeys, setInnerSelectedRowKeys] = useState<Key[]>([]);
  const [innerSelectedRows, setInnerSelectedRows] = useState<TRecord[]>([]);
  const reloadSeedRef = useRef(0);
  const [reloadSeed, setReloadSeed] = useState(0);
  const [queryResetSeed, setQueryResetSeed] = useState(0);
  const queryState = useCrudTableQueryState({
    filters,
    quickSearch,
    defaultPageSize: DEFAULT_PAGE_SIZE,
  });
  const [tableMainRef, tableMainHeight] = useElementHeight<HTMLDivElement>();
  const hasFilters = filters.length > 0;
  const selectedRowKeys = rowSelection?.selectedRowKeys ?? innerSelectedRowKeys;
  const selectedRows = rowSelection ? innerSelectedRows : [];
  const selectedCount = rowSelection ? selectedRowKeys.length : 0;
  const hasSelectedStatus = Boolean(
    rowSelection && selectedCount > 0 && tableAlertRender !== false,
  );
  const tableBodyScrollY = Math.max(120, tableMainHeight - TABLE_HEADER_HEIGHT);

  const reload = useCallback(() => {
    reloadSeedRef.current += 1;
    setReloadSeed(reloadSeedRef.current);
  }, []);

  const clearSelected = useCallback(() => {
    setInnerSelectedRowKeys([]);
    setInnerSelectedRows([]);
    rowSelection?.onChange?.([], [], { type: 'none' } as Parameters<
      RowSelectionOnChange<TRecord>
    >[2]);
  }, [rowSelection]);

  const createRecord = useCallback(
    async (payload: TCreate) => {
      if (!service.create) {
        throw new Error('Create service is not configured.');
      }

      const record = await service.create(payload);
      onCreateSuccess?.(record, { payload, resource });
      reload();
      return record;
    },
    [onCreateSuccess, reload, resource, service],
  );

  const updateRecord = useCallback(
    async (id: Key, payload: TUpdate) => {
      if (!service.update) {
        throw new Error('Update service is not configured.');
      }

      const record = await service.update(id, payload);
      onUpdateSuccess?.(record, { id, payload, resource });
      reload();
      return record;
    },
    [onUpdateSuccess, reload, resource, service],
  );

  const deleteRecord = useCallback(
    async (id: Key) => {
      if (!service.delete) {
        throw new Error('Delete service is not configured.');
      }

      const result = await service.delete(id);
      onDeleteSuccess?.(result, { id, resource });
      clearSelected();
      reload();
      return result;
    },
    [clearSelected, onDeleteSuccess, reload, resource, service],
  );

  const action = useMemo(
    () => ({
      clearSelected,
      create: service.create ? createRecord : undefined,
      delete: service.delete ? deleteRecord : undefined,
      reload,
      update: service.update ? updateRecord : undefined,
    }),
    [
      clearSelected,
      createRecord,
      deleteRecord,
      reload,
      service.create,
      service.delete,
      service.update,
      updateRecord,
    ],
  );

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const context = { resource };
      const baseParams = queryState.requestParams;
      let requestParams = baseParams;

      setLoading(true);

      try {
        const beforeResult = await beforeRequest?.(baseParams, context);
        if (cancelled || beforeResult === false) {
          return;
        }

        requestParams = transformParams ? await transformParams(baseParams, context) : baseParams;

        if (cancelled) {
          return;
        }

        const result = await service.list(requestParams);
        if (cancelled) {
          return;
        }

        const loadContext = { params: requestParams, resource };
        const finalResult = transformResponse
          ? await transformResponse(result, loadContext)
          : result;

        if (cancelled) {
          return;
        }

        setDataSource(finalResult.items ?? []);
        setTotal(finalResult.total ?? 0);
        setResponse(finalResult);
        onLoadSuccess?.(finalResult, loadContext);
      } catch (error) {
        if (!cancelled) {
          const shouldSkipGlobalError = onLoadError?.(error, { params: requestParams, resource });
          if (shouldSkipGlobalError !== false) {
            errorCenter.emit(error);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [
    beforeRequest,
    onLoadError,
    onLoadSuccess,
    queryState.requestParams,
    reloadSeed,
    resource,
    service,
    transformParams,
    transformResponse,
  ]);

  const operationColumn = useMemo<CrudColumns<TRecord>>(
    () =>
      service.delete
        ? [
            {
              title: '操作',
              key: '__actions',
              fixed: 'right',
              width: 120,
              render: (_, record) => (
                <Permission code={toPermissionCode(resource, 'delete')}>
                  <Popconfirm
                    title="确认删除这条记录吗？"
                    onConfirm={async () => {
                      try {
                        await deleteRecord(record.id as Key);
                        message.success('删除成功');
                      } catch (error) {
                        errorCenter.emit(error);
                      }
                    }}
                  >
                    <Button danger type="link" size="small">
                      删除
                    </Button>
                  </Popconfirm>
                </Permission>
              ),
            },
          ]
        : [],
    [deleteRecord, message, resource, service.delete],
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

  const tableRenderContext = useMemo(
    () => ({
      action,
      dataSource,
      loading,
      response,
      selectedRowKeys,
      selectedRows,
      total,
    }),
    [action, dataSource, loading, response, selectedRowKeys, selectedRows, total],
  );

  const toolbarTitle = toolbarRender?.(tableRenderContext) ?? null;

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
          quickSearch={quickSearch}
          quickSearchName={queryState.quickSearchName}
          quickSearchResetSeed={queryResetSeed}
          quickSearchValue={
            queryState.quickSearchName ? queryState.values[queryState.quickSearchName] : undefined
          }
          onClearQuickSearch={queryState.clearQuickSearch}
          onReload={reload}
          onSubmitQuickSearch={queryState.submitQuickSearch}
          onToggleFilters={() => setFiltersExpanded((value) => !value)}
        />
      </div>
    </div>
  );

  const selectedStatusContent = tableAlertRender ? (
    tableAlertRender(tableRenderContext)
  ) : (
    <Typography.Text type="secondary">
      已选择 <Typography.Text strong>{selectedCount}</Typography.Text> 项
    </Typography.Text>
  );
  const selectedStatusOptionContent = tableAlertOptionRender ? (
    tableAlertOptionRender(tableRenderContext)
  ) : (
    <Button type="link" size="small" onClick={clearSelected}>
      清空
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

  const tableDom = (
    <Table<TRecord>
      rowKey={rowKey as TableProps<TRecord>['rowKey']}
      columns={mergedColumns}
      dataSource={dataSource}
      loading={loading}
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
          showTotal={(nextTotal) => `共 ${nextTotal} 条`}
          onChange={(current, pageSize) => queryState.changePage(current, pageSize)}
        />
      </div>
    </div>
  );
  const tableAreaDom = (
    <Card className="trueadmin-crud-table-card" styles={{ body: { padding: 0 } }}>
      {toolbarDom}
      <div ref={tableMainRef} className="trueadmin-crud-table-main">
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

  return tableRender ? tableRender(tableRenderContext, defaultDom, domList) : defaultDom;
}
