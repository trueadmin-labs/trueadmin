import { useMemo } from 'react';
import type { TrueAdminRemoteSelectProps, TrueAdminRemoteSelectValue } from './remoteSelectTypes';
import { toValueKey } from './remoteSelectUtils';

type UseRemoteSelectOptionsOptions<
  TRecord,
  TValue extends TrueAdminRemoteSelectValue,
  TMultiple extends boolean,
> = Pick<
  TrueAdminRemoteSelectProps<TRecord, TValue, TMultiple>,
  'getDisabled' | 'getLabel' | 'getValue' | 'optionRender' | 'selectedOptions'
> & {
  records: TRecord[];
  selectedRecords: TRecord[];
};

export function useRemoteSelectOptions<
  TRecord,
  TValue extends TrueAdminRemoteSelectValue,
  TMultiple extends boolean,
>({
  getDisabled,
  getLabel,
  getValue,
  optionRender,
  records,
  selectedOptions = [],
  selectedRecords,
}: UseRemoteSelectOptionsOptions<TRecord, TValue, TMultiple>) {
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

  return { options, recordMap };
}
