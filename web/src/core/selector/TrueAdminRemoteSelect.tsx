import { Select } from 'antd';
import type { DefaultOptionType, SelectValue } from 'antd/es/select';
import { RemoteSelectNotFoundContent } from './RemoteSelectNotFoundContent';
import type { TrueAdminRemoteSelectProps, TrueAdminRemoteSelectValue } from './remoteSelectTypes';
import { DEFAULT_PAGE_SIZE, DEFAULT_SEARCH_DELAY, toValueKey } from './remoteSelectUtils';
import { useRemoteSelectOptions } from './useRemoteSelectOptions';
import { useRemoteSelectRecords } from './useRemoteSelectRecords';

export type {
  TrueAdminRemoteSelectOption,
  TrueAdminRemoteSelectProps,
  TrueAdminRemoteSelectSearchParams,
  TrueAdminRemoteSelectValue,
} from './remoteSelectTypes';

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
  const { keyword, loadOptions, loading, records, search, selectedRecords } =
    useRemoteSelectRecords<TRecord, TValue, TMultiple>({
      autoLoad,
      defaultKeyword,
      defaultOptions,
      defaultValue,
      fetchByValues,
      fetchOptions,
      onLoadOptionsError,
      pageSize,
      searchDelay,
      value,
    });
  const { options, recordMap } = useRemoteSelectOptions<TRecord, TValue, TMultiple>({
    getDisabled,
    getLabel,
    getValue,
    optionRender,
    records,
    selectedOptions,
    selectedRecords,
  });

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
      notFoundContent={
        <RemoteSelectNotFoundContent
          emptyText={emptyText}
          loading={loading}
          loadingText={loadingText}
        />
      }
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
      onSearch={search}
    />
  );
}
