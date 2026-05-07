import type { TableProps } from 'antd';
import { App, Button, Card, Pagination, Popconfirm, Table, Typography } from 'antd';
import type { SorterResult, SortOrder, TablePaginationConfig } from 'antd/es/table/interface';
import type { CSSProperties, Key } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Permission } from '@/core/auth/Permission';
import { errorCenter } from '@/core/error/errorCenter';
import { TrueAdminTableFilterPanel } from './TrueAdminTableFilterPanel';
import { TrueAdminTableToolbar } from './TrueAdminTableToolbar';
import type { CrudColumns, CrudPageResult, TrueAdminCrudTableProps } from './types';
import { type CrudOrder, useCrudTableQueryState } from './useCrudTableQueryState';

const DEFAULT_PAGE_SIZE = 20;
const TABLE_HEADER_HEIGHT = 55;
const FILTER_PANEL_TRANSITION_FALLBACK_MS = 280;

type ElementSizeOptions = {
  paused?: boolean;
};

const useElementSize = <TElement extends HTMLElement>({
  paused = false,
}: ElementSizeOptions = {}) => {
  const ref = useRef<TElement | null>(null);
  const pausedRef = useRef(paused);
  const [size, setSize] = useState({ height: 0, width: 0 });

  pausedRef.current = paused;

  const measureSize = useCallback(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    const nextSize = {
      height: Math.floor(rect.height),
      width: Math.floor(rect.width),
    };
    setSize((currentSize) =>
      currentSize.height === nextSize.height && currentSize.width === nextSize.width
        ? currentSize
        : nextSize,
    );
  }, []);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) {
      return undefined;
    }

    const updateSize = () => {
      if (!pausedRef.current) {
        measureSize();
      }
    };

    measureSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measureSize]);

  return [ref, size, measureSize] as const;
};

const getElementNumberStyle = (element: Element, property: keyof CSSStyleDeclaration) => {
  const value = Number.parseFloat(getComputedStyle(element)[property] as string);
  return Number.isNaN(value) ? 0 : value;
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
  const [isFilterPanelTransitioning, setIsFilterPanelTransitioning] = useState(false);
  const [dataSource, setDataSource] = useState<TRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CrudPageResult<TRecord, TMeta>>();
  const [innerSelectedRowKeys, setInnerSelectedRowKeys] = useState<Key[]>([]);
  const [innerSelectedRows, setInnerSelectedRows] = useState<TRecord[]>([]);
  const reloadSeedRef = useRef(0);
  const filterPanelTransitionTimerRef = useRef<number | undefined>(undefined);
  const [reloadSeed, setReloadSeed] = useState(0);
  const [queryResetSeed, setQueryResetSeed] = useState(0);
  const queryState = useCrudTableQueryState({
    filters,
    quickSearch,
    defaultPageSize: DEFAULT_PAGE_SIZE,
  });
  const [tableMainRef, tableMainSize, measureTableMainSize] = useElementSize<HTMLDivElement>({
    paused: isFilterPanelTransitioning,
  });
  const [tableEmptyChromeHeight, setTableEmptyChromeHeight] = useState(32);
  const hasFilters = filters.length > 0;
  const selectedRowKeys = rowSelection?.selectedRowKeys ?? innerSelectedRowKeys;
  const selectedRows = rowSelection ? innerSelectedRows : [];
  const selectedCount = rowSelection ? selectedRowKeys.length : 0;
  const hasSelectedStatus = Boolean(
    rowSelection && selectedCount > 0 && tableAlertRender !== false,
  );
  const tableBodyScrollY = Math.max(120, tableMainSize.height - TABLE_HEADER_HEIGHT);
  const tableEmptyHeight = Math.max(120, tableBodyScrollY - tableEmptyChromeHeight);
  const tableMainStyle = {
    '--trueadmin-crud-table-empty-height': `${tableEmptyHeight}px`,
  } as CSSProperties;

  useLayoutEffect(() => {
    const tableMainNode = tableMainRef.current;
    if (!tableMainNode) {
      return;
    }

    const bodyNode = tableMainNode.querySelector('.ant-table-body');
    const cellNode = tableMainNode.querySelector('.ant-table-placeholder > .ant-table-cell');
    if (!bodyNode || !cellNode) {
      return;
    }

    const cellVerticalPadding =
      getElementNumberStyle(cellNode, 'paddingTop') +
      getElementNumberStyle(cellNode, 'paddingBottom');
    const cellVerticalBorder =
      getElementNumberStyle(cellNode, 'borderTopWidth') +
      getElementNumberStyle(cellNode, 'borderBottomWidth');
    const horizontalScrollbarHeight =
      bodyNode.clientWidth < bodyNode.scrollWidth
        ? bodyNode.getBoundingClientRect().height - bodyNode.clientHeight
        : 0;
    const nextChromeHeight = Math.max(
      0,
      Math.ceil(cellVerticalPadding + cellVerticalBorder + horizontalScrollbarHeight),
    );

    setTableEmptyChromeHeight((currentChromeHeight) =>
      currentChromeHeight === nextChromeHeight ? currentChromeHeight : nextChromeHeight,
    );
  }, [tableMainRef, tableMainSize.height, tableMainSize.width, dataSource.length]);

  const finishFilterPanelTransition = useCallback(() => {
    if (filterPanelTransitionTimerRef.current) {
      window.clearTimeout(filterPanelTransitionTimerRef.current);
      filterPanelTransitionTimerRef.current = undefined;
    }

    setIsFilterPanelTransitioning(false);
    measureTableMainSize();
  }, [measureTableMainSize]);

  const toggleFiltersExpanded = useCallback(() => {
    if (filterPanelTransitionTimerRef.current) {
      window.clearTimeout(filterPanelTransitionTimerRef.current);
    }

    setIsFilterPanelTransitioning(true);
    setFiltersExpanded((value) => !value);
    filterPanelTransitionTimerRef.current = window.setTimeout(() => {
      window.requestAnimationFrame(finishFilterPanelTransition);
    }, FILTER_PANEL_TRANSITION_FALLBACK_MS);
  }, [finishFilterPanelTransition]);

  useEffect(
    () => () => {
      if (filterPanelTransitionTimerRef.current) {
        window.clearTimeout(filterPanelTransitionTimerRef.current);
      }
    },
    [],
  );

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
          quickSearch={quickSearch}
          quickSearchName={queryState.quickSearchName}
          quickSearchResetSeed={queryResetSeed}
          quickSearchValue={
            queryState.quickSearchName ? queryState.values[queryState.quickSearchName] : undefined
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

  return tableRender ? tableRender(tableRenderContext, defaultDom, domList) : defaultDom;
}
