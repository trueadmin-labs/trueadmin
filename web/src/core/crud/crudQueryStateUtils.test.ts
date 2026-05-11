import { describe, expect, it } from 'vitest';
import {
  createParamsObject,
  DEFAULT_PAGE,
  getRequestParams,
  removeQueryKeys,
  setPage,
  setPageSize,
  setQueryValue,
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

  it('updates url pagination and scalar values without keeping defaults', () => {
    const params = new URLSearchParams('_page=3&_pageSize=50&keyword=admin&status=enabled');

    setPage(params, DEFAULT_PAGE);
    setPageSize(params, 20, 20);
    setQueryValue(params, 'keyword', '  root  ');
    setQueryValue(params, 'status', '');
    removeQueryKeys(params, ['unknown']);

    expect(params.toString()).toBe('keyword=root');
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
        order: 'desc',
        page: 2,
        pageSize: 50,
        quickSearchName: 'keyword',
        sort: 'created_at',
        values: {
          createdAt: '2026-01-01,2026-01-31',
          keyword: 'admin',
          name: 'root',
          status: 'enabled,pending',
        },
      }),
    ).toEqual({
      filter: {
        created_at: ['2026-01-01', '2026-01-31'],
        name: 'root',
        status: ['enabled', 'pending'],
      },
      keyword: 'admin',
      op: {
        created_at: 'between',
        name: 'like',
        status: 'in',
      },
      order: 'desc',
      page: 2,
      pageSize: 50,
      sort: 'created_at',
      tenantId: 'tenant-a',
    });
  });

  it('merges transformed filter and extra query params', () => {
    const filters: CrudFilterSchema[] = [
      {
        label: 'Date',
        name: 'date',
        transform: ({ value }) => ({
          filter: {
            created_at: value.split(','),
          },
          op: {
            created_at: 'between',
          },
        }),
        type: 'custom',
        render: () => null,
      },
    ];
    const extraQuery: CrudExtraQuerySchema[] = [
      {
        name: 'owner',
        transform: ({ value }) => ({
          filter: {
            owner_id: value,
          },
          op: {
            owner_id: '=',
          },
        }),
      },
    ];

    expect(
      getRequestParams({
        extraQuery,
        filters,
        page: 1,
        pageSize: 20,
        values: {
          date: '2026-01-01,2026-01-31',
          owner: '100',
        },
      }),
    ).toEqual({
      filter: {
        created_at: ['2026-01-01', '2026-01-31'],
        owner_id: '100',
      },
      op: {
        created_at: 'between',
        owner_id: '=',
      },
      page: 1,
      pageSize: 20,
    });
  });
});
