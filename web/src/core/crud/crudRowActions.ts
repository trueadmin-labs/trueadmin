import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { PopconfirmProps } from 'antd';
import type { Key, ReactNode } from 'react';
import { toPermissionCode } from './crudTableUtils';
import type {
  CrudBuiltinRowAction,
  CrudRowActionContext,
  CrudRowActionItem,
  CrudRowActionsConfig,
  CrudTableLocale,
} from './types';

const DEFAULT_PRESETS: CrudBuiltinRowAction[] = ['detail', 'edit', 'delete'];
const DEFAULT_MAX_INLINE = 2;

const BUILTIN_WEIGHT: Record<string, number> = {
  detail: 10,
  edit: 20,
  delete: 1000,
};

export type ResolvedCrudRowActionItem<
  TRecord extends Record<string, unknown>,
  TMeta = Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
> = Omit<
  CrudRowActionItem<TRecord, TMeta, TCreate, TUpdate>,
  'confirm' | 'danger' | 'disabled' | 'onClick' | 'permission' | 'visible'
> & {
  confirm?: ReactNode | PopconfirmProps;
  danger?: boolean;
  disabled?: boolean;
  index: number;
  onClick?: () => void | Promise<void>;
  permission?: string | string[] | false;
};

export type SplitCrudRowActionItems<
  TRecord extends Record<string, unknown>,
  TMeta = Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
> = {
  inline: ResolvedCrudRowActionItem<TRecord, TMeta, TCreate, TUpdate>[];
  more: ResolvedCrudRowActionItem<TRecord, TMeta, TCreate, TUpdate>[];
};

const toKey = (key: Key) => String(key);

const evalValue = <TValue, TRecord extends Record<string, unknown>, TMeta, TCreate, TUpdate>(
  value: TValue | ((context: CrudRowActionContext<TRecord, TMeta, TCreate, TUpdate>) => TValue),
  context: CrudRowActionContext<TRecord, TMeta, TCreate, TUpdate>,
) =>
  typeof value === 'function'
    ? (value as (context: CrudRowActionContext<TRecord, TMeta, TCreate, TUpdate>) => TValue)(
        context,
      )
    : value;

const getPresets = <TRecord extends Record<string, unknown>, TMeta, TCreate, TUpdate>(
  rowActions: CrudRowActionsConfig<TRecord, TMeta, TCreate, TUpdate> | undefined,
): CrudBuiltinRowAction[] => {
  if (rowActions?.presets === false) {
    return [];
  }

  if (Array.isArray(rowActions?.presets)) {
    return rowActions.presets;
  }

  return DEFAULT_PRESETS;
};

const getDefaultWeight = (key: string, danger?: boolean) => {
  if (key in BUILTIN_WEIGHT) {
    return BUILTIN_WEIGHT[key];
  }

  return danger ? 800 : 100;
};

const hasRunnableTarget = <TRecord extends Record<string, unknown>, TMeta, TCreate, TUpdate>(
  action: CrudRowActionItem<TRecord, TMeta, TCreate, TUpdate>,
) => Boolean(action.onClick || action.href);

type CreateBuiltinActionsOptions<
  TRecord extends Record<string, unknown>,
  TMeta,
  TCreate,
  TUpdate,
> = {
  canDelete: boolean;
  context: CrudRowActionContext<TRecord, TMeta, TCreate, TUpdate>;
  locale?: CrudTableLocale;
  onDelete: (record: TRecord) => Promise<void> | void;
  resource: string;
  rowActions?: CrudRowActionsConfig<TRecord, TMeta, TCreate, TUpdate>;
  t: TranslateFunction;
};

const createBuiltinActions = <
  TRecord extends Record<string, unknown>,
  TMeta = Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
>({
  canDelete,
  context,
  locale,
  onDelete,
  resource,
  rowActions,
  t,
}: CreateBuiltinActionsOptions<TRecord, TMeta, TCreate, TUpdate>) => {
  const presets = getPresets(rowActions);
  const actions: CrudRowActionItem<TRecord, TMeta, TCreate, TUpdate>[] = [];

  if (presets.includes('detail')) {
    actions.push({
      key: 'detail',
      label: t('crud.action.detail', '详情'),
      permission: toPermissionCode(resource, 'detail'),
      size: 'small',
      type: 'link',
    });
  }

  if (presets.includes('edit')) {
    actions.push({
      key: 'edit',
      label: t('crud.action.edit', '编辑'),
      permission: toPermissionCode(resource, 'update'),
      size: 'small',
      type: 'link',
    });
  }

  if (canDelete && presets.includes('delete')) {
    actions.push({
      key: 'delete',
      confirm: locale?.deleteConfirmTitle ?? t('crud.action.deleteConfirm', '确认删除这条记录吗？'),
      danger: true,
      label: locale?.deleteText ?? t('crud.action.delete', '删除'),
      onClick: () => onDelete(context.record),
      permission: toPermissionCode(resource, 'delete'),
      size: 'small',
      type: 'link',
    });
  }

  return actions;
};

export function resolveCrudRowActionItems<
  TRecord extends Record<string, unknown>,
  TMeta = Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
>({
  canDelete,
  context,
  locale,
  onDelete,
  resource,
  rowActions,
  t,
}: CreateBuiltinActionsOptions<TRecord, TMeta, TCreate, TUpdate>) {
  const hidden = new Set((rowActions?.hidden ?? []).map(toKey));
  const order = new Map((rowActions?.order ?? []).map((key, index) => [toKey(key), index]));
  const items = createBuiltinActions({
    canDelete,
    context,
    locale,
    onDelete,
    resource,
    rowActions,
    t,
  });
  const indexed = new Map<string, CrudRowActionItem<TRecord, TMeta, TCreate, TUpdate>>();

  for (const item of [...items, ...(rowActions?.items ?? [])]) {
    indexed.set(toKey(item.key), item);
  }

  const candidates = Array.from(indexed.values()).map((item, index) => {
    const key = toKey(item.key);
    const override = rowActions?.overrides?.[key];
    return { ...item, ...override, key, index };
  });

  return candidates
    .filter((item) => !hidden.has(toKey(item.key)))
    .flatMap((item): ResolvedCrudRowActionItem<TRecord, TMeta, TCreate, TUpdate>[] => {
      const visible = item.visible === undefined ? true : evalValue(item.visible, context);
      if (!visible) {
        return [];
      }

      if (item.key !== 'delete' && !hasRunnableTarget(item)) {
        return [];
      }

      const disabled = item.disabled === undefined ? undefined : evalValue(item.disabled, context);
      const danger = item.danger === undefined ? undefined : evalValue(item.danger, context);
      const permission =
        item.permission === undefined ? undefined : evalValue(item.permission, context);
      const confirm = item.confirm === undefined ? undefined : evalValue(item.confirm, context);
      const { visible: _visible, ...action } = item;

      return [
        {
          ...action,
          confirm,
          danger,
          disabled,
          index: item.index,
          onClick: item.onClick ? () => item.onClick?.(context) : undefined,
          permission,
        },
      ];
    })
    .sort((left, right) => {
      const leftOrder = order.get(toKey(left.key));
      const rightOrder = order.get(toKey(right.key));
      if (leftOrder !== undefined || rightOrder !== undefined) {
        return (leftOrder ?? Number.MAX_SAFE_INTEGER) - (rightOrder ?? Number.MAX_SAFE_INTEGER);
      }

      const leftWeight = left.order ?? getDefaultWeight(toKey(left.key), left.danger);
      const rightWeight = right.order ?? getDefaultWeight(toKey(right.key), right.danger);
      return leftWeight === rightWeight ? left.index - right.index : leftWeight - rightWeight;
    });
}

export function splitCrudRowActionItems<
  TRecord extends Record<string, unknown>,
  TMeta = Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
>(
  actions: ResolvedCrudRowActionItem<TRecord, TMeta, TCreate, TUpdate>[],
  maxInline = DEFAULT_MAX_INLINE,
): SplitCrudRowActionItems<TRecord, TMeta, TCreate, TUpdate> {
  const inline: ResolvedCrudRowActionItem<TRecord, TMeta, TCreate, TUpdate>[] = [];
  const more: ResolvedCrudRowActionItem<TRecord, TMeta, TCreate, TUpdate>[] = [];
  const auto = actions.filter(
    (action) => action.placement === undefined || action.placement === 'auto',
  );

  for (const action of actions) {
    if (action.placement === 'inline') {
      inline.push(action);
    }
    if (action.placement === 'more') {
      more.push(action);
    }
  }

  const inlineCapacity = Math.max(0, maxInline - inline.length);
  inline.push(...auto.slice(0, inlineCapacity));
  more.unshift(...auto.slice(inlineCapacity));

  return { inline, more };
}
