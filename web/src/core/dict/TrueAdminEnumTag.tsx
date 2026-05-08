import { Space, Tag } from 'antd';
import type { ReactNode } from 'react';

export type TrueAdminEnumValue = string | number | boolean;

export type TrueAdminEnumOption<TValue extends TrueAdminEnumValue = TrueAdminEnumValue> = {
  label: ReactNode;
  value: TValue;
  color?: string;
};

export type TrueAdminEnumTagProps<TValue extends TrueAdminEnumValue = TrueAdminEnumValue> = {
  value?: TValue | TValue[] | null;
  options?: Array<TrueAdminEnumOption<TValue>>;
  labelMap?: Partial<Record<string, ReactNode>>;
  colorMap?: Partial<Record<string, string>>;
  fallback?: ReactNode;
  emptyText?: ReactNode;
  multiple?: boolean;
};

const toKey = (value: TrueAdminEnumValue) => String(value);

export function TrueAdminEnumTag<TValue extends TrueAdminEnumValue = TrueAdminEnumValue>({
  value,
  options = [],
  labelMap,
  colorMap,
  fallback,
  emptyText = '-',
}: TrueAdminEnumTagProps<TValue>) {
  const values = Array.isArray(value)
    ? value
    : value === undefined || value === null
      ? []
      : [value];
  const optionMap = new Map(options.map((option) => [toKey(option.value), option]));

  if (values.length === 0) {
    return <>{emptyText}</>;
  }

  return (
    <Space size={4} wrap>
      {values.map((item) => {
        const key = toKey(item);
        const option = optionMap.get(key);
        return (
          <Tag color={option?.color ?? colorMap?.[key] ?? 'default'} key={key}>
            {option?.label ?? labelMap?.[key] ?? fallback ?? key}
          </Tag>
        );
      })}
    </Space>
  );
}
