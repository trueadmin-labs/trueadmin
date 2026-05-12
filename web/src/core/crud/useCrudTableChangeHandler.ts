import type { TableProps } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import { useCallback } from 'react';
import { getSorterKey, getSorterResult, toCrudOrder } from './crudTableUtils';
import type { TrueAdminCrudTableProps } from './types';
import type { CrudTableQueryState } from './useCrudTableQueryState';

type UseCrudTableChangeHandlerOptions<
  TRecord extends Record<string, unknown>,
  TCreate,
  TUpdate,
  TMeta,
> = {
  queryState: Pick<CrudTableQueryState, 'changeSort'>;
  tableProps?: TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>['tableProps'];
};

export function useCrudTableChangeHandler<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({ queryState, tableProps }: UseCrudTableChangeHandlerOptions<TRecord, TCreate, TUpdate, TMeta>) {
  return useCallback<NonNullable<TableProps<TRecord>['onChange']>>(
    (pagination, filters, sorter, extra) => {
      const sorterResult = getSorterResult(
        sorter as SorterResult<TRecord> | SorterResult<TRecord>[],
      );
      queryState.changeSort(
        sorterResult ? getSorterKey(sorterResult) : undefined,
        toCrudOrder(sorterResult?.order),
      );
      tableProps?.onChange?.(pagination, filters, sorter, extra);
    },
    [queryState, tableProps],
  );
}
