import { App } from 'antd';
import { useCallback, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminCrudTableContent } from './TrueAdminCrudTableContent';
import type { CrudImportConfig, TrueAdminCrudTableProps } from './types';
import { useCrudTableChangeHandler } from './useCrudTableChangeHandler';
import { useCrudTableColumns } from './useCrudTableColumns';
import { useCrudTableData } from './useCrudTableData';
import { useCrudTableDeleteAction } from './useCrudTableDeleteAction';
import { useCrudTableLayout } from './useCrudTableLayout';
import { useCrudTableQueryState } from './useCrudTableQueryState';
import { useCrudTableRenderContext } from './useCrudTableRenderContext';
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

  const tableRenderContext = useCrudTableRenderContext<TRecord, TCreate, TUpdate, TMeta>({
    action,
    dataSource,
    error,
    loading,
    query: queryState.query,
    response,
    selectedRowKeys,
    selectedRows,
    total,
  });

  const deleteRow = useCrudTableDeleteAction<TRecord, TCreate, TUpdate, TMeta>({
    deleteRecord,
    getRecordKey,
    locale,
    notifySuccess: message.success,
    onDeleteSuccess,
    t,
  });

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

  const handleTableChange = useCrudTableChangeHandler<TRecord, TCreate, TUpdate, TMeta>({
    queryState,
    tableProps,
  });

  const resetQuery = useCallback(() => {
    queryState.resetFilters();
    setQueryResetSeed((seed) => seed + 1);
  }, [queryState]);

  return (
    <TrueAdminCrudTableContent<TRecord, TCreate, TUpdate, TMeta>
      cardProps={cardProps}
      className={className}
      classNames={classNames}
      columns={mergedColumns}
      dataSource={dataSource}
      emptyRender={emptyRender}
      error={error}
      errorRender={errorRender}
      filterPanelProps={filterPanelProps}
      filters={filters}
      filtersExpanded={filtersExpanded}
      importExport={importExport}
      importModalConfig={importModalConfig}
      loading={loading}
      locale={locale}
      mergedRowSelection={mergedRowSelection}
      paginationProps={paginationProps}
      queryResetSeed={queryResetSeed}
      queryState={queryState}
      quickSearch={quickSearch}
      renderContext={tableRenderContext}
      rowKey={rowKey}
      selectedCount={selectedCount}
      selectedStatusOpen={hasSelectedStatus}
      style={style}
      styles={styles}
      summaryRender={summaryRender}
      tableAlertOptionRender={tableAlertOptionRender}
      tableAlertRender={tableAlertRender}
      tableBodyScrollY={tableBodyScrollY}
      tableExtraRender={tableExtraRender}
      tableMainRef={tableMainRef}
      tableMainStyle={tableMainStyle}
      tableProps={tableProps}
      tableRender={tableRender}
      tableScrollX={tableScrollX}
      tableViewRender={tableViewRender}
      toolbarExtraRender={toolbarExtraRender}
      toolbarProps={toolbarProps}
      toolbarRender={toolbarRender}
      t={t}
      total={total}
      onChangeTable={handleTableChange}
      onClearSelected={clearSelected}
      onCloseImport={() => setImportModalConfig(undefined)}
      onFinishFilterPanelTransition={finishFilterPanelTransition}
      onOpenImport={setImportModalConfig}
      onReload={reload}
      onResetQuery={resetQuery}
      onToggleFilters={toggleFiltersExpanded}
    />
  );
}
