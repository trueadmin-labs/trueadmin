import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Space } from 'antd';
import { useEffect, useMemo } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import {
  type FilterFormValues,
  getEmptyFilterFormValues,
  normalizeFilterFieldValue,
  toFilterFormValues,
} from './crudFilterPanelUtils';
import { TrueAdminTableFilterField } from './TrueAdminTableFilterField';
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
  const formValues = useMemo(() => toFilterFormValues(filters, values), [filters, values]);

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
      normalizedValues[filter.name] = normalizeFilterFieldValue(filter, nextValues[filter.name]);
    });
    onSubmit(normalizedValues);
  };

  const handleReset = () => {
    form.setFieldsValue(getEmptyFilterFormValues(filters));
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
                    <TrueAdminTableFilterField filter={filter} />
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
