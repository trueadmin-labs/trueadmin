import type { SelectProps } from 'antd';
import { Select } from 'antd';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { errorCenter } from '@/core/error/errorCenter';
import type { TrueAdminEnumOption } from './TrueAdminEnumTag';

export type TrueAdminDictValue = string | number;

export type TrueAdminDictOption<TValue extends TrueAdminDictValue = TrueAdminDictValue> =
  TrueAdminEnumOption<TValue> & {
    disabled?: boolean;
  };

const emptyOptions: Array<TrueAdminDictOption> = [];

export type TrueAdminDictSelectProps<TValue extends TrueAdminDictValue = TrueAdminDictValue> = Omit<
  SelectProps<TValue | TValue[]>,
  'loading' | 'options'
> & {
  options?: Array<TrueAdminDictOption<TValue>>;
  fetchOptions?: () => Promise<Array<TrueAdminDictOption<TValue>>>;
  autoLoad?: boolean;
  emptyText?: ReactNode;
  onLoadError?: (error: unknown) => false | undefined;
};

export function TrueAdminDictSelect<TValue extends TrueAdminDictValue = TrueAdminDictValue>({
  autoLoad = true,
  emptyText,
  fetchOptions,
  onLoadError,
  options = emptyOptions as Array<TrueAdminDictOption<TValue>>,
  onDropdownVisibleChange,
  onOpenChange,
  ...selectProps
}: TrueAdminDictSelectProps<TValue>) {
  const hasRemoteOptions = Boolean(fetchOptions);
  const [innerOptions, setInnerOptions] = useState<Array<TrueAdminDictOption<TValue>>>(options);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(options.length > 0);

  useEffect(() => {
    if (!hasRemoteOptions) {
      return;
    }

    setInnerOptions(options);
    if (options.length > 0) {
      setLoaded(true);
    }
  }, [hasRemoteOptions, options]);

  const loadOptions = async () => {
    if (!fetchOptions || loading || loaded) {
      return;
    }
    setLoading(true);
    try {
      setInnerOptions(await fetchOptions());
      setLoaded(true);
    } catch (error) {
      if (onLoadError?.(error) !== false) {
        errorCenter.emit(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      void loadOptions();
    }
  }, [autoLoad]);

  const selectOptions = useMemo(
    () =>
      (hasRemoteOptions ? innerOptions : options).map((option) => ({
        disabled: option.disabled,
        label: option.label,
        value: option.value,
      })),
    [hasRemoteOptions, innerOptions, options],
  );

  return (
    <Select<TValue | TValue[]>
      {...selectProps}
      loading={loading}
      notFoundContent={loading ? selectProps.notFoundContent : emptyText}
      options={selectOptions}
      onOpenChange={(open) => {
        onOpenChange?.(open);
        onDropdownVisibleChange?.(open);
        if (open) {
          void loadOptions();
        }
      }}
    />
  );
}
