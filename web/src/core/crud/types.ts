import type { TableColumnsType, TableProps } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import type { PageResult } from '@/core/http/types';

export type CrudListParams = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: unknown;
};

export type CrudFilterValue = string | number | boolean | Array<string | number | boolean>;

export type CrudFilterOption = {
  label: ReactNode;
  value: string | number | boolean;
};

export type CrudFilterTransformContext = {
  name: string;
  value: string;
  values: Record<string, string>;
};

export type CrudFilterBase = {
  name: string;
  label: ReactNode;
  placeholder?: string;
  transform?: (context: CrudFilterTransformContext) => Record<string, unknown>;
};

export type CrudInputFilter = CrudFilterBase & {
  type: 'input';
};

export type CrudSelectFilter = CrudFilterBase & {
  type: 'select';
  mode?: 'multiple';
  options: CrudFilterOption[];
};

export type CrudDateRangeFilter = CrudFilterBase & {
  type: 'dateRange';
};

export type CrudCustomFilter = CrudFilterBase & {
  type: 'custom';
  render: (props: {
    value: string | undefined;
    onChange: (value: string | undefined) => void;
  }) => ReactNode;
};

export type CrudFilterSchema =
  | CrudInputFilter
  | CrudSelectFilter
  | CrudDateRangeFilter
  | CrudCustomFilter;

export type CrudQuickSearchConfig = {
  name?: string;
  placeholder?: string;
};

export type CrudPageResult<TRecord, TMeta = Record<string, unknown>> = PageResult<TRecord, TMeta>;

export type CrudService<
  TRecord,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
> = {
  list: (params: CrudListParams) => Promise<CrudPageResult<TRecord, TMeta>>;
  create?: (payload: TCreate) => Promise<TRecord>;
  update?: (id: React.Key, payload: TUpdate) => Promise<TRecord>;
  delete?: (id: React.Key) => Promise<unknown>;
};

export type CrudTableAction = {
  clearSelected: () => void;
  reload: () => void;
};

export type CrudColumns<TRecord extends Record<string, unknown>> = TableColumnsType<TRecord>;

export type CrudTableRenderContext<
  TRecord extends Record<string, unknown>,
  TMeta = Record<string, unknown>,
> = {
  action: CrudTableAction;
  dataSource: TRecord[];
  loading: boolean;
  response?: CrudPageResult<TRecord, TMeta>;
  selectedRowKeys: React.Key[];
  selectedRows: TRecord[];
  total: number;
};

export type CrudToolbarRenderContext<
  TRecord extends Record<string, unknown>,
  TMeta = Record<string, unknown>,
> = CrudTableRenderContext<TRecord, TMeta>;

export type CrudTableDomList = {
  summary: ReactNode;
  search: ReactNode;
  extra: ReactNode;
  toolbar: ReactNode;
  alert: ReactNode;
  table: ReactNode;
  pagination: ReactNode;
};

export type TrueAdminCrudTableProps<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
> = {
  resource: string;
  rowKey?: keyof TRecord | ((record: TRecord) => React.Key);
  columns: CrudColumns<TRecord>;
  service: CrudService<TRecord, TCreate, TUpdate, TMeta>;
  toolbarRender?: (context: CrudToolbarRenderContext<TRecord, TMeta>) => ReactNode;
  summaryRender?: (context: CrudTableRenderContext<TRecord, TMeta>) => ReactNode;
  tableExtraRender?: (context: CrudTableRenderContext<TRecord, TMeta>) => ReactNode;
  tableViewRender?: (
    context: CrudTableRenderContext<TRecord, TMeta>,
    defaultDom: ReactNode,
  ) => ReactNode;
  tableRender?: (
    context: CrudTableRenderContext<TRecord, TMeta>,
    defaultDom: ReactNode,
    domList: CrudTableDomList,
  ) => ReactNode;
  tableAlertRender?: false | ((context: CrudTableRenderContext<TRecord, TMeta>) => ReactNode);
  tableAlertOptionRender?: false | ((context: CrudTableRenderContext<TRecord, TMeta>) => ReactNode);
  rowSelection?: TableProps<TRecord>['rowSelection'];
  tableScrollX?: number | string;
  filters?: CrudFilterSchema[];
  quickSearch?: CrudQuickSearchConfig;
  defaultFiltersExpanded?: boolean;
};

export type TrueAdminCrudPageProps<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
> = TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta> & {
  title: string;
  extra?: ReactNode;
  aside?: ReactNode;
  asideWidth?: number | string;
  asideGap?: number | string;
  asideClassName?: string;
  asideStyle?: CSSProperties;
  asideBodyClassName?: string;
  asideBodyStyle?: CSSProperties;
};
