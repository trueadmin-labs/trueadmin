import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { updateRawSearchParams } from '@/core/url/searchParams';
import type {
  CrudExtraQuerySchema,
  CrudFilterSchema,
  CrudListParams,
  CrudQueryController,
  CrudQuickSearchConfig,
} from './types';

export type CrudOrder = 'asc' | 'desc';

export type CrudTableQueryState = {
  current: number;
  pageSize: number;
  sort?: string;
  order?: CrudOrder;
  values: Record<string, string>;
  activeFilterCount: number;
  quickSearchName?: string;
  query: CrudQueryController;
  requestParams: CrudListParams;
  submitQuickSearch: (value: string) => void;
  clearQuickSearch: () => void;
  submitFilters: (values: Record<string, string | undefined>) => void;
  resetFilters: () => void;
  changePage: (current?: number, pageSize?: number) => void;
  changeSort: (sort?: string, order?: CrudOrder) => void;
};

type UseCrudTableQueryStateOptions = {
  extraQuery?: CrudExtraQuerySchema[];
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

const getExtraQueryNames = (extraQuery: CrudExtraQuerySchema[] = []) =>
  new Set(extraQuery.map((item) => item.name));

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
  extraQuery,
  order,
  page,
  pageSize,
  sort,
  values,
}: {
  filters: CrudFilterSchema[];
  extraQuery: CrudExtraQuerySchema[];
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

  extraQuery.forEach((item) => {
    const value = values[item.name] ?? item.defaultValue;
    delete params[item.name];
    if (value === undefined) {
      return;
    }
    if (item.transform) {
      Object.assign(params, item.transform({ name: item.name, value, values }));
      return;
    }
    if (item.requestName !== false) {
      params[item.requestName ?? item.name] = value;
    }
  });

  return params;
};

export function useCrudTableQueryState({
  extraQuery = [],
  filters = [],
  quickSearch,
  defaultPageSize = DEFAULT_PAGE_SIZE,
}: UseCrudTableQueryStateOptions): CrudTableQueryState {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quickSearchName = getQuickSearchName(quickSearch);
  const filterNames = useMemo(() => getFilterNames(filters), [filters]);
  const extraQueryNames = useMemo(() => getExtraQueryNames(extraQuery), [extraQuery]);
  const valueKeys = useMemo(() => {
    const keys = new Set(filterNames);
    if (quickSearchName) {
      keys.add(quickSearchName);
    }
    extraQueryNames.forEach((name) => {
      keys.add(name);
    });
    return keys;
  }, [extraQueryNames, filterNames, quickSearchName]);

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
      removeQueryKeys(
        params,
        new Set([...filterNames, ...(quickSearchName ? [quickSearchName] : [])]),
      );
      params.delete(SORT_PARAM);
      params.delete(ORDER_PARAM);
      setPage(params, DEFAULT_PAGE);
    });
  }, [filterNames, quickSearchName, updateQuery]);

  const setExtraQueryValue = useCallback(
    (name: string, value?: string) => {
      if (!extraQueryNames.has(name)) {
        return;
      }
      updateQuery((params) => {
        setQueryValue(params, name, value);
        setPage(params, DEFAULT_PAGE);
      });
    },
    [extraQueryNames, updateQuery],
  );

  const setExtraQueryValues = useCallback(
    (nextValues: Record<string, string | undefined>) => {
      updateQuery((params) => {
        Object.entries(nextValues).forEach(([name, value]) => {
          if (extraQueryNames.has(name)) {
            setQueryValue(params, name, value);
          }
        });
        setPage(params, DEFAULT_PAGE);
      });
    },
    [extraQueryNames, updateQuery],
  );

  const resetExtraQueryValues = useCallback(
    (names: string[]) => {
      updateQuery((params) => {
        names.forEach((name) => {
          if (extraQueryNames.has(name)) {
            params.delete(name);
          }
        });
        setPage(params, DEFAULT_PAGE);
      });
    },
    [extraQueryNames, updateQuery],
  );

  const query = useMemo<CrudQueryController>(
    () => ({
      resetValues: resetExtraQueryValues,
      setValue: setExtraQueryValue,
      setValues: setExtraQueryValues,
      values,
    }),
    [resetExtraQueryValues, setExtraQueryValue, setExtraQueryValues, values],
  );

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
    () => getRequestParams({ extraQuery, filters, order, page: current, pageSize, sort, values }),
    [current, extraQuery, filters, order, pageSize, sort, values],
  );

  return {
    current,
    pageSize,
    sort,
    order,
    values,
    activeFilterCount,
    quickSearchName,
    query,
    requestParams,
    submitQuickSearch,
    clearQuickSearch,
    submitFilters,
    resetFilters,
    changePage,
    changeSort,
  };
}
