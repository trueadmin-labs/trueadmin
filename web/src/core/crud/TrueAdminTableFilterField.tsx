import { DatePicker, Input, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import type { CrudFilterSchema } from './types';

type TrueAdminTableFilterFieldProps = {
  filter: CrudFilterSchema;
  value?: unknown;
  onChange?: (value: unknown) => void;
};

export function TrueAdminTableFilterField({
  filter,
  value,
  onChange,
}: TrueAdminTableFilterFieldProps) {
  if (filter.type === 'input') {
    return (
      <Input
        allowClear
        value={typeof value === 'string' ? value : undefined}
        placeholder={filter.placeholder}
        onChange={(event) => onChange?.(event.target.value)}
      />
    );
  }

  if (filter.type === 'select') {
    return (
      <Select
        allowClear
        maxTagCount={filter.mode === 'multiple' ? (filter.maxTagCount ?? 1) : undefined}
        maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
        mode={filter.mode}
        value={value}
        options={filter.options}
        placeholder={filter.placeholder}
        onChange={onChange}
      />
    );
  }

  if (filter.type === 'dateRange') {
    return (
      <DatePicker.RangePicker
        className="trueadmin-crud-filter-date-range"
        value={Array.isArray(value) ? (value as [Dayjs, Dayjs]) : undefined}
        onChange={(nextValue) => onChange?.(nextValue ?? undefined)}
      />
    );
  }

  return filter.render({
    value: typeof value === 'string' ? value : undefined,
    onChange: (nextValue) => onChange?.(nextValue),
  });
}
