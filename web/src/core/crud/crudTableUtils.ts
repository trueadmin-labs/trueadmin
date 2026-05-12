import type { CardProps, CardSemanticStyles, CardStylesType } from 'antd/es/card/Card';
import type { SorterResult, SortOrder } from 'antd/es/table/interface';
import type { CSSProperties } from 'react';
import type { CrudColumns, CrudSortOrder, CrudSortRule } from './types';

export const joinClassNames = (...classNames: Array<string | undefined | false>) =>
  classNames.filter(Boolean).join(' ');

export const toPermissionCode = (resource: string, action: string) =>
  `${resource.replaceAll('.', ':')}:${action}`;

export const mergeCardBodyStyles = (
  cardStyles: CardStylesType | undefined,
  bodyStyle: CSSProperties,
): CardStylesType => {
  const mergeBodyStyle = (nextStyles?: CardSemanticStyles): CardSemanticStyles => ({
    ...nextStyles,
    body: { ...bodyStyle, ...nextStyles?.body },
  });

  if (typeof cardStyles === 'function') {
    return (info: { props: CardProps }) => mergeBodyStyle(cardStyles(info));
  }

  return mergeBodyStyle(cardStyles);
};

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

export const toCrudSortOrder = (order: SortOrder | undefined): CrudSortOrder | undefined => {
  if (order === 'ascend') {
    return 'asc';
  }
  if (order === 'descend') {
    return 'desc';
  }
  return undefined;
};

export const getSorterResults = <TRecord extends Record<string, unknown>>(
  sorter: SorterResult<TRecord> | SorterResult<TRecord>[],
) => (Array.isArray(sorter) ? sorter : [sorter]).filter((item) => item.order);

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

export const getSortRules = <TRecord extends Record<string, unknown>>(
  sorter: SorterResult<TRecord> | SorterResult<TRecord>[],
): CrudSortRule[] =>
  getSorterResults(sorter).flatMap((item) => {
    const field = getSorterKey(item);
    const order = toCrudSortOrder(item.order);
    return field && order ? [{ field, order }] : [];
  });
