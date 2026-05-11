import type {
  CrudExtraQuerySchema,
  CrudFilterSchema,
  CrudFilterValue,
  CrudListParams,
  CrudOperator,
  CrudOrder,
} from './types';

export const PAGE_PARAM = '_page';
export const PAGE_SIZE_PARAM = '_pageSize';
export const SORT_PARAM = '_sort';
export const ORDER_PARAM = '_order';
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const EMPTY_FILTERS: CrudFilterSchema[] = [];
export const EMPTY_EXTRA_QUERY: CrudExtraQuerySchema[] = [];

export const toPositiveInteger = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const toOrder = (value: string | null): CrudOrder | undefined => {
  if (value === 'asc' || value === 'desc') {
    return value;
  }
  return undefined;
};

export const normalizeValue = (value: string | undefined) => {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : undefined;
};

export const getQuickSearchName = (quickSearch?: { name?: string }) =>
  quickSearch ? (quickSearch.name ?? 'keyword') : undefined;

export const getFilterNames = (filters: CrudFilterSchema[] = []) =>
  new Set(filters.map((filter) => filter.name));

export const getExtraQueryNames = (extraQuery: CrudExtraQuerySchema[] = []) =>
  new Set(extraQuery.map((item) => item.name));

export const createParamsObject = (searchParams: URLSearchParams, keys: Iterable<string>) => {
  const keySet = new Set(keys);
  const values: Record<string, string> = {};
  keySet.forEach((key) => {
    const value = normalizeValue(searchParams.get(key) ?? undefined);
    if (value !== undefined) {
      values[key] = value;
    }
  });
  return values;
};

export const removeQueryKeys = (params: URLSearchParams, keys: Iterable<string>) => {
  Array.from(keys).forEach((key) => {
    params.delete(key);
  });
};

export const setQueryValue = (params: URLSearchParams, key: string, value: string | undefined) => {
  const normalized = normalizeValue(value);
  if (normalized === undefined) {
    params.delete(key);
    return;
  }
  params.set(key, normalized);
};

export const setPage = (params: URLSearchParams, page: number) => {
  if (page <= DEFAULT_PAGE) {
    params.delete(PAGE_PARAM);
    return;
  }
  params.set(PAGE_PARAM, String(page));
};

export const setPageSize = (params: URLSearchParams, pageSize: number, defaultPageSize: number) => {
  if (pageSize === defaultPageSize) {
    params.delete(PAGE_SIZE_PARAM);
    return;
  }
  params.set(PAGE_SIZE_PARAM, String(pageSize));
};

const splitListValue = (value: string) => value.split(',').filter(Boolean);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeRequestParams = (params: CrudListParams, nextParams: Record<string, unknown>) => {
  Object.entries(nextParams).forEach(([key, value]) => {
    if (key === 'filter' && isRecord(value)) {
      params.filter = {
        ...(isRecord(params.filter) ? params.filter : {}),
        ...value,
      } as CrudListParams['filter'];
      return;
    }

    if (key === 'op' && isRecord(value)) {
      params.op = {
        ...(isRecord(params.op) ? params.op : {}),
        ...value,
      } as CrudListParams['op'];
      return;
    }

    params[key] = value;
  });
};

const defaultFilterOperator = (filter: CrudFilterSchema): CrudOperator => {
  if (filter.operator) {
    return filter.operator;
  }

  if (filter.type === 'input') {
    return 'like';
  }

  if (filter.type === 'select' && filter.mode === 'multiple') {
    return 'in';
  }

  if (filter.type === 'dateRange') {
    return 'between';
  }

  return '=';
};

const defaultFilterValue = (filter: CrudFilterSchema, value: string): CrudFilterValue => {
  if (filter.type === 'select' && filter.mode === 'multiple') {
    return splitListValue(value);
  }

  if (filter.type === 'dateRange') {
    return splitListValue(value);
  }

  return value;
};

const setStandardFilterParam = (
  params: CrudListParams,
  filter: CrudFilterSchema,
  value: string | undefined,
) => {
  if (value === undefined || filter.requestName === false) {
    return;
  }

  const requestName = filter.requestName ?? filter.name;
  const requestValue = defaultFilterValue(filter, value);
  if (Array.isArray(requestValue) && requestValue.length === 0) {
    return;
  }

  if (filter.requestMode === 'param') {
    params[requestName] = requestValue;
    return;
  }

  params.filter ??= {};
  params.op ??= {};
  params.filter[requestName] = requestValue;
  params.op[requestName] = defaultFilterOperator(filter);
};

export const getRequestParams = ({
  filters,
  extraQuery,
  order,
  page,
  pageSize,
  sort,
  values,
  quickSearchName,
}: {
  filters: CrudFilterSchema[];
  extraQuery: CrudExtraQuerySchema[];
  order?: CrudOrder;
  page: number;
  pageSize: number;
  quickSearchName?: string;
  sort?: string;
  values: Record<string, string>;
}) => {
  const params: CrudListParams = {
    page,
    pageSize,
  };

  if (quickSearchName && values[quickSearchName] !== undefined) {
    params[quickSearchName] = values[quickSearchName];
  }

  if (sort && order) {
    params.sort = sort;
    params.order = order;
  }

  filters.forEach((filter) => {
    const value = values[filter.name];
    if (value === undefined) {
      return;
    }
    if (filter.transform) {
      mergeRequestParams(params, filter.transform({ name: filter.name, value, values }));
      return;
    }
    setStandardFilterParam(params, filter, value);
  });

  extraQuery.forEach((item) => {
    const value = values[item.name] ?? item.defaultValue;
    delete params[item.name];
    if (value === undefined) {
      return;
    }
    if (item.transform) {
      mergeRequestParams(params, item.transform({ name: item.name, value, values }));
      return;
    }
    if (item.requestName !== false) {
      params[item.requestName ?? item.name] = value;
    }
  });

  return params;
};
