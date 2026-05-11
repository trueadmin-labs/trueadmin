import type { SorterResult, SortOrder } from 'antd/es/table/interface';
import type { CrudColumns, CrudOrder } from './types';

export const toPermissionCode = (resource: string, action: string) =>
  `${resource.replaceAll('.', ':')}:${action}`;

export const getColumnSortKey = <TRecord extends Record<string, unknown>>(
  column: CrudColumns<TRecord>[number],
) => {
  if (typeof column.key === 'string') {
    return column.key;
  }
  if (!('dataIndex' in column)) {
    return undefined;
  }
  if (typeof column.dataIndex === 'string') {
    return column.dataIndex;
  }
  if (Array.isArray(column.dataIndex)) {
    return column.dataIndex.join('.');
  }
  return undefined;
};

export const toCrudOrder = (order: SortOrder | undefined): CrudOrder | undefined => {
  if (order === 'ascend') {
    return 'asc';
  }
  if (order === 'descend') {
    return 'desc';
  }
  return undefined;
};

export const getSorterResult = <TRecord extends Record<string, unknown>>(
  sorter: SorterResult<TRecord> | SorterResult<TRecord>[],
) => (Array.isArray(sorter) ? sorter[0] : sorter);

export const getSorterKey = <TRecord extends Record<string, unknown>>(
  sorter: SorterResult<TRecord>,
) => {
  if (typeof sorter.columnKey === 'string') {
    return sorter.columnKey;
  }
  if (typeof sorter.field === 'string') {
    return sorter.field;
  }
  if (Array.isArray(sorter.field)) {
    return sorter.field.join('.');
  }
  return undefined;
};
