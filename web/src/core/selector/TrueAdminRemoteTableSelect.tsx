import { TableOutlined } from '@ant-design/icons';
import {
  TrueAdminRemoteSelect,
  type TrueAdminRemoteSelectProps,
  type TrueAdminRemoteSelectValue,
} from '@trueadmin/web-antd/remote-select';
import type { ButtonProps } from 'antd';
import { Button, Space, Tooltip } from 'antd';
import type { Key, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminTablePicker, type TrueAdminTablePickerProps } from './TrueAdminTablePicker';

export type TrueAdminRemoteTableSelectProps<
  TRecord extends Record<string, unknown>,
  TValue extends TrueAdminRemoteSelectValue = TrueAdminRemoteSelectValue,
  TMultiple extends boolean = false,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
> = Omit<TrueAdminRemoteSelectProps<TRecord, TValue, TMultiple>, 'selectedOptions'> & {
  picker: Omit<
    TrueAdminTablePickerProps<TRecord, TCreate, TUpdate, TMeta>,
    'defaultValue' | 'multiple' | 'open' | 'selectedRows' | 'value'
  >;
  pickerButtonTooltip?: ReactNode;
  pickerButtonProps?: Omit<ButtonProps, 'onClick'>;
  selectClassName?: string;
  selectStyle?: React.CSSProperties;
};

const toValueArray = <TValue extends TrueAdminRemoteSelectValue>(
  value: TValue | TValue[] | undefined,
): TValue[] => {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const toKeyArray = <TValue extends TrueAdminRemoteSelectValue>(
  value: TValue | TValue[] | undefined,
): Key[] => toValueArray(value).map((item) => item as Key);

export function TrueAdminRemoteTableSelect<
  TRecord extends Record<string, unknown>,
  TValue extends TrueAdminRemoteSelectValue = TrueAdminRemoteSelectValue,
  TMultiple extends boolean = false,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>(props: TrueAdminRemoteTableSelectProps<TRecord, TValue, TMultiple, TCreate, TUpdate, TMeta>) {
  const {
    className,
    defaultValue,
    disabled,
    multiple,
    onChange,
    picker,
    pickerButtonProps,
    pickerButtonTooltip,
    selectClassName,
    selectStyle,
    style,
    value,
    ...selectProps
  } = props;
  const isValueControlled = Object.hasOwn(props, 'value');
  const { t } = useI18n();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [innerValue, setInnerValue] = useState(defaultValue);
  const [selectedRecords, setSelectedRecords] = useState<TRecord[]>([]);
  const [draftKeys, setDraftKeys] = useState<Key[]>([]);
  const [draftRows, setDraftRows] = useState<TRecord[]>([]);
  const mergedValue = isValueControlled ? value : innerValue;

  const {
    onCancel: pickerOnCancel,
    onChange: pickerOnChange,
    onConfirm: pickerOnConfirm,
    ...pickerProps
  } = picker;

  const selectedOptions = useMemo(() => {
    const map = new Map<string, TRecord>();
    [...selectedRecords, ...draftRows].forEach((record) => {
      map.set(String(selectProps.getValue(record)), record);
    });
    return [...map.values()];
  }, [draftRows, selectedRecords, selectProps.getValue]);

  const updateValue = useCallback(
    (
      nextValue: TMultiple extends true ? TValue[] : TValue | undefined,
      nextRecords: TMultiple extends true ? TRecord[] : TRecord | undefined,
    ) => {
      const nextRecordList: TRecord[] = Array.isArray(nextRecords)
        ? (nextRecords as TRecord[])
        : nextRecords
          ? [nextRecords as TRecord]
          : [];
      setSelectedRecords(nextRecordList);
      if (!isValueControlled) {
        setInnerValue(nextValue as TMultiple extends true ? TValue[] : TValue);
      }
      onChange?.(nextValue, nextRecords);
    },
    [isValueControlled, onChange],
  );

  const openPicker = () => {
    setDraftKeys(toKeyArray(mergedValue));
    setDraftRows(selectedRecords);
    setPickerOpen(true);
  };

  const handlePickerConfirm = (keys: Key[], rows: TRecord[]) => {
    const nextValue = (
      multiple ? keys.map((key) => key as TValue) : (keys[0] as TValue | undefined)
    ) as TMultiple extends true ? TValue[] : TValue | undefined;
    const nextRecords = (multiple ? rows : rows[0]) as TMultiple extends true
      ? TRecord[]
      : TRecord | undefined;

    updateValue(nextValue, nextRecords);
    pickerOnConfirm?.(keys, rows);
    setPickerOpen(false);
  };

  const handlePickerCancel = () => {
    pickerOnCancel?.();
    setPickerOpen(false);
  };

  return (
    <>
      <Space.Compact block className={className} style={style}>
        <TrueAdminRemoteSelect<TRecord, TValue, TMultiple>
          {...selectProps}
          className={selectClassName}
          disabled={disabled}
          defaultValue={undefined}
          multiple={multiple}
          selectedOptions={selectedOptions}
          style={{ width: '100%', ...selectStyle }}
          value={mergedValue}
          onChange={(nextValue, records) => {
            updateValue(nextValue, records);
          }}
        />
        <Tooltip title={pickerButtonTooltip ?? t('selector.table.open', '表格选择')}>
          <Button
            {...pickerButtonProps}
            className="trueadmin-remote-table-select-trigger"
            disabled={disabled || pickerButtonProps?.disabled}
            icon={<TableOutlined />}
            type={pickerButtonProps?.type ?? 'default'}
            onClick={openPicker}
          />
        </Tooltip>
      </Space.Compact>
      <TrueAdminTablePicker<TRecord, TCreate, TUpdate, TMeta>
        {...pickerProps}
        multiple={multiple}
        open={pickerOpen}
        selectedRows={selectedOptions}
        value={draftKeys}
        onCancel={handlePickerCancel}
        onChange={(keys, rows) => {
          setDraftKeys(keys);
          setDraftRows(rows);
          pickerOnChange?.(keys, rows);
        }}
        onConfirm={handlePickerConfirm}
      />
    </>
  );
}
