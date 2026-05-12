import { serializeCrudParams } from '@trueadmin/web-core/crud';
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
  removeCrudParams,
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
    () =>
      createParamsObject(searchParams, {
        extraQuery: stableExtraQuery,
        filters: stableFilters,
        quickSearchName,
      }),
    [quickSearchName, searchParams, stableExtraQuery, stableFilters],
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

  const writeCrudQuery = useCallback(
    ({
      nextPage = current,
      nextPageSize = pageSize,
      nextSorts = sorts,
      nextValues = values,
    }: {
      nextPage?: number;
      nextPageSize?: number;
      nextSorts?: CrudSortRule[];
      nextValues?: Record<string, string>;
    }) => {
      const requestParams = getRequestParams({
        extraQuery: stableExtraQuery,
        filters: stableFilters,
        page: nextPage,
        pageSize: nextPageSize,
        quickSearchName,
        sorts: nextSorts,
        values: nextValues,
      });
      const serializedParams = serializeCrudParams(requestParams);

      updateQuery((params) => {
        removeCrudParams(params, valueKeys);
        serializedParams.forEach((value, key) => {
          params.append(key, value);
        });
      });
    },
    [
      current,
      pageSize,
      quickSearchName,
      sorts,
      stableExtraQuery,
      stableFilters,
      updateQuery,
      valueKeys,
      values,
    ],
  );

  const submitQuickSearch = useCallback(
    (value: string) => {
      if (!quickSearchName) {
        return;
      }
      writeCrudQuery({
        nextPage: DEFAULT_PAGE,
        nextValues: {
          ...values,
          [quickSearchName]: value,
        },
      });
    },
    [quickSearchName, values, writeCrudQuery],
  );

  const clearQuickSearch = useCallback(() => {
    if (!quickSearchName) {
      return;
    }
    const nextValues = { ...values };
    delete nextValues[quickSearchName];
    writeCrudQuery({ nextPage: DEFAULT_PAGE, nextValues });
  }, [quickSearchName, values, writeCrudQuery]);

  const submitFilters = useCallback(
    (nextValues: Record<string, string | undefined>) => {
      const mergedValues = { ...values };
      filterNames.forEach((name) => {
        const value = nextValues[name]?.trim();
        if (value) {
          mergedValues[name] = value;
          return;
        }
        delete mergedValues[name];
      });
      writeCrudQuery({
        nextPage: DEFAULT_PAGE,
        nextValues: mergedValues,
      });
    },
    [filterNames, values, writeCrudQuery],
  );

  const resetFilters = useCallback(() => {
    const nextValues = { ...values };
    filterNames.forEach((name) => {
      delete nextValues[name];
    });
    if (quickSearchName) {
      delete nextValues[quickSearchName];
    }
    writeCrudQuery({
      nextPage: DEFAULT_PAGE,
      nextSorts: [],
      nextValues,
    });
  }, [filterNames, quickSearchName, values, writeCrudQuery]);

  const hasQueryName = useCallback((name: string) => valueKeys.has(name), [valueKeys]);

  const setQueryControllerValue = useCallback(
    (name: string, value?: string) => {
      if (!valueKeys.has(name)) {
        return;
      }
      const nextValues = { ...values };
      const normalized = value?.trim();
      if (normalized) {
        nextValues[name] = normalized;
      } else {
        delete nextValues[name];
      }
      writeCrudQuery({ nextPage: DEFAULT_PAGE, nextValues });
    },
    [valueKeys, values, writeCrudQuery],
  );

  const setQueryControllerValues = useCallback(
    (nextValues: Record<string, string | undefined>) => {
      const mergedValues = { ...values };
      Object.entries(nextValues).forEach(([name, value]) => {
        if (!valueKeys.has(name)) {
          return;
        }
        const normalized = value?.trim();
        if (normalized) {
          mergedValues[name] = normalized;
          return;
        }
        delete mergedValues[name];
      });
      writeCrudQuery({
        nextPage: DEFAULT_PAGE,
        nextValues: mergedValues,
      });
    },
    [valueKeys, values, writeCrudQuery],
  );

  const resetQueryControllerValues = useCallback(
    (names?: string[]) => {
      const mergedValues = { ...values };
      const nextNames = names ?? Array.from(valueKeys);
      nextNames.forEach((name) => {
        if (valueKeys.has(name)) {
          delete mergedValues[name];
        }
      });
      writeCrudQuery({
        nextPage: DEFAULT_PAGE,
        nextValues: mergedValues,
      });
    },
    [valueKeys, values, writeCrudQuery],
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
      writeCrudQuery({
        nextPage: nextPage ?? DEFAULT_PAGE,
        nextPageSize: nextPageSize ?? defaultPageSize,
      });
    },
    [defaultPageSize, writeCrudQuery],
  );

  const changeSorts = useCallback(
    (nextSorts: CrudSortRule[]) => {
      writeCrudQuery({ nextSorts });
    },
    [writeCrudQuery],
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
