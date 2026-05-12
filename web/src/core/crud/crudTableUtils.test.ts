import { describe, expect, it } from 'vitest';
import {
  getColumnSortKey,
  getSorterKey,
  getSorterResults,
  getSortRules,
  joinClassNames,
  mergeCardBodyStyles,
  toCrudSortOrder,
  toPermissionCode,
} from './crudTableUtils';
import type { CrudColumns } from './types';

describe('crudTableUtils', () => {
  it('joins truthy class names', () => {
    expect(joinClassNames('root', undefined, false, 'active')).toBe('root active');
  });

  it('normalizes permission and sort keys', () => {
    const columns = [
      { title: 'Name', dataIndex: 'name', key: 'displayName' },
      { title: 'Tenant', dataIndex: ['tenant', 'name'] },
    ] satisfies CrudColumns<Record<string, unknown>>;

    expect(toPermissionCode('system.user', 'delete')).toBe('system:user:delete');
    expect(getColumnSortKey(columns[0])).toBe('displayName');
    expect(getColumnSortKey(columns[1])).toBe('tenant.name');
    expect(toCrudSortOrder('ascend')).toBe('asc');
    expect(toCrudSortOrder('descend')).toBe('desc');
    expect(toCrudSortOrder(undefined)).toBeUndefined();
  });

  it('normalizes sorter payloads', () => {
    expect(getSorterResults([{ columnKey: 'createdAt', order: 'descend' }])[0]?.columnKey).toBe(
      'createdAt',
    );
    expect(getSorterKey({ field: ['user', 'name'], order: 'ascend' })).toBe('user.name');
    expect(
      getSortRules([
        { columnKey: 'createdAt', order: 'descend' },
        { field: ['user', 'name'], order: 'ascend' },
      ]),
    ).toEqual([
      { field: 'createdAt', order: 'desc' },
      { field: 'user.name', order: 'asc' },
    ]);
  });

  it('merges card body styles while preserving user overrides', () => {
    expect(
      mergeCardBodyStyles({ header: { padding: 12 }, body: { padding: 16 } }, { padding: 0 }),
    ).toEqual({
      header: { padding: 12 },
      body: { padding: 16 },
    });

    const merged = mergeCardBodyStyles(() => ({ body: { color: 'red' } }), {
      padding: 0,
    });

    expect(typeof merged).toBe('function');
    expect(typeof merged === 'function' ? merged({ props: {} }) : undefined).toEqual({
      body: { padding: 0, color: 'red' },
    });
  });
});
