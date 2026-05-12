import { useMemo } from 'react';
import type { CrudTableRenderContext } from './types';

type UseCrudTableRenderContextOptions<
  TRecord extends Record<string, unknown>,
  TCreate,
  TUpdate,
  TMeta,
> = CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>;

export function useCrudTableRenderContext<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({
  action,
  dataSource,
  error,
  loading,
  query,
  response,
  selectedRowKeys,
  selectedRows,
  total,
}: UseCrudTableRenderContextOptions<TRecord, TCreate, TUpdate, TMeta>) {
  return useMemo<CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>>(
    () => ({
      action,
      dataSource,
      error,
      loading,
      query,
      response,
      selectedRowKeys,
      selectedRows,
      total,
    }),
    [action, dataSource, error, loading, query, response, selectedRowKeys, selectedRows, total],
  );
}
