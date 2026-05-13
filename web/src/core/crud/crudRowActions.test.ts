import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { describe, expect, it, vi } from 'vitest';
import { resolveCrudRowActionItems, splitCrudRowActionItems } from './crudRowActions';
import type { CrudRowActionContext } from './types';

type Row = {
  id: number;
  status?: string;
};

const t: TranslateFunction = (_key, fallback = '') => fallback;

const createContext = (record: Row): CrudRowActionContext<Row> => ({
  action: {
    clearSelected: vi.fn(),
    reload: vi.fn(),
  },
  dataSource: [record],
  loading: false,
  query: {
    values: {},
    hasName: vi.fn(),
    resetValues: vi.fn(),
    setValue: vi.fn(),
    setValues: vi.fn(),
  },
  record,
  selectedRowKeys: [],
  selectedRows: [],
  total: 1,
});

describe('resolveCrudRowActionItems', () => {
  it('keeps runnable builtins and drops detail/edit without handlers', () => {
    const onDelete = vi.fn();
    const actions = resolveCrudRowActionItems({
      canDelete: true,
      context: createContext({ id: 1 }),
      onDelete,
      resource: 'system.user',
      t,
    });

    expect(actions.map((action) => action.key)).toEqual(['delete']);
    expect(actions[0]?.permission).toBe('system:user:delete');
  });

  it('applies overrides, custom items, visibility, and explicit order', () => {
    const actions = resolveCrudRowActionItems({
      canDelete: true,
      context: createContext({ id: 1, status: 'enabled' }),
      onDelete: vi.fn(),
      resource: 'system.user',
      rowActions: {
        order: ['edit', 'reset-password', 'delete'],
        overrides: {
          edit: {
            onClick: vi.fn(),
          },
        },
        items: [
          {
            key: 'reset-password',
            label: '重置密码',
            onClick: vi.fn(),
            permission: 'system:user:update',
            visible: ({ record }) => record.status === 'enabled',
          },
          {
            key: 'disable',
            label: '禁用',
            onClick: vi.fn(),
            visible: ({ record }) => record.status === 'disabled',
          },
        ],
      },
      t,
    });

    expect(actions.map((action) => action.key)).toEqual(['edit', 'reset-password', 'delete']);
    expect(actions[1]?.permission).toBe('system:user:update');
  });

  it('splits inline actions and overflow actions by placement and maxInline', () => {
    const actions = resolveCrudRowActionItems({
      canDelete: true,
      context: createContext({ id: 1 }),
      onDelete: vi.fn(),
      resource: 'system.user',
      rowActions: {
        items: [
          { key: 'audit', label: '审计', onClick: vi.fn(), placement: 'more' },
          { key: 'pin', label: '置顶', onClick: vi.fn(), placement: 'inline' },
        ],
        overrides: {
          edit: {
            onClick: vi.fn(),
          },
        },
      },
      t,
    });

    const split = splitCrudRowActionItems(actions, 2);

    expect(split.inline.map((action) => action.key)).toEqual(['pin', 'edit']);
    expect(split.more.map((action) => action.key)).toEqual(['delete', 'audit']);
  });
});
