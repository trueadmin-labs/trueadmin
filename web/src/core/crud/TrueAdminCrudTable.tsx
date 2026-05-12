import type { TableProps } from 'antd';
import { App } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import { useCallback, useMemo, useState } from 'react';
import { errorCenter } from '@/core/error/errorCenter';
import { useI18n } from '@/core/i18n/I18nProvider';
import { getSorterKey, getSorterResult, joinClassNames, toCrudOrder } from './crudTableUtils';
import { buildCrudTableFrame } from './TrueAdminCrudTableFrame';
import {
  TrueAdminCrudTablePagination,
  TrueAdminCrudTableSelectionStatus,
} from './TrueAdminCrudTablePagination';
import { TrueAdminCrudTableToolbarRow } from './TrueAdminCrudTableToolbarRow';
import { TrueAdminCrudTableView } from './TrueAdminCrudTableView';
import { TrueAdminImportModal } from './TrueAdminImportModal';
import { TrueAdminTableFilterPanel } from './TrueAdminTableFilterPanel';
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
    <TrueAdminCrudTableToolbarRow<TRecord, TCreate, TUpdate, TMeta>
      activeFilterCount={queryState.activeFilterCount}
      classNames={classNames}
      filtersExpanded={filtersExpanded}
      hasFilters={hasFilters}
      importExport={importExport}
      loading={loading}
      locale={locale}
      quickSearch={quickSearch}
      quickSearchResetSeed={queryResetSeed}
      quickSearchValue={
        queryState.quickSearchName ? queryState.values[queryState.quickSearchName] : undefined
      }
      renderContext={tableRenderContext}
      selectedCount={selectedCount}
      styles={styles}
      toolbarExtra={toolbarExtra}
      toolbarProps={toolbarProps}
      toolbarTitle={toolbarTitle}
      t={t}
      onOpenImport={setImportModalConfig}
      onClearQuickSearch={queryState.clearQuickSearch}
      onReload={reload}
      onSubmitQuickSearch={queryState.submitQuickSearch}
      onToggleFilters={toggleFiltersExpanded}
    />
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

  const tableDom = (
    <TrueAdminCrudTableView<TRecord, TCreate, TUpdate, TMeta>
      columns={mergedColumns}
      dataSource={dataSource}
      emptyRender={emptyRender}
      error={error}
      errorRender={errorRender}
      loading={loading}
      locale={locale}
      mergedRowSelection={mergedRowSelection}
      renderContext={tableRenderContext}
      reload={reload}
      rowKey={rowKey}
      tableBodyScrollY={tableBodyScrollY}
      tableProps={tableProps}
      tableScrollX={tableScrollX}
      t={t}
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
  const { defaultDom, domList } = buildCrudTableFrame<TRecord, TCreate, TUpdate, TMeta>({
    cardProps,
    className,
    classNames,
    extraDom,
    paginationDom,
    searchDom,
    selectedStatusDom,
    style,
    styles,
    summaryDom,
    tableMainRef,
    tableMainStyle,
    tableViewDom,
    toolbarDom,
  });

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
