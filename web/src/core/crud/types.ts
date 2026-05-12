import type {
  CrudOperator,
  CrudSortOrder,
  CrudSortRule,
  CrudFilterValue as ProtocolCrudFilterValue,
  CrudListParams as ProtocolCrudListParams,
} from '@trueadmin/web-core/crud';
import type { PageResult } from '@trueadmin/web-core/http';
import type {
  ButtonProps,
  CardProps,
  FormProps,
  InputProps,
  PaginationProps,
  SpaceProps,
  TableColumnsType,
  TableProps,
} from 'antd';
import type { CSSProperties, ReactNode } from 'react';

export type { CrudOperator, CrudSortOrder, CrudSortRule };

export type CrudListParams = ProtocolCrudListParams;

export type CrudFilterValue = ProtocolCrudFilterValue;

export type CrudFilterOption = {
  label: ReactNode;
  value: string | number | boolean;
};

export type CrudFilterTransformContext = {
  name: string;
  value: string;
  values: Record<string, string>;
};

export type CrudQueryTransformResult = Partial<
  Pick<CrudListParams, 'filters' | 'sorts' | 'params'>
>;

export type CrudFilterBase = {
  name: string;
  label: ReactNode;
  placeholder?: string;
  operator?: CrudOperator;
  requestMode?: 'filter' | 'param';
  requestName?: string | false;
  transform?: (context: CrudFilterTransformContext) => CrudQueryTransformResult;
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

export type CrudExtraQueryTransformContext = {
  name: string;
  value: string;
  values: Record<string, string>;
};

export type CrudExtraQuerySchema = {
  name: string;
  defaultValue?: string;
  requestName?: string | false;
  transform?: (context: CrudExtraQueryTransformContext) => CrudQueryTransformResult;
};

export type CrudQueryController = {
  values: Record<string, string>;
  hasName: (name: string) => boolean;
  setValue: (name: string, value?: string) => void;
  setValues: (values: Record<string, string | undefined>) => void;
  resetValues: (names?: string[]) => void;
};

export type CrudTableClassNames = {
  root?: string;
  shell?: string;
  summary?: string;
  search?: string;
  extra?: string;
  card?: string;
  toolbar?: string;
  toolbarLeft?: string;
  toolbarRight?: string;
  tableMain?: string;
  pagination?: string;
  paginationLeft?: string;
  paginationRight?: string;
  selectedStatus?: string;
  selectedStatusContent?: string;
  selectedStatusOptions?: string;
};

export type CrudTableStyles = {
  root?: CSSProperties;
  shell?: CSSProperties;
  summary?: CSSProperties;
  search?: CSSProperties;
  extra?: CSSProperties;
  card?: CSSProperties;
  toolbar?: CSSProperties;
  toolbarLeft?: CSSProperties;
  toolbarRight?: CSSProperties;
  tableMain?: CSSProperties;
  pagination?: CSSProperties;
  paginationLeft?: CSSProperties;
  paginationRight?: CSSProperties;
  selectedStatus?: CSSProperties;
  selectedStatusContent?: CSSProperties;
  selectedStatusOptions?: CSSProperties;
};

export type CrudToolbarClassNames = {
  root?: string;
  quickSearchGroup?: string;
  quickSearch?: string;
  searchAddon?: string;
  searchButton?: string;
  filterButton?: string;
  importExport?: string;
  importButton?: string;
  exportButton?: string;
  reloadButton?: string;
};

export type CrudToolbarStyles = {
  root?: CSSProperties;
  quickSearchGroup?: CSSProperties;
  quickSearch?: CSSProperties;
  searchAddon?: CSSProperties;
  searchButton?: CSSProperties;
  filterButton?: CSSProperties;
  importExport?: CSSProperties;
  importButton?: CSSProperties;
  exportButton?: CSSProperties;
  reloadButton?: CSSProperties;
};

export type CrudToolbarProps = {
  className?: string;
  style?: CSSProperties;
  classNames?: CrudToolbarClassNames;
  styles?: CrudToolbarStyles;
  spaceProps?: Omit<SpaceProps, 'children'>;
  quickSearchInputProps?: Omit<InputProps, 'className' | 'onChange' | 'onPressEnter' | 'value'>;
  searchButtonProps?: Omit<ButtonProps, 'className' | 'icon' | 'onClick'>;
  filterButtonProps?: Omit<ButtonProps, 'className' | 'icon' | 'onClick'>;
  importButtonProps?: Omit<ButtonProps, 'className' | 'icon' | 'onClick'>;
  exportButtonProps?: Omit<ButtonProps, 'className' | 'icon'>;
  reloadButtonProps?: Omit<ButtonProps, 'className' | 'icon' | 'onClick'>;
};

export type CrudFilterPanelClassNames = {
  root?: string;
  inner?: string;
  form?: string;
  layout?: string;
  content?: string;
  grid?: string;
  actions?: string;
  actionSpace?: string;
  searchButton?: string;
  resetButton?: string;
};

export type CrudFilterPanelStyles = {
  root?: CSSProperties;
  inner?: CSSProperties;
  form?: CSSProperties;
  layout?: CSSProperties;
  content?: CSSProperties;
  grid?: CSSProperties;
  actions?: CSSProperties;
  actionSpace?: CSSProperties;
  searchButton?: CSSProperties;
  resetButton?: CSSProperties;
};

export type CrudFilterPanelProps = {
  className?: string;
  style?: CSSProperties;
  classNames?: CrudFilterPanelClassNames;
  styles?: CrudFilterPanelStyles;
  formProps?: Omit<FormProps, 'children' | 'form' | 'layout' | 'onFinish'>;
  searchButtonProps?: Omit<ButtonProps, 'children' | 'htmlType' | 'icon' | 'onClick' | 'type'>;
  resetButtonProps?: Omit<ButtonProps, 'children' | 'htmlType' | 'icon' | 'onClick'>;
};

export type CrudTableLocale = {
  actionColumnTitle?: ReactNode;
  deleteText?: ReactNode;
  deleteConfirmTitle?: ReactNode;
  deleteSuccessMessage?: string;
  emptyText?: ReactNode;
  errorTitle?: ReactNode;
  errorDescription?: ReactNode;
  reloadText?: ReactNode;
  selectedCountText?: (count: number) => ReactNode;
  clearSelectedText?: ReactNode;
  paginationTotalText?: (total: number) => ReactNode;
  quickSearchPlaceholder?: string;
  searchText?: string;
  advancedFilterText?: string;
  filterSearchText?: ReactNode;
  filterResetText?: ReactNode;
  importText?: string;
  exportText?: string;
};

export type CrudPageClassNames = {
  root?: string;
  body?: string;
  stack?: string;
  titleCard?: string;
  titleCardContent?: string;
  titleCardMain?: string;
  title?: string;
  description?: string;
  titleExtra?: string;
  layout?: string;
  aside?: string;
  asideBody?: string;
  main?: string;
};

export type CrudPageStyles = {
  root?: CSSProperties;
  body?: CSSProperties;
  stack?: CSSProperties;
  titleCard?: CSSProperties;
  titleCardContent?: CSSProperties;
  titleCardMain?: CSSProperties;
  title?: CSSProperties;
  description?: CSSProperties;
  titleExtra?: CSSProperties;
  layout?: CSSProperties;
  aside?: CSSProperties;
  asideBody?: CSSProperties;
  main?: CSSProperties;
};

export type CrudPageResult<TRecord, TMeta = Record<string, unknown>> = PageResult<TRecord, TMeta>;

export type CrudListRequestOptions = {
  force?: boolean;
  reloadSeed?: number;
};

export type CrudService<
  TRecord,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
> = {
  list: (
    params: CrudListParams,
    options?: CrudListRequestOptions,
  ) => Promise<CrudPageResult<TRecord, TMeta>>;
  detail?: (id: React.Key) => Promise<TRecord>;
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
  query: CrudQueryController;
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
  className?: string;
  style?: CSSProperties;
  classNames?: CrudTableClassNames;
  styles?: CrudTableStyles;
  cardProps?: Omit<CardProps, 'children'>;
  filterPanelProps?: CrudFilterPanelProps;
  locale?: CrudTableLocale;
  paginationProps?: Omit<PaginationProps, 'current' | 'pageSize' | 'total'>;
  rowSelection?: TableProps<TRecord>['rowSelection'];
  rowActions?: false | CrudRowActionsConfig<TRecord, TMeta, TCreate, TUpdate>;
  importExport?: false | CrudImportExportConfig<TRecord, TMeta, TCreate, TUpdate>;
  tableProps?: Omit<
    TableProps<TRecord>,
    | 'columns'
    | 'dataSource'
    | 'loading'
    | 'locale'
    | 'onChange'
    | 'pagination'
    | 'rowKey'
    | 'rowSelection'
    | 'scroll'
  > & {
    locale?: TableProps<TRecord>['locale'];
    onChange?: TableProps<TRecord>['onChange'];
    scroll?: TableProps<TRecord>['scroll'];
  };
  tableScrollX?: number | string;
  toolbarProps?: CrudToolbarProps;
  filters?: CrudFilterSchema[];
  quickSearch?: CrudQuickSearchConfig;
  extraQuery?: CrudExtraQuerySchema[];
  defaultFiltersExpanded?: boolean;
  queryMode?: 'url' | 'local';
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
  className?: string;
  style?: CSSProperties;
  bodyClassName?: string;
  bodyStyle?: CSSProperties;
  classNames?: CrudPageClassNames;
  styles?: CrudPageStyles;
  titleCardProps?: Omit<CardProps, 'children'>;
  aside?:
    | ReactNode
    | ((context: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>) => ReactNode);
  asideWidth?: number | string;
  asideGap?: number | string;
  asideClassName?: string;
  asideStyle?: CSSProperties;
  asideBodyClassName?: string;
  asideBodyStyle?: CSSProperties;
};
