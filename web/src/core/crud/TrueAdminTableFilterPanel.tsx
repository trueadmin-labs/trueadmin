import { SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, Select, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo } from 'react';
import type { CrudFilterSchema } from './types';

export type TrueAdminTableFilterPanelProps = {
  expanded: boolean;
  filters: CrudFilterSchema[];
  values: Record<string, string>;
  onReset: () => void;
  onSubmit: (values: Record<string, string | undefined>) => void;
  onTransitionEnd?: () => void;
};

type FilterFormValues = Record<string, unknown>;

const splitListValue = (value?: string) => (value ? value.split(',').filter(Boolean) : undefined);

const toFormValues = (filters: CrudFilterSchema[], values: Record<string, string>) => {
  const formValues: FilterFormValues = {};

  filters.forEach((filter) => {
    const value = values[filter.name];
    if (!value) {
      return;
    }

    if (filter.type === 'select' && filter.mode === 'multiple') {
      formValues[filter.name] = splitListValue(value);
      return;
    }

    if (filter.type === 'dateRange') {
      const [start, end] = splitListValue(value) ?? [];
      if (start && end) {
        formValues[filter.name] = [dayjs(start), dayjs(end)];
      }
      return;
    }

    formValues[filter.name] = value;
  });

  return formValues;
};

const getEmptyFormValues = (filters: CrudFilterSchema[]) =>
  filters.reduce<FilterFormValues>((result, filter) => {
    result[filter.name] = undefined;
    return result;
  }, {});

const normalizeFieldValue = (filter: CrudFilterSchema, value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (filter.type === 'select' && filter.mode === 'multiple') {
    const listValue = Array.isArray(value) ? value : [];
    return listValue.length > 0 ? listValue.join(',') : undefined;
  }

  if (filter.type === 'dateRange') {
    const rangeValue = Array.isArray(value) ? (value as Dayjs[]) : [];
    if (rangeValue.length !== 2 || !rangeValue[0] || !rangeValue[1]) {
      return undefined;
    }
    return `${rangeValue[0].format('YYYY-MM-DD')},${rangeValue[1].format('YYYY-MM-DD')}`;
  }

  return String(value).trim() || undefined;
};

function FilterField({
  filter,
  value,
  onChange,
}: {
  filter: CrudFilterSchema;
  value?: unknown;
  onChange?: (value: unknown) => void;
}) {
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

export function TrueAdminTableFilterPanel({
  expanded,
  filters,
  values,
  onReset,
  onSubmit,
  onTransitionEnd,
}: TrueAdminTableFilterPanelProps) {
  const [form] = Form.useForm<FilterFormValues>();
  const formValues = useMemo(() => toFormValues(filters, values), [filters, values]);

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(formValues);
  }, [form, formValues]);

  useEffect(() => {
    if (!expanded) {
      form.resetFields();
      form.setFieldsValue(formValues);
    }
  }, [expanded, form, formValues]);

  if (filters.length === 0) {
    return null;
  }

  const handleFinish = (nextValues: FilterFormValues) => {
    const normalizedValues: Record<string, string | undefined> = {};
    filters.forEach((filter) => {
      normalizedValues[filter.name] = normalizeFieldValue(filter, nextValues[filter.name]);
    });
    onSubmit(normalizedValues);
  };

  const handleReset = () => {
    form.setFieldsValue(getEmptyFormValues(filters));
    onReset();
  };

  return (
    <div
      className={
        expanded ? 'trueadmin-crud-filter-panel is-expanded' : 'trueadmin-crud-filter-panel'
      }
      onTransitionEnd={(event) => {
        if (event.currentTarget === event.target && event.propertyName === 'grid-template-rows') {
          onTransitionEnd?.();
        }
      }}
    >
      <div className="trueadmin-crud-filter-panel-inner" aria-hidden={!expanded}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <div className="trueadmin-crud-filter-layout">
            <div className="trueadmin-crud-filter-content">
              <div className="trueadmin-crud-filter-grid">
                {filters.map((filter) => (
                  <Form.Item key={filter.name} label={filter.label} name={filter.name}>
                    <FilterField filter={filter} />
                  </Form.Item>
                ))}
              </div>
            </div>
            <div className="trueadmin-crud-filter-actions">
              <Space orientation="vertical" size={8}>
                <Button
                  block
                  type="primary"
                  htmlType="button"
                  icon={<SearchOutlined />}
                  onClick={() => form.submit()}
                >
                  查询
                </Button>
                <Button block htmlType="button" onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
