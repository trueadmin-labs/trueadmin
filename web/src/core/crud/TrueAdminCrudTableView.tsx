import type { TableProps } from 'antd';
import { Button, Empty, Result, Table } from 'antd';
import type { TranslateFunction } from '@/core/i18n/trans';
import type {
  CrudColumns,
  CrudTableLocale,
  CrudTableRenderContext,
  TrueAdminCrudTableProps,
} from './types';

type TrueAdminCrudTableViewProps<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
> = {
  columns: CrudColumns<TRecord>;
  dataSource: TRecord[];
  emptyRender?: TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>['emptyRender'];
  error?: unknown;
  errorRender?: TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>['errorRender'];
  loading: boolean;
  locale?: CrudTableLocale;
  mergedRowSelection?: TableProps<TRecord>['rowSelection'];
  renderContext: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>;
  reload: () => void;
  rowKey: TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>['rowKey'];
  tableBodyScrollY?: number;
  tableProps?: TableProps<TRecord>;
  tableScrollX?: TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>['tableScrollX'];
  t: TranslateFunction;
  onChange: TableProps<TRecord>['onChange'];
};

export function TrueAdminCrudTableView<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({
  columns,
  dataSource,
  emptyRender,
  error,
  errorRender,
  loading,
  locale,
  mergedRowSelection,
  renderContext,
  reload,
  rowKey,
  tableBodyScrollY,
  tableProps,
  tableScrollX,
  t,
  onChange,
}: TrueAdminCrudTableViewProps<TRecord, TCreate, TUpdate, TMeta>) {
  if (error) {
    return (
      errorRender?.(renderContext) ?? (
        <Result
          status="error"
          title={locale?.errorTitle ?? t('crud.error.loadFailed', '数据加载失败')}
          subTitle={
            locale?.errorDescription ??
            t('crud.error.loadFailedDescription', '请稍后重试或联系管理员。')
          }
          extra={
            <Button type="primary" onClick={reload}>
              {locale?.reloadText ?? t('crud.action.reload', '刷新')}
            </Button>
          }
        />
      )
    );
  }

  const emptyContent = locale?.emptyText ??
    emptyRender?.(renderContext) ??
    tableProps?.locale?.emptyText ?? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;

  return (
    <Table<TRecord>
      {...tableProps}
      rowKey={rowKey as TableProps<TRecord>['rowKey']}
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      locale={{ ...tableProps?.locale, emptyText: emptyContent }}
      pagination={false}
      rowSelection={mergedRowSelection}
      scroll={{
        ...tableProps?.scroll,
        x: tableProps?.scroll?.x ?? tableScrollX,
        y: tableProps?.scroll?.y ?? tableBodyScrollY,
      }}
      onChange={onChange}
    />
  );
}
