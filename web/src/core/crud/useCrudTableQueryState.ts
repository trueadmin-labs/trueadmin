import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { updateRawSearchParams } from '@/core/url/searchParams';
import type { CrudFilterSchema, CrudListParams, CrudQuickSearchConfig } from './types';

export type CrudOrder = 'asc' | 'desc';

export type CrudTableQueryState = {
  current: number;
  pageSize: number;
  sort?: string;
  order?: CrudOrder;
  values: Record<string, string>;
  activeFilterCount: number;
  quickSearchName?: string;
  requestParams: CrudListParams;
  submitQuickSearch: (value: string) => void;
  clearQuickSearch: () => void;
  submitFilters: (values: Record<string, string | undefined>) => void;
  resetFilters: () => void;
  changePage: (current?: number, pageSize?: number) => void;
  changeSort: (sort?: string, order?: CrudOrder) => void;
};

type UseCrudTableQueryStateOptions = {
  filters?: CrudFilterSchema[];
  quickSearch?: CrudQuickSearchConfig;
  defaultPageSize?: number;
};

const PAGE_PARAM = '_page';
const PAGE_SIZE_PARAM = '_pageSize';
const SORT_PARAM = '_sort';
const ORDER_PARAM = '_order';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const toPositiveInteger = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toOrder = (value: string | null): CrudOrder | undefined => {
  if (value === 'asc' || value === 'desc') {
    return value;
  }
  return undefined;
};

const normalizeValue = (value: string | undefined) => {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : undefined;
};

const getQuickSearchName = (quickSearch?: CrudQuickSearchConfig) =>
  quickSearch ? (quickSearch.name ?? 'keyword') : undefined;

const getFilterNames = (filters: CrudFilterSchema[] = []) =>
  new Set(filters.map((filter) => filter.name));

const createParamsObject = (searchParams: URLSearchParams, keys: Iterable<string>) => {
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

const removeQueryKeys = (params: URLSearchParams, keys: Iterable<string>) => {
  Array.from(keys).forEach((key) => {
    params.delete(key);
  });
};

const setQueryValue = (params: URLSearchParams, key: string, value: string | undefined) => {
  const normalized = normalizeValue(value);
  if (normalized === undefined) {
    params.delete(key);
    return;
  }
  params.set(key, normalized);
};

const setPage = (params: URLSearchParams, page: number) => {
  if (page <= DEFAULT_PAGE) {
    params.delete(PAGE_PARAM);
    return;
  }
  params.set(PAGE_PARAM, String(page));
};

const setPageSize = (params: URLSearchParams, pageSize: number, defaultPageSize: number) => {
  if (pageSize === defaultPageSize) {
    params.delete(PAGE_SIZE_PARAM);
    return;
  }
  params.set(PAGE_SIZE_PARAM, String(pageSize));
};

const getRequestParams = ({
  filters,
  order,
  page,
  pageSize,
  sort,
  values,
}: {
  filters: CrudFilterSchema[];
  order?: CrudOrder;
  page: number;
  pageSize: number;
  sort?: string;
  values: Record<string, string>;
}) => {
  const params: CrudListParams = {
    ...values,
    page,
    pageSize,
  };

  if (sort && order) {
    params.sort = sort;
    params.order = order;
  }

  filters.forEach((filter) => {
    const value = values[filter.name];
    if (value === undefined || !filter.transform) {
      return;
    }
    Object.assign(params, filter.transform({ name: filter.name, value, values }));
  });

  return params;
};

export function useCrudTableQueryState({
  filters = [],
  quickSearch,
  defaultPageSize = DEFAULT_PAGE_SIZE,
}: UseCrudTableQueryStateOptions): CrudTableQueryState {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quickSearchName = getQuickSearchName(quickSearch);
  const filterNames = useMemo(() => getFilterNames(filters), [filters]);
  const valueKeys = useMemo(() => {
    const keys = new Set(filterNames);
    if (quickSearchName) {
      keys.add(quickSearchName);
    }
    return keys;
  }, [filterNames, quickSearchName]);

  const current = toPositiveInteger(searchParams.get(PAGE_PARAM), DEFAULT_PAGE);
  const pageSize = toPositiveInteger(searchParams.get(PAGE_SIZE_PARAM), defaultPageSize);
  const sort = normalizeValue(searchParams.get(SORT_PARAM) ?? undefined);
  const order = toOrder(searchParams.get(ORDER_PARAM));
  const values = useMemo(
    () => createParamsObject(searchParams, valueKeys),
    [searchParams, valueKeys],
  );
  const activeFilterCount = useMemo(
    () => Array.from(filterNames).filter((name) => values[name] !== undefined).length,
    [filterNames, values],
  );

  const updateQuery = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const nextSearch = updateRawSearchParams(searchParams, updater);
      navigate({ search: nextSearch ? `?${nextSearch}` : '' }, { replace: true });
    },
    [navigate, searchParams],
  );

  const submitQuickSearch = useCallback(
    (value: string) => {
      if (!quickSearchName) {
        return;
      }
      updateQuery((params) => {
        setQueryValue(params, quickSearchName, value);
        setPage(params, DEFAULT_PAGE);
      });
    },
    [quickSearchName, updateQuery],
  );

  const clearQuickSearch = useCallback(() => {
    if (!quickSearchName) {
      return;
    }
    updateQuery((params) => {
      params.delete(quickSearchName);
      setPage(params, DEFAULT_PAGE);
    });
  }, [quickSearchName, updateQuery]);

  const submitFilters = useCallback(
    (nextValues: Record<string, string | undefined>) => {
      updateQuery((params) => {
        filterNames.forEach((name) => {
          setQueryValue(params, name, nextValues[name]);
        });
        setPage(params, DEFAULT_PAGE);
      });
    },
    [filterNames, updateQuery],
  );

  const resetFilters = useCallback(() => {
    updateQuery((params) => {
      removeQueryKeys(params, valueKeys);
      params.delete(SORT_PARAM);
      params.delete(ORDER_PARAM);
      setPage(params, DEFAULT_PAGE);
    });
  }, [updateQuery, valueKeys]);

  const changePage = useCallback(
    (nextPage?: number, nextPageSize?: number) => {
      updateQuery((params) => {
        setPage(params, nextPage ?? DEFAULT_PAGE);
        setPageSize(params, nextPageSize ?? defaultPageSize, defaultPageSize);
      });
    },
    [defaultPageSize, updateQuery],
  );

  const changeSort = useCallback(
    (nextSort?: string, nextOrder?: CrudOrder) => {
      updateQuery((params) => {
        if (nextSort && nextOrder) {
          params.set(SORT_PARAM, nextSort);
          params.set(ORDER_PARAM, nextOrder);
        } else {
          params.delete(SORT_PARAM);
          params.delete(ORDER_PARAM);
        }
      });
    },
    [updateQuery],
  );

  const requestParams = useMemo(
    () => getRequestParams({ filters, order, page: current, pageSize, sort, values }),
    [current, filters, order, pageSize, sort, values],
  );

  return {
    current,
    pageSize,
    sort,
    order,
    values,
    activeFilterCount,
    quickSearchName,
    requestParams,
    submitQuickSearch,
    clearQuickSearch,
    submitFilters,
    resetFilters,
    changePage,
    changeSort,
  };
}
