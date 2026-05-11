import type { TableProps } from 'antd';
import { App, Button, Card, Empty, Result, Table } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import { useCallback, useMemo, useState } from 'react';
import { errorCenter } from '@/core/error/errorCenter';
import { useI18n } from '@/core/i18n/I18nProvider';
import {
  getSorterKey,
  getSorterResult,
  joinClassNames,
  mergeCardBodyStyles,
  toCrudOrder,
} from './crudTableUtils';
import {
  TrueAdminCrudTablePagination,
  TrueAdminCrudTableSelectionStatus,
} from './TrueAdminCrudTablePagination';
import { TrueAdminImportModal } from './TrueAdminImportModal';
import { TrueAdminTableFilterPanel } from './TrueAdminTableFilterPanel';
import { TrueAdminTableToolbar } from './TrueAdminTableToolbar';
import type { CrudImportConfig, TrueAdminCrudTableProps } from './types';
import { useCrudTableColumns } from './useCrudTableColumns';
import { useCrudTableData } from './useCrudTableData';
import { useCrudTableLayout } from './useCrudTableLayout';
import { useCrudTableQueryState } from './useCrudTableQueryState';
import { useCrudTableSelection } from './useCrudTableSelection';

const DEFAULT_PAGE_SIZE = 20;

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
  queryMode,
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
  | 'queryMode'
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
  const [queryResetSeed, setQueryResetSeed] = useState(0);
  const [importModalConfig, setImportModalConfig] = useState<
    CrudImportConfig<TRecord, TMeta, TCreate, TUpdate> | undefined
  >();
  const queryState = useCrudTableQueryState({
    extraQuery,
    filters,
    quickSearch,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    queryMode,
  });
  const hasFilters = filters.length > 0;
  const {
    clearSelected,
    getRecordKey,
    mergedRowSelection,
    selectedCount,
    selectedRowKeys,
    selectedRows,
  } = useCrudTableSelection({
    rowKey,
    rowSelection,
  });
  const hasSelectedStatus = Boolean(
    rowSelection && selectedCount > 0 && tableAlertRender !== false,
  );

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

  const deleteRow = useCallback(
    async (record: TRecord) => {
      try {
        await deleteRecord(getRecordKey(record));
        if (!onDeleteSuccess) {
          message.success(
            locale?.deleteSuccessMessage ?? t('crud.action.deleteSuccess', '删除成功'),
          );
        }
      } catch (error) {
        errorCenter.emit(error);
      }
    },
    [deleteRecord, getRecordKey, locale?.deleteSuccessMessage, message, onDeleteSuccess, t],
  );

  const mergedColumns = useCrudTableColumns<TRecord, TCreate, TUpdate, TMeta>({
    canDelete: Boolean(service.delete),
    columns,
    locale,
    onDelete: deleteRow,
    order: queryState.order,
    renderContext: tableRenderContext,
    resource,
    rowActions,
    sort: queryState.sort,
    t,
  });

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

  const selectedStatusDom = (
    <TrueAdminCrudTableSelectionStatus
      classNames={classNames}
      clearSelected={clearSelected}
      locale={locale}
      open={hasSelectedStatus}
      renderContext={tableRenderContext}
      selectedCount={selectedCount}
      styles={styles}
      t={t}
      tableAlertOptionRender={tableAlertOptionRender}
      tableAlertRender={tableAlertRender}
    />
  );

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
    <TrueAdminCrudTablePagination
      classNames={classNames}
      current={queryState.current}
      locale={locale}
      pageSize={queryState.pageSize}
      paginationProps={paginationProps}
      selectedStatus={selectedStatusDom}
      styles={styles}
      t={t}
      total={total}
      onChange={queryState.changePage}
    />
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
