import type { TableProps } from 'antd';
import { App, Button, Card, Empty, Pagination, Popconfirm, Result, Table, Typography } from 'antd';
import type { CardProps, CardSemanticStyles, CardStylesType } from 'antd/es/card/Card';
import type { SorterResult } from 'antd/es/table/interface';
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

const joinClassNames = (...classNames: Array<string | undefined | false>) =>
  classNames.filter(Boolean).join(' ');

const mergeCardBodyStyles = (
  cardStyles: CardStylesType | undefined,
  bodyStyle: React.CSSProperties,
): CardStylesType => {
  const mergeBodyStyle = (nextStyles?: CardSemanticStyles): CardSemanticStyles => ({
    ...nextStyles,
    body: { ...bodyStyle, ...nextStyles?.body },
  });

  if (typeof cardStyles === 'function') {
    return (info: { props: CardProps }) => mergeBodyStyle(cardStyles(info));
  }

  return mergeBodyStyle(cardStyles);
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
  className,
  style,
  classNames,
  styles,
  cardProps,
  defaultFiltersExpanded,
  filterPanelProps,
  filters = [],
  extraQuery,
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
  locale,
  paginationProps,
  rowSelection,
  tableProps,
  tableScrollX,
  toolbarProps,
}: Pick<
  TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>,
  | 'className'
  | 'style'
  | 'classNames'
  | 'styles'
  | 'cardProps'
  | 'defaultFiltersExpanded'
  | 'filterPanelProps'
  | 'filters'
  | 'extraQuery'
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
  | 'locale'
  | 'paginationProps'
  | 'rowSelection'
  | 'tableProps'
  | 'tableScrollX'
  | 'toolbarProps'
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
    extraQuery,
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
      query: queryState.query,
      response,
      selectedRowKeys,
      selectedRows,
      total,
    }),
    [
      action,
      dataSource,
      error,
      loading,
      queryState.query,
      response,
      selectedRowKeys,
      selectedRows,
      total,
    ],
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
              title:
                rowActions?.title ?? locale?.actionColumnTitle ?? t('crud.column.action', '操作'),
              key: '__actions',
              fixed: 'right',
              width: rowActions?.width ?? 120,
              render: (_, record) => (
                <>
                  {rowActions?.render?.({ ...tableRenderContext, record })}
                  {service.delete && rowActions?.delete !== false ? (
                    <Permission code={toPermissionCode(resource, 'delete')}>
                      <Popconfirm
                        title={
                          locale?.deleteConfirmTitle ??
                          t('crud.action.deleteConfirm', '确认删除这条记录吗？')
                        }
                        onConfirm={async () => {
                          try {
                            await deleteRecord(getRecordKey(record));
                            if (!onDeleteSuccess) {
                              message.success(
                                locale?.deleteSuccessMessage ??
                                  t('crud.action.deleteSuccess', '删除成功'),
                              );
                            }
                          } catch (error) {
                            errorCenter.emit(error);
                          }
                        }}
                      >
                        <Button danger type="link" size="small">
                          {locale?.deleteText ?? t('crud.action.delete', '删除')}
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
      locale,
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

  const handleTableChange: TableProps<TRecord>['onChange'] = (
    pagination,
    filters,
    sorter,
    extra,
  ) => {
    const sorterResult = getSorterResult(sorter as SorterResult<TRecord> | SorterResult<TRecord>[]);
    queryState.changeSort(
      sorterResult ? getSorterKey(sorterResult) : undefined,
      toCrudOrder(sorterResult?.order),
    );
    tableProps?.onChange?.(pagination, filters, sorter, extra);
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
      locale={locale}
      panelProps={filterPanelProps}
      onTransitionEnd={finishFilterPanelTransition}
    />
  ) : null;

  const summaryDom = summaryRender ? (
    <div
      className={joinClassNames('trueadmin-crud-table-summary', classNames?.summary)}
      style={styles?.summary}
    >
      {summaryRender(tableRenderContext)}
    </div>
  ) : null;

  const extraDom = tableExtraRender ? (
    <div
      className={joinClassNames('trueadmin-crud-table-extra', classNames?.extra)}
      style={styles?.extra}
    >
      {tableExtraRender(tableRenderContext)}
    </div>
  ) : null;

  const toolbarDom = (
    <div
      className={joinClassNames('trueadmin-crud-table-toolbar', classNames?.toolbar)}
      style={styles?.toolbar}
    >
      <div
        className={joinClassNames('trueadmin-crud-table-toolbar-left', classNames?.toolbarLeft)}
        style={styles?.toolbarLeft}
      >
        {toolbarTitle}
      </div>
      <div
        className={joinClassNames('trueadmin-crud-table-toolbar-right', classNames?.toolbarRight)}
        style={styles?.toolbarRight}
      >
        <TrueAdminTableToolbar
          activeFilterCount={queryState.activeFilterCount}
          filtersExpanded={filtersExpanded}
          hasFilters={hasFilters}
          loading={loading}
          extra={toolbarExtra}
          importExport={importExport as never}
          locale={locale}
          renderContext={tableRenderContext as never}
          selectedCount={selectedCount}
          toolbarProps={toolbarProps as never}
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
      {locale?.selectedCountText?.(selectedCount) ??
        t('crud.selection.count', '已选择 {{count}} 项').replace(
          '{{count}}',
          String(selectedCount),
        )}
    </Typography.Text>
  );
  const selectedStatusOptionContent = tableAlertOptionRender ? (
    tableAlertOptionRender(tableRenderContext)
  ) : (
    <Button type="link" size="small" onClick={clearSelected}>
      {locale?.clearSelectedText ?? t('crud.selection.clear', '清空')}
    </Button>
  );
  const selectedStatusDom = hasSelectedStatus ? (
    <div
      className={joinClassNames('trueadmin-crud-table-selected-status', classNames?.selectedStatus)}
      style={styles?.selectedStatus}
    >
      <div
        className={joinClassNames(
          'trueadmin-crud-table-selected-status-content',
          classNames?.selectedStatusContent,
        )}
        style={styles?.selectedStatusContent}
      >
        {selectedStatusContent}
      </div>
      {tableAlertOptionRender !== false ? (
        <div
          className={joinClassNames(
            'trueadmin-crud-table-selected-status-options',
            classNames?.selectedStatusOptions,
          )}
          style={styles?.selectedStatusOptions}
        >
          {selectedStatusOptionContent}
        </div>
      ) : null}
    </div>
  ) : null;

  const emptyContent = locale?.emptyText ??
    emptyRender?.(tableRenderContext) ??
    tableProps?.locale?.emptyText ?? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  const tableDom = error ? (
    (errorRender?.(tableRenderContext) ?? (
      <Result
        status="error"
        title={locale?.errorTitle ?? t('crud.error.loadFailed', '数据加载失败')}
        subTitle={
          locale?.errorDescription ??
          t('crud.error.loadFailedDescription', '请稍后重试或联系管理员。')
        }
        extra={
          <Button type="primary" onClick={reload}>
            {locale?.reloadText ?? t('crud.action.reload', '刷新')}
          </Button>
        }
      />
    ))
  ) : (
    <Table<TRecord>
      {...tableProps}
      rowKey={rowKey as TableProps<TRecord>['rowKey']}
      columns={mergedColumns}
      dataSource={dataSource}
      loading={loading}
      locale={{ ...tableProps?.locale, emptyText: emptyContent }}
      pagination={false}
      rowSelection={mergedRowSelection}
      scroll={{
        ...tableProps?.scroll,
        x: tableProps?.scroll?.x ?? tableScrollX,
        y: tableProps?.scroll?.y ?? tableBodyScrollY,
      }}
      onChange={handleTableChange}
    />
  );
  const tableViewDom = tableViewRender ? tableViewRender(tableRenderContext, tableDom) : tableDom;
  const paginationDom = (
    <div
      className={joinClassNames('trueadmin-crud-table-pagination', classNames?.pagination)}
      style={styles?.pagination}
    >
      <div
        className={joinClassNames(
          'trueadmin-crud-table-pagination-left',
          classNames?.paginationLeft,
        )}
        style={styles?.paginationLeft}
      >
        {selectedStatusDom}
      </div>
      <div
        className={joinClassNames(
          'trueadmin-crud-table-pagination-right',
          classNames?.paginationRight,
        )}
        style={styles?.paginationRight}
      >
        <Pagination
          {...paginationProps}
          current={queryState.current}
          pageSize={queryState.pageSize}
          total={total}
          showSizeChanger={paginationProps?.showSizeChanger ?? true}
          showTotal={
            paginationProps?.showTotal ??
            ((nextTotal) =>
              locale?.paginationTotalText?.(nextTotal) ??
              t('crud.pagination.total', '共 {{total}} 条').replace('{{total}}', String(nextTotal)))
          }
          onChange={(current, pageSize) => {
            queryState.changePage(current, pageSize);
            paginationProps?.onChange?.(current, pageSize);
          }}
        />
      </div>
    </div>
  );
  const tableAreaDom = (
    <Card
      {...cardProps}
      className={joinClassNames(
        'trueadmin-crud-table-card',
        classNames?.card,
        cardProps?.className,
      )}
      style={{ ...styles?.card, ...cardProps?.style }}
      styles={mergeCardBodyStyles(cardProps?.styles, { padding: 0 })}
    >
      {toolbarDom}
      <div
        ref={tableMainRef}
        className={joinClassNames('trueadmin-crud-table-main', classNames?.tableMain)}
        style={{ ...tableMainStyle, ...styles?.tableMain }}
      >
        {tableViewDom}
      </div>
      {paginationDom}
    </Card>
  );
  const wrappedSearchDom = searchDom ? (
    <div className={joinClassNames(classNames?.search)} style={styles?.search}>
      {searchDom}
    </div>
  ) : null;
  const domList = {
    alert: selectedStatusDom,
    extra: extraDom,
    pagination: paginationDom,
    search: wrappedSearchDom,
    summary: summaryDom,
    table: tableViewDom,
    toolbar: toolbarDom,
  };
  const defaultDom = (
    <div
      className={joinClassNames('trueadmin-crud-shell', classNames?.shell, className)}
      style={{ ...styles?.shell, ...style }}
    >
      {summaryDom}
      {wrappedSearchDom}
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
