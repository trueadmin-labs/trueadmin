import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, Select, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import type { CrudFilterPanelProps, CrudFilterSchema, CrudTableLocale } from './types';

export type TrueAdminTableFilterPanelProps = {
  expanded: boolean;
  filters: CrudFilterSchema[];
  locale?: CrudTableLocale;
  panelProps?: CrudFilterPanelProps;
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

export function TrueAdminTableFilterPanel({
  expanded,
  filters,
  locale,
  panelProps,
  values,
  onReset,
  onSubmit,
  onTransitionEnd,
}: TrueAdminTableFilterPanelProps) {
  const { t } = useI18n();
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

  const searchText = locale?.filterSearchText ?? t('crud.filter.search', '查询');
  const resetText = locale?.filterResetText ?? t('crud.filter.reset', '重置');

  return (
    <div
      className={[
        'trueadmin-crud-filter-panel',
        expanded ? 'is-expanded' : '',
        panelProps?.classNames?.root,
        panelProps?.className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...panelProps?.styles?.root, ...panelProps?.style }}
      onTransitionEnd={(event) => {
        if (event.currentTarget === event.target && event.propertyName === 'grid-template-rows') {
          onTransitionEnd?.();
        }
      }}
    >
      <div
        className={['trueadmin-crud-filter-panel-inner', panelProps?.classNames?.inner]
          .filter(Boolean)
          .join(' ')}
        style={panelProps?.styles?.inner}
        aria-hidden={!expanded}
      >
        <Form
          {...panelProps?.formProps}
          className={panelProps?.classNames?.form}
          form={form}
          layout="vertical"
          style={{ ...panelProps?.styles?.form, ...panelProps?.formProps?.style }}
          onFinish={handleFinish}
        >
          <div
            className={['trueadmin-crud-filter-layout', panelProps?.classNames?.layout]
              .filter(Boolean)
              .join(' ')}
            style={panelProps?.styles?.layout}
          >
            <div
              className={['trueadmin-crud-filter-content', panelProps?.classNames?.content]
                .filter(Boolean)
                .join(' ')}
              style={panelProps?.styles?.content}
            >
              <div
                className={['trueadmin-crud-filter-grid', panelProps?.classNames?.grid]
                  .filter(Boolean)
                  .join(' ')}
                style={panelProps?.styles?.grid}
              >
                {filters.map((filter) => (
                  <Form.Item key={filter.name} label={filter.label} name={filter.name}>
                    <FilterField filter={filter} />
                  </Form.Item>
                ))}
              </div>
            </div>
            <div
              className={['trueadmin-crud-filter-actions', panelProps?.classNames?.actions]
                .filter(Boolean)
                .join(' ')}
              style={panelProps?.styles?.actions}
            >
              <Space
                className={panelProps?.classNames?.actionSpace}
                orientation="vertical"
                size={8}
                style={panelProps?.styles?.actionSpace}
              >
                <Button
                  {...panelProps?.searchButtonProps}
                  className={panelProps?.classNames?.searchButton}
                  type="primary"
                  htmlType="button"
                  icon={<SearchOutlined />}
                  style={{
                    ...panelProps?.styles?.searchButton,
                    ...panelProps?.searchButtonProps?.style,
                  }}
                  onClick={() => form.submit()}
                >
                  {searchText}
                </Button>
                <Button
                  {...panelProps?.resetButtonProps}
                  className={panelProps?.classNames?.resetButton}
                  htmlType="button"
                  icon={<ReloadOutlined />}
                  style={{
                    ...panelProps?.styles?.resetButton,
                    ...panelProps?.resetButtonProps?.style,
                  }}
                  onClick={handleReset}
                >
                  {resetText}
                </Button>
              </Space>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
