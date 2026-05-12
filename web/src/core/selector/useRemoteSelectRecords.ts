import { useCallback, useEffect, useRef, useState } from 'react';
import { errorCenter } from '@/core/error/errorCenter';
import type { TrueAdminRemoteSelectProps, TrueAdminRemoteSelectValue } from './remoteSelectTypes';
import { toValueArray } from './remoteSelectUtils';

type UseRemoteSelectRecordsOptions<
  TRecord,
  TValue extends TrueAdminRemoteSelectValue,
  TMultiple extends boolean,
> = Pick<
  TrueAdminRemoteSelectProps<TRecord, TValue, TMultiple>,
  | 'autoLoad'
  | 'defaultKeyword'
  | 'defaultOptions'
  | 'defaultValue'
  | 'fetchByValues'
  | 'fetchOptions'
  | 'onLoadOptionsError'
  | 'pageSize'
  | 'searchDelay'
  | 'value'
>;

export function useRemoteSelectRecords<
  TRecord,
  TValue extends TrueAdminRemoteSelectValue,
  TMultiple extends boolean,
>({
  autoLoad = false,
  defaultKeyword = '',
  defaultOptions = [],
  defaultValue,
  fetchByValues,
  fetchOptions,
  onLoadOptionsError,
  pageSize,
  searchDelay,
  value,
}: UseRemoteSelectRecordsOptions<TRecord, TValue, TMultiple>) {
  const requestIdRef = useRef(0);
  const [keyword, setKeyword] = useState(defaultKeyword);
  const [searchSeed, setSearchSeed] = useState(autoLoad ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<TRecord[]>(defaultOptions);
  const [selectedRecords, setSelectedRecords] = useState<TRecord[]>([]);

  const emitError = useCallback(
    (error: unknown) => {
      if (onLoadOptionsError?.(error) !== false) {
        errorCenter.emit(error);
      }
    },
    [onLoadOptionsError],
  );

  const loadOptions = useCallback(
    async (nextKeyword: string) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setLoading(true);
      try {
        const nextRecords = await fetchOptions({
          keyword: nextKeyword,
          page: 1,
          pageSize,
        });
        if (requestIdRef.current === requestId) {
          setRecords(nextRecords);
        }
      } catch (error) {
        if (requestIdRef.current === requestId) {
          emitError(error);
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [emitError, fetchOptions, pageSize],
  );

  const search = useCallback((nextKeyword: string) => {
    setKeyword(nextKeyword);
    setSearchSeed((seed) => seed + 1);
  }, []);

  useEffect(() => {
    if (searchSeed === 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      void loadOptions(keyword);
    }, searchDelay);

    return () => window.clearTimeout(timer);
  }, [keyword, loadOptions, searchDelay, searchSeed]);

  useEffect(() => {
    const values = toValueArray(value ?? defaultValue);
    if (!fetchByValues || values.length === 0) {
      setSelectedRecords((currentRecords) => (currentRecords.length === 0 ? currentRecords : []));
      return;
    }

    let disposed = false;
    fetchByValues(values)
      .then((nextRecords) => {
        if (!disposed) {
          setSelectedRecords(nextRecords);
        }
      })
      .catch((error) => {
        if (!disposed) {
          emitError(error);
        }
      });

    return () => {
      disposed = true;
    };
  }, [defaultValue, emitError, fetchByValues, value]);

  return {
    keyword,
    loadOptions,
    loading,
    records,
    search,
    selectedRecords,
  };
}
