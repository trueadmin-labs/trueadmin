import type { ProColumns, ProTableProps } from '@ant-design/pro-components';
import type { ReactNode } from 'react';
import type { PageResult } from '@/core/http/types';

export type CrudListParams = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  filter?: Record<string, unknown>;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: unknown;
};

export type CrudService<TRecord, TCreate = Partial<TRecord>, TUpdate = Partial<TRecord>> = {
  list: (params: CrudListParams) => Promise<PageResult<TRecord>>;
  create?: (payload: TCreate) => Promise<TRecord>;
  update?: (id: React.Key, payload: TUpdate) => Promise<TRecord>;
  delete?: (id: React.Key) => Promise<unknown>;
};

export type TrueAdminCrudPageProps<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
> = {
  title: string;
  resource: string;
  rowKey?: keyof TRecord | ((record: TRecord) => React.Key);
  columns: ProColumns<TRecord>[];
  service: CrudService<TRecord, TCreate, TUpdate>;
  toolbarRender?: ProTableProps<TRecord, CrudListParams>['toolbar'];
  extra?: ReactNode;
};
