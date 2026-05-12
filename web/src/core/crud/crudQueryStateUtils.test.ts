import { describe, expect, it } from 'vitest';
import {
  createParamsObject,
  DEFAULT_PAGE,
  getQueryValueNames,
  getRequestParams,
  getSorts,
  removeQueryKeys,
  setPage,
  setPageSize,
  setQueryValue,
  setSorts,
} from './crudQueryStateUtils';
import type { CrudExtraQuerySchema, CrudFilterSchema } from './types';

describe('crudQueryStateUtils', () => {
  it('creates trimmed value objects from selected search params', () => {
    const params = new URLSearchParams({
      empty: '   ',
      keyword: ' admin ',
      status: 'enabled',
    });

    expect(createParamsObject(params, ['keyword', 'status', 'empty', 'missing'])).toEqual({
      keyword: 'admin',
      status: 'enabled',
    });
  });

  it('collects all registered crud query value names', () => {
    const filters: CrudFilterSchema[] = [
      {
        label: 'Status',
        name: 'status',
        options: [],
        type: 'select',
      },
    ];
    const extraQuery: CrudExtraQuerySchema[] = [
      {
        name: 'deptId',
      },
    ];

    expect(
      Array.from(
        getQueryValueNames({
          extraQuery,
          filters,
          quickSearchName: 'keyword',
        }),
      ),
    ).toEqual(['status', 'keyword', 'deptId']);
  });

  it('updates url pagination and scalar values without keeping defaults', () => {
    const params = new URLSearchParams('_page=3&_pageSize=50&keyword=admin&status=enabled');

    setPage(params, DEFAULT_PAGE);
    setPageSize(params, 20, 20);
    setQueryValue(params, 'keyword', '  root  ');
    setQueryValue(params, 'status', '');
    removeQueryKeys(params, ['unknown']);

    expect(params.toString()).toBe('keyword=root');
  });

  it('stores sort rules as ordered array query params', () => {
    const params = new URLSearchParams('_page=2&sorts[9][field]=stale');

    setSorts(params, [
      { field: 'created_at', order: 'desc' },
      { field: 'id', order: 'asc' },
    ]);

    expect(params.toString()).toBe(
      '_page=2&sorts%5B0%5D%5Bfield%5D=created_at&sorts%5B0%5D%5Border%5D=desc&sorts%5B1%5D%5Bfield%5D=id&sorts%5B1%5D%5Border%5D=asc',
    );
    expect(getSorts(params)).toEqual([
      { field: 'created_at', order: 'desc' },
      { field: 'id', order: 'asc' },
    ]);
  });

  it('builds backend crud request params from filters and extra query', () => {
    const filters: CrudFilterSchema[] = [
      {
        label: 'Name',
        name: 'name',
        type: 'input',
      },
      {
        label: 'Status',
        mode: 'multiple',
        name: 'status',
        options: [],
        type: 'select',
      },
      {
        label: 'Created',
        name: 'createdAt',
        requestName: 'created_at',
        type: 'dateRange',
      },
    ];
    const extraQuery: CrudExtraQuerySchema[] = [
      {
        defaultValue: 'tenant-a',
        name: 'tenant',
        requestName: 'tenantId',
      },
    ];

    expect(
      getRequestParams({
        extraQuery,
        filters,
        page: 2,
        pageSize: 50,
        quickSearchName: 'keyword',
        sorts: [{ field: 'created_at', order: 'desc' }],
        values: {
          createdAt: '2026-01-01,2026-01-31',
          keyword: 'admin',
          name: 'root',
          status: 'enabled,pending',
        },
      }),
    ).toEqual({
      filters: [
        { field: 'name', op: 'like', value: 'root' },
        { field: 'status', op: 'in', value: ['enabled', 'pending'] },
        { field: 'created_at', op: 'between', value: ['2026-01-01', '2026-01-31'] },
      ],
      keyword: 'admin',
      page: 2,
      pageSize: 50,
      params: {
        tenantId: 'tenant-a',
      },
      sorts: [{ field: 'created_at', order: 'desc' }],
    });
  });

  it('merges transformed filter and extra query params', () => {
    const filters: CrudFilterSchema[] = [
      {
        label: 'Date',
        name: 'date',
        transform: ({ value }) => ({
          filters: [{ field: 'created_at', op: 'between', value: value.split(',') }],
        }),
        type: 'custom',
        render: () => null,
      },
    ];
    const extraQuery: CrudExtraQuerySchema[] = [
      {
        name: 'owner',
        transform: ({ value }) => ({
          filters: [{ field: 'owner_id', op: 'eq', value }],
        }),
      },
    ];

    expect(
      getRequestParams({
        extraQuery,
        filters,
        page: 1,
        pageSize: 20,
        sorts: [],
        values: {
          date: '2026-01-01,2026-01-31',
          owner: '100',
        },
      }),
    ).toEqual({
      filters: [
        { field: 'created_at', op: 'between', value: ['2026-01-01', '2026-01-31'] },
        { field: 'owner_id', op: 'eq', value: '100' },
      ],
      page: 1,
      pageSize: 20,
    });
  });
});
