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
  maxTagCount?: number;
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

export type CrudTableAction<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
> = {
  clearSelected: () => void;
  reload: () => void;
  create?: (payload: TCreate) => Promise<TRecord>;
  update?: (id: React.Key, payload: TUpdate) => Promise<TRecord>;
  delete?: (id: React.Key) => Promise<unknown>;
};

export type CrudRequestLifecycleContext = {
  resource: string;
};

export type CrudLoadLifecycleContext = CrudRequestLifecycleContext & {
  params: CrudListParams;
};

export type CrudCreateSuccessContext<TCreate> = CrudRequestLifecycleContext & {
  payload: TCreate;
};

export type CrudUpdateSuccessContext<TUpdate> = CrudRequestLifecycleContext & {
  id: React.Key;
  payload: TUpdate;
};

export type CrudDeleteSuccessContext = CrudRequestLifecycleContext & {
  id: React.Key;
};

export type CrudColumns<TRecord extends Record<string, unknown>> = TableColumnsType<TRecord>;

export type CrudTableRenderContext<
  TRecord extends Record<string, unknown>,
  TMeta = Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
> = {
  action: CrudTableAction<TRecord, TCreate, TUpdate>;
  dataSource: TRecord[];
  loading: boolean;
  response?: CrudPageResult<TRecord, TMeta>;
  selectedRowKeys: React.Key[];
  selectedRows: TRecord[];
  error?: unknown;
  total: number;
};

export type CrudToolbarRenderContext<
  TRecord extends Record<string, unknown>,
  TMeta = Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
> = CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>;

export type CrudRowActionContext<
  TRecord extends Record<string, unknown>,
  TMeta = Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
> = CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate> & {
  record: TRecord;
};

export type CrudRowActionsConfig<
  TRecord extends Record<string, unknown>,
  TMeta = Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
> = {
  delete?: false;
  render?: (context: CrudRowActionContext<TRecord, TMeta, TCreate, TUpdate>) => ReactNode;
  title?: ReactNode;
  width?: number;
};

export type CrudExportType = 'page' | 'selected' | 'all';

export type CrudImportConfig<
  TRecord extends Record<string, unknown>,
  TMeta = Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
> =
  | boolean
  | {
      accept?: string;
      description?: ReactNode;
      disabled?: boolean;
      title?: ReactNode;
      template?: {
        disabled?: boolean;
        label?: ReactNode;
        onDownload?: (context: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>) => void;
      };
      onConfirm?: (
        file: File,
        context: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>,
      ) => Promise<void> | void;
    };

export type CrudImportExportConfig<
  TRecord extends Record<string, unknown>,
  TMeta = Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
> = {
  import?: CrudImportConfig<TRecord, TMeta, TCreate, TUpdate>;
  export?:
    | boolean
    | {
        disabled?: boolean;
        options?: CrudExportType[];
        onExport?: (
          type: CrudExportType,
          context: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>,
        ) => void;
      };
};

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
  beforeRequest?: (
    params: CrudListParams,
    context: CrudRequestLifecycleContext,
  ) => boolean | undefined | Promise<boolean | undefined>;
  transformParams?: (
    params: CrudListParams,
    context: CrudRequestLifecycleContext,
  ) => CrudListParams | Promise<CrudListParams>;
  transformResponse?: (
    response: CrudPageResult<TRecord, TMeta>,
    context: CrudLoadLifecycleContext,
  ) => CrudPageResult<TRecord, TMeta> | Promise<CrudPageResult<TRecord, TMeta>>;
  onLoadSuccess?: (
    response: CrudPageResult<TRecord, TMeta>,
    context: CrudLoadLifecycleContext,
  ) => void;
  onLoadError?: (error: unknown, context: CrudLoadLifecycleContext) => false | undefined;
  onCreateSuccess?: (record: TRecord, context: CrudCreateSuccessContext<TCreate>) => void;
  onUpdateSuccess?: (record: TRecord, context: CrudUpdateSuccessContext<TUpdate>) => void;
  onDeleteSuccess?: (result: unknown, context: CrudDeleteSuccessContext) => void;
  toolbarRender?: (
    context: CrudToolbarRenderContext<TRecord, TMeta, TCreate, TUpdate>,
  ) => ReactNode;
  toolbarExtraRender?: (
    context: CrudToolbarRenderContext<TRecord, TMeta, TCreate, TUpdate>,
  ) => ReactNode;
  summaryRender?: (context: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>) => ReactNode;
  tableExtraRender?: (
    context: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>,
  ) => ReactNode;
  emptyRender?: (context: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>) => ReactNode;
  errorRender?: (context: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>) => ReactNode;
  tableViewRender?: (
    context: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>,
    defaultDom: ReactNode,
  ) => ReactNode;
  tableRender?: (
    context: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>,
    defaultDom: ReactNode,
    domList: CrudTableDomList,
  ) => ReactNode;
  tableAlertRender?:
    | false
    | ((context: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>) => ReactNode);
  tableAlertOptionRender?:
    | false
    | ((context: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>) => ReactNode);
  rowSelection?: TableProps<TRecord>['rowSelection'];
  rowActions?: false | CrudRowActionsConfig<TRecord, TMeta, TCreate, TUpdate>;
  importExport?: false | CrudImportExportConfig<TRecord, TMeta, TCreate, TUpdate>;
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
  description?: ReactNode;
  extra?: ReactNode;
  aside?: ReactNode;
  asideWidth?: number | string;
  asideGap?: number | string;
  asideClassName?: string;
  asideStyle?: CSSProperties;
  asideBodyClassName?: string;
  asideBodyStyle?: CSSProperties;
};
