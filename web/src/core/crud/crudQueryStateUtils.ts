import type {
  CrudExtraQuerySchema,
  CrudFilterSchema,
  CrudFilterValue,
  CrudListParams,
  CrudOperator,
  CrudQueryTransformResult,
  CrudSortOrder,
  CrudSortRule,
} from './types';

export const PAGE_PARAM = 'page';
export const PAGE_SIZE_PARAM = 'pageSize';
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
const LEGACY_PAGE_PARAM = '_page';
const LEGACY_PAGE_SIZE_PARAM = '_pageSize';
const SORT_FIELD_PATTERN = /^sorts\[(\d+)]\[field]$/;
const FILTER_FIELD_PATTERN = /^filters\[(\d+)]\[field]$/;
export const EMPTY_FILTERS: CrudFilterSchema[] = [];
export const EMPTY_EXTRA_QUERY: CrudExtraQuerySchema[] = [];

export const toPositiveInteger = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const toSortOrder = (value: string | null): CrudSortOrder | undefined => {
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

export const getQueryValueNames = ({
  extraQuery = EMPTY_EXTRA_QUERY,
  filters = EMPTY_FILTERS,
  quickSearchName,
}: {
  extraQuery?: CrudExtraQuerySchema[];
  filters?: CrudFilterSchema[];
  quickSearchName?: string;
}) => {
  const names = getFilterNames(filters);
  if (quickSearchName) {
    names.add(quickSearchName);
  }
  getExtraQueryNames(extraQuery).forEach((name) => {
    names.add(name);
  });
  return names;
};

export const readParamValue = (searchParams: URLSearchParams, key: string) => {
  const arrayValues = searchParams.getAll(`params[${key}][]`).map((value) => value.trim());
  if (arrayValues.length > 0) {
    return arrayValues.filter(Boolean).join(',');
  }

  return normalizeValue(searchParams.get(`params[${key}]`) ?? undefined);
};

const readIndexedValue = (searchParams: URLSearchParams, prefix: string) => {
  const arrayValues = searchParams.getAll(`${prefix}[value][]`).map((value) => value.trim());
  if (arrayValues.length > 0) {
    return arrayValues.filter(Boolean).join(',');
  }

  return normalizeValue(searchParams.get(`${prefix}[value]`) ?? undefined);
};

export const readFilterValue = (searchParams: URLSearchParams, field: string) => {
  const indexedFields = new Map<number, string>();
  searchParams.forEach((value, key) => {
    const matched = FILTER_FIELD_PATTERN.exec(key);
    if (matched) {
      indexedFields.set(Number(matched[1]), value);
    }
  });

  for (const [index, indexedField] of Array.from(indexedFields.entries()).sort(
    ([left], [right]) => left - right,
  )) {
    if (indexedField === field) {
      return readIndexedValue(searchParams, `filters[${index}]`);
    }
  }

  return undefined;
};

export const createParamsObject = (
  searchParams: URLSearchParams,
  {
    extraQuery = EMPTY_EXTRA_QUERY,
    filters = EMPTY_FILTERS,
    quickSearchName,
  }: {
    extraQuery?: CrudExtraQuerySchema[];
    filters?: CrudFilterSchema[];
    quickSearchName?: string;
  },
) => {
  const values: Record<string, string> = {};

  if (quickSearchName) {
    const keyword = normalizeValue(searchParams.get('keyword') ?? undefined);
    if (keyword !== undefined) {
      values[quickSearchName] = keyword;
    }
  }

  filters.forEach((filter) => {
    const requestName = filter.requestName ?? filter.name;
    if (requestName === false) {
      return;
    }
    const value =
      filter.requestMode === 'param'
        ? readParamValue(searchParams, requestName)
        : readFilterValue(searchParams, requestName);
    if (value !== undefined) {
      values[filter.name] = value;
    }
  });

  extraQuery.forEach((item) => {
    const requestName = item.requestName ?? item.name;
    if (requestName === false) {
      return;
    }
    const value =
      item.requestMode === 'filter'
        ? readFilterValue(searchParams, requestName)
        : readParamValue(searchParams, requestName);
    if (value !== undefined) {
      values[item.name] = value;
    }
  });

  return values;
};

export const removeQueryKeys = (params: URLSearchParams, keys: Iterable<string>) => {
  Array.from(keys).forEach((key) => {
    params.delete(key);
  });
};

export const removeSortParams = (params: URLSearchParams) => {
  Array.from(params.keys())
    .filter((key) => key.startsWith('sorts['))
    .forEach((key) => {
      params.delete(key);
    });
};

export const removeCrudParams = (params: URLSearchParams, legacyKeys: Iterable<string> = []) => {
  params.delete(PAGE_PARAM);
  params.delete(PAGE_SIZE_PARAM);
  params.delete(LEGACY_PAGE_PARAM);
  params.delete(LEGACY_PAGE_SIZE_PARAM);
  params.delete('keyword');
  Array.from(legacyKeys).forEach((key) => {
    params.delete(key);
  });
  Array.from(params.keys())
    .filter(
      (key) => key.startsWith('filters[') || key.startsWith('sorts[') || key.startsWith('params['),
    )
    .forEach((key) => {
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

const mergeRequestParams = (params: CrudListParams, nextParams: CrudQueryTransformResult) => {
  Object.entries(nextParams).forEach(([key, value]) => {
    if (key === 'filters' && Array.isArray(value)) {
      params.filters = [...(params.filters ?? []), ...value] as CrudListParams['filters'];
      return;
    }

    if (key === 'sorts' && Array.isArray(value)) {
      params.sorts = [...(params.sorts ?? []), ...value] as CrudListParams['sorts'];
      return;
    }

    if (key === 'params' && isRecord(value)) {
      params.params = {
        ...(isRecord(params.params) ? params.params : {}),
        ...value,
      } as CrudListParams['params'];
      return;
    }

    throw new Error(`Unsupported CRUD transform result key "${key}".`);
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

  return 'eq';
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
    params.params ??= {};
    params.params[requestName] = requestValue;
    return;
  }

  params.filters ??= [];
  params.filters.push({
    field: requestName,
    op: defaultFilterOperator(filter),
    value: requestValue,
  });
};

export const getSorts = (searchParams: URLSearchParams): CrudSortRule[] => {
  const indexedFields = new Map<number, string>();
  searchParams.forEach((value, key) => {
    const matched = SORT_FIELD_PATTERN.exec(key);
    if (matched) {
      indexedFields.set(Number(matched[1]), value);
    }
  });

  return Array.from(indexedFields.entries())
    .sort(([left], [right]) => left - right)
    .flatMap(([index, field]) => {
      const order = toSortOrder(searchParams.get(`sorts[${index}][order]`));
      return field && order ? [{ field, order }] : [];
    });
};

export const setSorts = (params: URLSearchParams, sorts: CrudSortRule[]) => {
  removeSortParams(params);
  sorts.forEach((sort, index) => {
    params.set(`sorts[${index}][field]`, sort.field);
    params.set(`sorts[${index}][order]`, sort.order);
  });
};

export const getRequestParams = ({
  filters,
  extraQuery,
  page,
  pageSize,
  sorts,
  values,
  quickSearchName,
}: {
  filters: CrudFilterSchema[];
  extraQuery: CrudExtraQuerySchema[];
  page: number;
  pageSize: number;
  quickSearchName?: string;
  sorts: CrudSortRule[];
  values: Record<string, string>;
}) => {
  const params: CrudListParams = {
    page,
    pageSize,
  };

  if (quickSearchName && values[quickSearchName] !== undefined) {
    params.keyword = values[quickSearchName];
  }

  if (sorts.length > 0) {
    params.sorts = sorts;
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
    if (value === undefined) {
      return;
    }
    if (item.transform) {
      mergeRequestParams(params, item.transform({ name: item.name, value, values }));
      return;
    }
    if (item.requestName !== false) {
      const requestName = item.requestName ?? item.name;
      if (item.requestMode === 'filter') {
        params.filters ??= [];
        params.filters.push({
          field: requestName,
          op: item.operator ?? 'eq',
          value,
        });
        return;
      }

      params.params ??= {};
      params.params[requestName] = value;
    }
  });

  return params;
};
