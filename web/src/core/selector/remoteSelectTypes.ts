import type { SelectProps } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import type { ReactNode } from 'react';

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
