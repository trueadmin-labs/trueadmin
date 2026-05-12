import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Button, Popconfirm } from 'antd';
import { Permission } from '@/core/auth/Permission';
import { toPermissionCode } from './crudTableUtils';
import type {
  CrudColumns,
  CrudRowActionsConfig,
  CrudTableLocale,
  CrudTableRenderContext,
} from './types';

type CreateCrudOperationColumnsOptions<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
> = {
  canDelete: boolean;
  locale?: CrudTableLocale;
  onDelete: (record: TRecord) => Promise<void> | void;
  renderContext: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>;
  resource: string;
  rowActions?: false | CrudRowActionsConfig<TRecord, TMeta, TCreate, TUpdate>;
  t: TranslateFunction;
};

export function createCrudOperationColumns<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({
  canDelete,
  locale,
  onDelete,
  renderContext,
  resource,
  rowActions,
  t,
}: CreateCrudOperationColumnsOptions<TRecord, TCreate, TUpdate, TMeta>): CrudColumns<TRecord> {
  if (rowActions === false || (!canDelete && !rowActions?.render)) {
    return [];
  }

  return [
    {
      title: rowActions?.title ?? locale?.actionColumnTitle ?? t('crud.column.action', '操作'),
      key: '__actions',
      fixed: 'right',
      width: rowActions?.width ?? 120,
      render: (_, record) => (
        <>
          {rowActions?.render?.({ ...renderContext, record })}
          {canDelete && rowActions?.delete !== false ? (
            <Permission code={toPermissionCode(resource, 'delete')}>
              <Popconfirm
                title={
                  locale?.deleteConfirmTitle ??
                  t('crud.action.deleteConfirm', '确认删除这条记录吗？')
                }
                onConfirm={() => onDelete(record)}
              >
                <Button danger type="link" size="small">
                  {locale?.deleteText ?? t('crud.action.delete', '删除')}
                </Button>
              </Popconfirm>
            </Permission>
          ) : null}
        </>
      ),
    },
  ];
}
