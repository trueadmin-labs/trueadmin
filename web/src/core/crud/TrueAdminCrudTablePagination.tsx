import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { PaginationProps } from 'antd';
import { Button, Pagination, Typography } from 'antd';
import type { ReactNode } from 'react';
import { joinClassNames } from './crudTableUtils';
import type {
  CrudTableClassNames,
  CrudTableLocale,
  CrudTableRenderContext,
  CrudTableStyles,
} from './types';

type CrudTableSelectionStatusProps<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
> = {
  classNames?: CrudTableClassNames;
  clearSelected: () => void;
  locale?: CrudTableLocale;
  open: boolean;
  renderContext: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>;
  selectedCount: number;
  styles?: CrudTableStyles;
  t: TranslateFunction;
  tableAlertOptionRender?:
    | false
    | ((context: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>) => ReactNode);
  tableAlertRender?:
    | false
    | ((context: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>) => ReactNode);
};

export function TrueAdminCrudTableSelectionStatus<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({
  classNames,
  clearSelected,
  locale,
  open,
  renderContext,
  selectedCount,
  styles,
  t,
  tableAlertOptionRender,
  tableAlertRender,
}: CrudTableSelectionStatusProps<TRecord, TCreate, TUpdate, TMeta>) {
  if (!open) {
    return null;
  }

  const selectedStatusContent = tableAlertRender ? (
    tableAlertRender(renderContext)
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
    tableAlertOptionRender(renderContext)
  ) : (
    <Button type="link" size="small" onClick={clearSelected}>
      {locale?.clearSelectedText ?? t('crud.selection.clear', '清空')}
    </Button>
  );

  return (
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
  );
}

type TrueAdminCrudTablePaginationProps = {
  classNames?: CrudTableClassNames;
  current: number;
  locale?: CrudTableLocale;
  onChange: (current: number, pageSize: number) => void;
  pageSize: number;
  paginationProps?: Omit<PaginationProps, 'current' | 'pageSize' | 'total'>;
  selectedStatus: ReactNode;
  styles?: CrudTableStyles;
  t: TranslateFunction;
  total: number;
};

export function TrueAdminCrudTablePagination({
  classNames,
  current,
  locale,
  onChange,
  pageSize,
  paginationProps,
  selectedStatus,
  styles,
  t,
  total,
}: TrueAdminCrudTablePaginationProps) {
  return (
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
        {selectedStatus}
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
          current={current}
          pageSize={pageSize}
          total={total}
          showSizeChanger={paginationProps?.showSizeChanger ?? true}
          showTotal={
            paginationProps?.showTotal ??
            ((nextTotal) =>
              locale?.paginationTotalText?.(nextTotal) ??
              t('crud.pagination.total', '共 {{total}} 条').replace('{{total}}', String(nextTotal)))
          }
          onChange={(nextCurrent, nextPageSize) => {
            onChange(nextCurrent, nextPageSize);
            paginationProps?.onChange?.(nextCurrent, nextPageSize);
          }}
        />
      </div>
    </div>
  );
}
