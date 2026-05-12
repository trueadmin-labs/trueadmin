import type { TableProps } from 'antd';
import type { CSSProperties, RefObject } from 'react';
import type { TranslateFunction } from '@/core/i18n/trans';
import { joinClassNames } from './crudTableUtils';
import { buildCrudTableFrame } from './TrueAdminCrudTableFrame';
import {
  TrueAdminCrudTablePagination,
  TrueAdminCrudTableSelectionStatus,
} from './TrueAdminCrudTablePagination';
import { TrueAdminCrudTableToolbarRow } from './TrueAdminCrudTableToolbarRow';
import { TrueAdminCrudTableView } from './TrueAdminCrudTableView';
import { TrueAdminImportModal } from './TrueAdminImportModal';
import { TrueAdminTableFilterPanel } from './TrueAdminTableFilterPanel';
import type {
  CrudColumns,
  CrudImportConfig,
  CrudTableRenderContext,
  TrueAdminCrudTableProps,
} from './types';
import type { CrudTableQueryState } from './useCrudTableQueryState';

type TrueAdminCrudTableContentProps<
  TRecord extends Record<string, unknown>,
  TCreate,
  TUpdate,
  TMeta,
> = Pick<
  TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>,
  | 'cardProps'
  | 'className'
  | 'classNames'
  | 'emptyRender'
  | 'errorRender'
  | 'filterPanelProps'
  | 'filters'
  | 'importExport'
  | 'locale'
  | 'paginationProps'
  | 'quickSearch'
  | 'rowKey'
  | 'style'
  | 'styles'
  | 'summaryRender'
  | 'tableAlertOptionRender'
  | 'tableAlertRender'
  | 'tableExtraRender'
  | 'tableProps'
  | 'tableRender'
  | 'tableScrollX'
  | 'tableViewRender'
  | 'toolbarExtraRender'
  | 'toolbarProps'
  | 'toolbarRender'
> & {
  columns: CrudColumns<TRecord>;
  dataSource: TRecord[];
  error?: unknown;
  filtersExpanded: boolean;
  importModalConfig?: CrudImportConfig<TRecord, TMeta, TCreate, TUpdate>;
  loading: boolean;
  mergedRowSelection?: TableProps<TRecord>['rowSelection'];
  queryResetSeed: number;
  queryState: CrudTableQueryState;
  renderContext: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>;
  selectedCount: number;
  selectedStatusOpen: boolean;
  tableBodyScrollY?: number;
  tableMainRef: RefObject<HTMLDivElement | null>;
  tableMainStyle: CSSProperties;
  t: TranslateFunction;
  total: number;
  onChangeTable: TableProps<TRecord>['onChange'];
  onClearSelected: () => void;
  onCloseImport: () => void;
  onFinishFilterPanelTransition: () => void;
  onOpenImport: (config: CrudImportConfig<TRecord, TMeta, TCreate, TUpdate>) => void;
  onReload: () => void;
  onResetQuery: () => void;
  onToggleFilters: () => void;
};

export function TrueAdminCrudTableContent<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({
  cardProps,
  className,
  classNames,
  columns,
  dataSource,
  emptyRender,
  error,
  errorRender,
  filterPanelProps,
  filters = [],
  filtersExpanded,
  importExport,
  importModalConfig,
  loading,
  locale,
  mergedRowSelection,
  paginationProps,
  queryResetSeed,
  queryState,
  quickSearch,
  renderContext,
  rowKey,
  selectedCount,
  selectedStatusOpen,
  style,
  styles,
  summaryRender,
  tableAlertOptionRender,
  tableAlertRender,
  tableBodyScrollY,
  tableExtraRender,
  tableMainRef,
  tableMainStyle,
  tableProps,
  tableRender,
  tableScrollX,
  tableViewRender,
  toolbarExtraRender,
  toolbarProps,
  toolbarRender,
  t,
  total,
  onChangeTable,
  onClearSelected,
  onCloseImport,
  onFinishFilterPanelTransition,
  onOpenImport,
  onReload,
  onResetQuery,
  onToggleFilters,
}: TrueAdminCrudTableContentProps<TRecord, TCreate, TUpdate, TMeta>) {
  const hasFilters = filters.length > 0;
  const toolbarTitle = toolbarRender?.(renderContext) ?? null;
  const toolbarExtra = toolbarExtraRender?.(renderContext) ?? null;

  const searchDom = hasFilters ? (
    <TrueAdminTableFilterPanel
      expanded={filtersExpanded}
      filters={filters}
      values={queryState.values}
      onReset={onResetQuery}
      onSubmit={queryState.submitFilters}
      locale={locale}
      panelProps={filterPanelProps}
      onTransitionEnd={onFinishFilterPanelTransition}
    />
  ) : null;

  const summaryDom = summaryRender ? (
    <div
      className={joinClassNames('trueadmin-crud-table-summary', classNames?.summary)}
      style={styles?.summary}
    >
      {summaryRender(renderContext)}
    </div>
  ) : null;

  const extraDom = tableExtraRender ? (
    <div
      className={joinClassNames('trueadmin-crud-table-extra', classNames?.extra)}
      style={styles?.extra}
    >
      {tableExtraRender(renderContext)}
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
      renderContext={renderContext}
      selectedCount={selectedCount}
      styles={styles}
      toolbarExtra={toolbarExtra}
      toolbarProps={toolbarProps}
      toolbarTitle={toolbarTitle}
      t={t}
      onOpenImport={onOpenImport}
      onClearQuickSearch={queryState.clearQuickSearch}
      onReload={onReload}
      onSubmitQuickSearch={queryState.submitQuickSearch}
      onToggleFilters={onToggleFilters}
    />
  );

  const selectedStatusDom = (
    <TrueAdminCrudTableSelectionStatus
      classNames={classNames}
      clearSelected={onClearSelected}
      locale={locale}
      open={selectedStatusOpen}
      renderContext={renderContext}
      selectedCount={selectedCount}
      styles={styles}
      t={t}
      tableAlertOptionRender={tableAlertOptionRender}
      tableAlertRender={tableAlertRender}
    />
  );

  const tableDom = (
    <TrueAdminCrudTableView<TRecord, TCreate, TUpdate, TMeta>
      columns={columns}
      dataSource={dataSource}
      emptyRender={emptyRender}
      error={error}
      errorRender={errorRender}
      loading={loading}
      locale={locale}
      mergedRowSelection={mergedRowSelection}
      renderContext={renderContext}
      reload={onReload}
      rowKey={rowKey}
      tableBodyScrollY={tableBodyScrollY}
      tableProps={tableProps}
      tableScrollX={tableScrollX}
      t={t}
      onChange={onChangeTable}
    />
  );
  const tableViewDom = tableViewRender ? tableViewRender(renderContext, tableDom) : tableDom;
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

  const contentDom = tableRender ? tableRender(renderContext, defaultDom, domList) : defaultDom;

  return (
    <>
      {contentDom}
      <TrueAdminImportModal
        config={importModalConfig as never}
        context={renderContext as never}
        open={Boolean(importModalConfig)}
        t={t}
        onClose={onCloseImport}
      />
    </>
  );
}
