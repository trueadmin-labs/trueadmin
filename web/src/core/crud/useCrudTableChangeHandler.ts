import type { TableProps } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import { useCallback } from 'react';
import { getSortRules } from './crudTableUtils';
import type { TrueAdminCrudTableProps } from './types';
import type { CrudTableQueryState } from './useCrudTableQueryState';

type UseCrudTableChangeHandlerOptions<
  TRecord extends Record<string, unknown>,
  TCreate,
  TUpdate,
  TMeta,
> = {
  queryState: Pick<CrudTableQueryState, 'changeSorts'>;
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
      queryState.changeSorts(
        getSortRules(sorter as SorterResult<TRecord> | SorterResult<TRecord>[]),
      );
      tableProps?.onChange?.(pagination, filters, sorter, extra);
    },
    [queryState, tableProps],
  );
}
