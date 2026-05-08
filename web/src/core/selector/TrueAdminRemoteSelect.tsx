import type { SelectProps } from 'antd';
import { Select } from 'antd';
import type { DefaultOptionType, SelectValue } from 'antd/es/select';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { errorCenter } from '@/core/error/errorCenter';

export type TrueAdminRemoteSelectValue = string | number;

export type TrueAdminRemoteSelectOption<
  TValue extends TrueAdminRemoteSelectValue = TrueAdminRemoteSelectValue,
  TRecord = unknown,
> = {
  label: ReactNode;
  value: TValue;
  disabled?: boolean;
  record: TRecord;
};

export type TrueAdminRemoteSelectSearchParams = {
  keyword: string;
  page?: number;
  pageSize?: number;
};

export type TrueAdminRemoteSelectProps<
  TRecord,
  TValue extends TrueAdminRemoteSelectValue = TrueAdminRemoteSelectValue,
  TMultiple extends boolean = false,
> = Omit<
  SelectProps<TMultiple extends true ? TValue[] : TValue, DefaultOptionType>,
  | 'filterOption'
  | 'labelInValue'
  | 'loading'
  | 'mode'
  | 'notFoundContent'
  | 'onChange'
  | 'onSearch'
  | 'optionRender'
  | 'options'
  | 'showSearch'
> & {
  value?: TMultiple extends true ? TValue[] : TValue;
  defaultValue?: TMultiple extends true ? TValue[] : TValue;
  multiple?: TMultiple;
  fetchOptions: (params: TrueAdminRemoteSelectSearchParams) => Promise<TRecord[]>;
  fetchByValues?: (values: TValue[]) => Promise<TRecord[]>;
  getValue: (record: TRecord) => TValue;
  getLabel: (record: TRecord) => ReactNode;
  getDisabled?: (record: TRecord) => boolean;
  optionRender?: (record: TRecord) => ReactNode;
  autoLoad?: boolean;
  searchDelay?: number;
  defaultKeyword?: string;
  defaultOptions?: TRecord[];
  selectedOptions?: TRecord[];
  pageSize?: number;
  searchOnFocus?: boolean;
  loadingText?: ReactNode;
  emptyText?: ReactNode;
  onChange?: (
    value: TMultiple extends true ? TValue[] : TValue | undefined,
    records: TMultiple extends true ? TRecord[] : TRecord | undefined,
  ) => void;
  onLoadOptionsError?: (error: unknown) => false | undefined;
};

const DEFAULT_SEARCH_DELAY = 300;
const DEFAULT_PAGE_SIZE = 20;

const toValueArray = <TValue extends TrueAdminRemoteSelectValue>(
  value: TValue | TValue[] | undefined,
): TValue[] => {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const toValueKey = (value: TrueAdminRemoteSelectValue) => String(value);

export function TrueAdminRemoteSelect<
  TRecord,
  TValue extends TrueAdminRemoteSelectValue = TrueAdminRemoteSelectValue,
  TMultiple extends boolean = false,
>({
  defaultKeyword = '',
  defaultOptions = [],
  emptyText,
  autoLoad = false,
  fetchByValues,
  fetchOptions,
  getDisabled,
  getLabel,
  getValue,
  loadingText,
  multiple,
  onChange,
  onLoadOptionsError,
  optionRender,
  selectedOptions = [],
  pageSize = DEFAULT_PAGE_SIZE,
  searchDelay = DEFAULT_SEARCH_DELAY,
  searchOnFocus = true,
  value,
  defaultValue,
  ...selectProps
}: TrueAdminRemoteSelectProps<TRecord, TValue, TMultiple>) {
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
      setSelectedRecords([]);
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

  const recordMap = useMemo(() => {
    const map = new Map<string, TRecord>();
    for (const record of [...records, ...selectedRecords, ...selectedOptions]) {
      map.set(toValueKey(getValue(record)), record);
    }
    return map;
  }, [getValue, records, selectedOptions, selectedRecords]);

  const options = useMemo(
    () =>
      [...recordMap.values()].map((record) => {
        const nextValue = getValue(record);
        return {
          disabled: getDisabled?.(record),
          label: optionRender?.(record) ?? getLabel(record),
          value: nextValue,
        };
      }),
    [getDisabled, getLabel, getValue, optionRender, recordMap],
  );

  const handleChange = (nextValue: SelectValue) => {
    if (multiple) {
      const nextValues = (Array.isArray(nextValue) ? nextValue : []) as TValue[];
      const nextRecords = nextValues
        .map((item) => recordMap.get(toValueKey(item)))
        .filter((item): item is TRecord => Boolean(item));
      onChange?.(
        nextValues as TMultiple extends true ? TValue[] : TValue | undefined,
        nextRecords as TMultiple extends true ? TRecord[] : TRecord | undefined,
      );
      return;
    }

    const nextSingleValue = nextValue as TValue | undefined;
    const nextRecord =
      nextSingleValue === undefined ? undefined : recordMap.get(toValueKey(nextSingleValue));
    onChange?.(
      nextSingleValue as TMultiple extends true ? TValue[] : TValue | undefined,
      nextRecord as TMultiple extends true ? TRecord[] : TRecord | undefined,
    );
  };

  return (
    <Select<TMultiple extends true ? TValue[] : TValue, DefaultOptionType>
      {...selectProps}
      defaultValue={defaultValue}
      filterOption={false}
      loading={loading}
      mode={multiple ? 'multiple' : undefined}
      notFoundContent={loading ? loadingText : emptyText}
      options={options}
      showSearch
      value={value}
      onChange={handleChange}
      onFocus={(event) => {
        selectProps.onFocus?.(event);
        if (searchOnFocus && records.length === 0) {
          void loadOptions(keyword);
        }
      }}
      onSearch={(nextKeyword) => {
        setKeyword(nextKeyword);
        setSearchSeed((seed) => seed + 1);
      }}
    />
  );
}
