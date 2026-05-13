import { TrueAdminActionBar } from '@trueadmin/web-antd/action';
import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { CSSProperties, ReactNode } from 'react';
import { hasTrueAdminPermission, useCurrentUserQuery } from '@/core/auth';
import { resolveCrudRowActionItems, splitCrudRowActionItems } from './crudRowActions';
import type {
  CrudColumns,
  CrudRowActionAlign,
  CrudRowActionsConfig,
  CrudTableLocale,
  CrudTableRenderContext,
} from './types';

const DEFAULT_MAX_INLINE = 2;

const toActionColumnWidth = (maxInline = DEFAULT_MAX_INLINE) =>
  Math.max(96, 64 + Math.max(1, maxInline) * 44);

const toJustifyContent = (align: CrudRowActionAlign): CSSProperties['justifyContent'] => {
  if (align === 'left') {
    return 'flex-start';
  }

  if (align === 'center') {
    return 'center';
  }

  return 'flex-end';
};

type TrueAdminCrudRowActionsProps<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
> = {
  canDelete: boolean;
  locale?: CrudTableLocale;
  onDelete: (record: TRecord) => Promise<void> | void;
  record: TRecord;
  renderContext: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>;
  resource: string;
  rowActions?: CrudRowActionsConfig<TRecord, TMeta, TCreate, TUpdate>;
  t: TranslateFunction;
};

function TrueAdminCrudRowActions<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({
  canDelete,
  locale,
  onDelete,
  record,
  renderContext,
  resource,
  rowActions,
  t,
}: TrueAdminCrudRowActionsProps<TRecord, TCreate, TUpdate, TMeta>) {
  const { data } = useCurrentUserQuery();
  const context = { ...renderContext, record };
  const maxInline = rowActions?.maxInline ?? DEFAULT_MAX_INLINE;
  const align = rowActions?.align ?? 'right';
  const actions = resolveCrudRowActionItems({
    canDelete,
    context,
    locale,
    onDelete,
    resource,
    rowActions,
    t,
  }).filter((action) =>
    action.permission === false
      ? true
      : hasTrueAdminPermission(data?.permissions, action.permission, action.permissionMode),
  );
  const { inline, more } = splitCrudRowActionItems(actions, maxInline);
  const barActions = [...inline, ...more].map(
    ({
      index: _index,
      permission: _permission,
      permissionMode: _permissionMode,
      placement: _placement,
      order: _order,
      ...action
    }) => action,
  );
  const defaultNode: ReactNode = barActions.length ? (
    <TrueAdminActionBar
      actions={barActions}
      max={inline.length}
      moreText={rowActions?.moreText ?? t('crud.action.more', '更多')}
      moreButtonProps={{ size: 'small', type: 'link' }}
      className="trueadmin-crud-row-actions"
      dropdownProps={{ placement: 'bottomRight' }}
      spaceProps={{
        style: {
          justifyContent: toJustifyContent(align),
          width: '100%',
        },
      }}
    />
  ) : null;

  return rowActions?.render ? rowActions.render(context, defaultNode) : defaultNode;
}

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

const hasConfiguredRowActions = <TRecord extends Record<string, unknown>, TCreate, TUpdate, TMeta>(
  rowActions: false | CrudRowActionsConfig<TRecord, TMeta, TCreate, TUpdate> | undefined,
) => {
  if (!rowActions) {
    return false;
  }

  return Boolean(
    rowActions.presets !== false ||
      rowActions.items?.length ||
      Object.keys(rowActions.overrides ?? {}).length ||
      rowActions.render,
  );
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
  if (rowActions === false || (!canDelete && !hasConfiguredRowActions(rowActions))) {
    return [];
  }

  const maxInline = rowActions?.maxInline ?? DEFAULT_MAX_INLINE;

  return [
    {
      align: rowActions?.align ?? 'right',
      className: 'trueadmin-crud-operation-column',
      fixed: 'right',
      key: '__actions',
      title: rowActions?.title ?? locale?.actionColumnTitle ?? t('crud.column.action', '操作'),
      width: rowActions?.width ?? toActionColumnWidth(maxInline),
      render: (_, record) => (
        <TrueAdminCrudRowActions
          canDelete={canDelete}
          locale={locale}
          onDelete={onDelete}
          record={record}
          renderContext={renderContext}
          resource={resource}
          rowActions={rowActions}
          t={t}
        />
      ),
    },
  ];
}
