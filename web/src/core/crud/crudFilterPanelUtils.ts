import dayjs, { type Dayjs } from 'dayjs';
import type { CrudFilterSchema } from './types';

export type FilterFormValues = Record<string, unknown>;

const splitListValue = (value?: string) => (value ? value.split(',').filter(Boolean) : undefined);

export const toFilterFormValues = (filters: CrudFilterSchema[], values: Record<string, string>) => {
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

export const getEmptyFilterFormValues = (filters: CrudFilterSchema[]) =>
  filters.reduce<FilterFormValues>((result, filter) => {
    result[filter.name] = undefined;
    return result;
  }, {});

export const normalizeFilterFieldValue = (filter: CrudFilterSchema, value: unknown) => {
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
