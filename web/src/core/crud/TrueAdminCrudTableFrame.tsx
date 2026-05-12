import { Card } from 'antd';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { joinClassNames, mergeCardBodyStyles } from './crudTableUtils';
import type { CrudTableDomList, TrueAdminCrudTableProps } from './types';

type BuildCrudTableFrameOptions<
  TRecord extends Record<string, unknown>,
  TCreate,
  TUpdate,
  TMeta,
> = Pick<
  TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>,
  'cardProps' | 'className' | 'classNames' | 'style' | 'styles'
> & {
  extraDom: ReactNode;
  paginationDom: ReactNode;
  searchDom: ReactNode;
  selectedStatusDom: ReactNode;
  summaryDom: ReactNode;
  tableMainRef: RefObject<HTMLDivElement | null>;
  tableMainStyle: CSSProperties;
  tableViewDom: ReactNode;
  toolbarDom: ReactNode;
};

export function buildCrudTableFrame<
  TRecord extends Record<string, unknown>,
  TCreate,
  TUpdate,
  TMeta,
>({
  cardProps,
  className,
  classNames,
  extraDom,
  paginationDom,
  searchDom,
  selectedStatusDom,
  style,
  styles,
  summaryDom,
  tableMainRef,
  tableMainStyle,
  tableViewDom,
  toolbarDom,
}: BuildCrudTableFrameOptions<TRecord, TCreate, TUpdate, TMeta>) {
  const tableAreaDom = (
    <Card
      {...cardProps}
      className={joinClassNames(
        'trueadmin-crud-table-card',
        classNames?.card,
        cardProps?.className,
      )}
      style={{ ...styles?.card, ...cardProps?.style }}
      styles={mergeCardBodyStyles(cardProps?.styles, { padding: 0 })}
    >
      {toolbarDom}
      <div
        ref={tableMainRef}
        className={joinClassNames('trueadmin-crud-table-main', classNames?.tableMain)}
        style={{ ...tableMainStyle, ...styles?.tableMain }}
      >
        {tableViewDom}
      </div>
      {paginationDom}
    </Card>
  );
  const wrappedSearchDom = searchDom ? (
    <div className={joinClassNames(classNames?.search)} style={styles?.search}>
      {searchDom}
    </div>
  ) : null;
  const domList: CrudTableDomList = {
    alert: selectedStatusDom,
    extra: extraDom,
    pagination: paginationDom,
    search: wrappedSearchDom,
    summary: summaryDom,
    table: tableViewDom,
    toolbar: toolbarDom,
  };
  const defaultDom = (
    <div
      className={joinClassNames('trueadmin-crud-shell', classNames?.shell, className)}
      style={{ ...styles?.shell, ...style }}
    >
      {summaryDom}
      {wrappedSearchDom}
      {extraDom}
      {tableAreaDom}
    </div>
  );

  return { defaultDom, domList };
}
