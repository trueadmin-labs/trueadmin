import { updateRawSearchParams } from '@trueadmin/web-core/url';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  createParamsObject,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  EMPTY_EXTRA_QUERY,
  EMPTY_FILTERS,
  getExtraQueryNames,
  getFilterNames,
  getQuickSearchName,
  getRequestParams,
  normalizeValue,
  ORDER_PARAM,
  PAGE_PARAM,
  PAGE_SIZE_PARAM,
  removeQueryKeys,
  SORT_PARAM,
  setPage,
  setPageSize,
  setQueryValue,
  toOrder,
  toPositiveInteger,
} from './crudQueryStateUtils';
import type {
  CrudExtraQuerySchema,
  CrudFilterSchema,
  CrudListParams,
  CrudOrder,
  CrudQueryController,
  CrudQuickSearchConfig,
} from './types';

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
  queryMode?: 'url' | 'local';
};

export function useCrudTableQueryState({
  extraQuery,
  filters,
  quickSearch,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  queryMode = 'url',
}: UseCrudTableQueryStateOptions): CrudTableQueryState {
  const navigate = useNavigate();
  const [urlSearchParams] = useSearchParams();
  const [localSearchParams, setLocalSearchParams] = useState(() => new URLSearchParams());
  const searchParams = queryMode === 'local' ? localSearchParams : urlSearchParams;
  const stableFilters = filters && filters.length > 0 ? filters : EMPTY_FILTERS;
  const stableExtraQuery = extraQuery && extraQuery.length > 0 ? extraQuery : EMPTY_EXTRA_QUERY;
  const quickSearchName = getQuickSearchName(quickSearch);
  const filterNames = useMemo(() => getFilterNames(stableFilters), [stableFilters]);
  const extraQueryNames = useMemo(() => getExtraQueryNames(stableExtraQuery), [stableExtraQuery]);
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
      if (queryMode === 'local') {
        setLocalSearchParams((currentParams) => {
          const nextSearch = updateRawSearchParams(currentParams, updater);
          return new URLSearchParams(nextSearch);
        });
        return;
      }

      const nextSearch = updateRawSearchParams(urlSearchParams, updater);
      navigate({ search: nextSearch ? `?${nextSearch}` : '' }, { replace: true });
    },
    [navigate, queryMode, urlSearchParams],
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
    () =>
      getRequestParams({
        extraQuery: stableExtraQuery,
        filters: stableFilters,
        order,
        page: current,
        pageSize,
        quickSearchName,
        sort,
        values,
      }),
    [current, stableExtraQuery, stableFilters, order, pageSize, quickSearchName, sort, values],
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
