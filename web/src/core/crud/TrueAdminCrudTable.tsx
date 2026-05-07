import type { TableProps } from 'antd';
import { App, Button, Card, Pagination, Popconfirm, Table, Typography } from 'antd';
import type { SorterResult, SortOrder, TablePaginationConfig } from 'antd/es/table/interface';
import type { Key } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Permission } from '@/core/auth/Permission';
import { errorCenter } from '@/core/error/errorCenter';
import { TrueAdminTableFilterPanel } from './TrueAdminTableFilterPanel';
import { TrueAdminTableToolbar } from './TrueAdminTableToolbar';
import type { CrudColumns, TrueAdminCrudTableProps } from './types';
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
>({
  defaultFiltersExpanded,
  filters = [],
  quickSearch,
  resource,
  rowKey,
  columns,
  service,
  toolbarRender,
  tableExtraRender,
  tableViewRender,
  tableRender,
  tableAlertRender,
  tableAlertOptionRender,
  rowSelection,
  tableScrollX,
}: Pick<
  TrueAdminCrudTableProps<TRecord, TCreate, TUpdate>,
  | 'defaultFiltersExpanded'
  | 'filters'
  | 'quickSearch'
  | 'resource'
  | 'rowKey'
  | 'columns'
  | 'service'
  | 'toolbarRender'
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
  const [innerSelectedRowKeys, setInnerSelectedRowKeys] = useState<Key[]>([]);
  const [innerSelectedRows, setInnerSelectedRows] = useState<TRecord[]>([]);
  const reloadSeedRef = useRef(0);
  const [reloadSeed, setReloadSeed] = useState(0);
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

  const action = useMemo(
    () => ({
      clearSelected,
      reload,
    }),
    [clearSelected, reload],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    service
      .list(queryState.requestParams)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setDataSource(result.items ?? []);
        setTotal(result.total ?? 0);
      })
      .catch((error) => {
        if (!cancelled) {
          errorCenter.emit(error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [queryState.requestParams, reloadSeed, service]);

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
                        await service.delete?.(record.id as Key);
                        message.success('删除成功');
                        reload();
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
    [message, reload, resource, service],
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
      selectedRowKeys,
      selectedRows,
      total,
    }),
    [action, dataSource, loading, selectedRowKeys, selectedRows, total],
  );

  const toolbarTitle = toolbarRender?.({ action }) ?? null;

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

  const searchDom =
    filtersExpanded && hasFilters ? (
      <TrueAdminTableFilterPanel
        expanded={filtersExpanded}
        filters={filters}
        values={queryState.values}
        onReset={queryState.resetFilters}
        onSubmit={queryState.submitFilters}
      />
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
    table: tableViewDom,
    toolbar: toolbarDom,
  };
  const defaultDom = (
    <div className="trueadmin-crud-shell">
      {searchDom}
      {extraDom}
      {tableAreaDom}
    </div>
  );

  return tableRender ? tableRender(tableRenderContext, defaultDom, domList) : defaultDom;
}
