import { updateRawSearchParams } from '@trueadmin/web-core/url';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  createParamsObject,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  EMPTY_EXTRA_QUERY,
  EMPTY_FILTERS,
  getFilterNames,
  getQueryValueNames,
  getQuickSearchName,
  getRequestParams,
  getSorts,
  PAGE_PARAM,
  PAGE_SIZE_PARAM,
  removeQueryKeys,
  removeSortParams,
  setPage,
  setPageSize,
  setQueryValue,
  setSorts,
  toPositiveInteger,
} from './crudQueryStateUtils';
import type {
  CrudExtraQuerySchema,
  CrudFilterSchema,
  CrudListParams,
  CrudQueryController,
  CrudQuickSearchConfig,
  CrudSortRule,
} from './types';

export type CrudTableQueryState = {
  current: number;
  pageSize: number;
  sorts: CrudSortRule[];
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
  changeSorts: (sorts: CrudSortRule[]) => void;
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
  const valueKeys = useMemo(
    () =>
      getQueryValueNames({
        extraQuery: stableExtraQuery,
        filters: stableFilters,
        quickSearchName,
      }),
    [quickSearchName, stableExtraQuery, stableFilters],
  );

  const current = toPositiveInteger(searchParams.get(PAGE_PARAM), DEFAULT_PAGE);
  const pageSize = toPositiveInteger(searchParams.get(PAGE_SIZE_PARAM), defaultPageSize);
  const sorts = useMemo(() => getSorts(searchParams), [searchParams]);
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
      removeSortParams(params);
      setPage(params, DEFAULT_PAGE);
    });
  }, [filterNames, quickSearchName, updateQuery]);

  const hasQueryName = useCallback((name: string) => valueKeys.has(name), [valueKeys]);

  const setQueryControllerValue = useCallback(
    (name: string, value?: string) => {
      if (!valueKeys.has(name)) {
        return;
      }
      updateQuery((params) => {
        setQueryValue(params, name, value);
        setPage(params, DEFAULT_PAGE);
      });
    },
    [updateQuery, valueKeys],
  );

  const setQueryControllerValues = useCallback(
    (nextValues: Record<string, string | undefined>) => {
      updateQuery((params) => {
        Object.entries(nextValues).forEach(([name, value]) => {
          if (valueKeys.has(name)) {
            setQueryValue(params, name, value);
          }
        });
        setPage(params, DEFAULT_PAGE);
      });
    },
    [updateQuery, valueKeys],
  );

  const resetQueryControllerValues = useCallback(
    (names?: string[]) => {
      updateQuery((params) => {
        const nextNames = names ?? Array.from(valueKeys);
        nextNames.forEach((name) => {
          if (valueKeys.has(name)) {
            params.delete(name);
          }
        });
        setPage(params, DEFAULT_PAGE);
      });
    },
    [updateQuery, valueKeys],
  );

  const query = useMemo<CrudQueryController>(
    () => ({
      hasName: hasQueryName,
      resetValues: resetQueryControllerValues,
      setValue: setQueryControllerValue,
      setValues: setQueryControllerValues,
      values,
    }),
    [
      hasQueryName,
      resetQueryControllerValues,
      setQueryControllerValue,
      setQueryControllerValues,
      values,
    ],
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

  const changeSorts = useCallback(
    (nextSorts: CrudSortRule[]) => {
      updateQuery((params) => {
        setSorts(params, nextSorts);
      });
    },
    [updateQuery],
  );

  const requestParams = useMemo(
    () =>
      getRequestParams({
        extraQuery: stableExtraQuery,
        filters: stableFilters,
        page: current,
        pageSize,
        quickSearchName,
        sorts,
        values,
      }),
    [current, stableExtraQuery, stableFilters, pageSize, quickSearchName, sorts, values],
  );

  return {
    current,
    pageSize,
    sorts,
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
    changeSorts,
  };
}
