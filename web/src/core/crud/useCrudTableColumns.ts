import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { useMemo } from 'react';
import { getColumnSortKey } from './crudTableUtils';
import { createCrudOperationColumns } from './TrueAdminCrudOperationColumn';
import type {
  CrudColumns,
  CrudOrder,
  CrudTableLocale,
  CrudTableRenderContext,
  TrueAdminCrudTableProps,
} from './types';

type UseCrudTableColumnsOptions<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
> = {
  canDelete: boolean;
  columns: CrudColumns<TRecord>;
  locale?: CrudTableLocale;
  onDelete: (record: TRecord) => void | Promise<void>;
  order?: CrudOrder;
  renderContext: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>;
  resource: string;
  rowActions?: TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>['rowActions'];
  sort?: string;
  t: TranslateFunction;
};

export function useCrudTableColumns<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({
  canDelete,
  columns,
  locale,
  onDelete,
  order,
  renderContext,
  resource,
  rowActions,
  sort,
  t,
}: UseCrudTableColumnsOptions<TRecord, TCreate, TUpdate, TMeta>) {
  const operationColumn = useMemo<CrudColumns<TRecord>>(
    () =>
      createCrudOperationColumns({
        canDelete,
        locale,
        onDelete,
        renderContext,
        resource,
        rowActions,
        t,
      }),
    [canDelete, locale, onDelete, renderContext, resource, rowActions, t],
  );

  return useMemo<CrudColumns<TRecord>>(() => {
    const merged = [...columns, ...operationColumn];
    return merged.map((column) => {
      const sortKey = getColumnSortKey(column);
      if (!sortKey || !column.sorter) {
        return column;
      }
      return {
        ...column,
        sortOrder: sort === sortKey && order ? (order === 'asc' ? 'ascend' : 'descend') : undefined,
      };
    });
  }, [columns, operationColumn, order, sort]);
}
