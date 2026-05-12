/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { useCrudTableQueryState } from './useCrudTableQueryState';

const wrapper = ({ children }: PropsWithChildren) => (
  <MemoryRouter initialEntries={['/users?_page=3&keyword=root&status=enabled&deptId=10']}>
    {children}
  </MemoryRouter>
);

describe('useCrudTableQueryState', () => {
  it('lets query controller update every registered query value', () => {
    const { result } = renderHook(
      () =>
        useCrudTableQueryState({
          extraQuery: [{ name: 'deptId' }],
          filters: [{ label: 'Status', name: 'status', options: [], type: 'select' }],
          quickSearch: {},
        }),
      { wrapper },
    );

    expect(result.current.query.values).toEqual({
      deptId: '10',
      keyword: 'root',
      status: 'enabled',
    });
    expect(result.current.query.hasName('status')).toBe(true);
    expect(result.current.query.hasName('unknown')).toBe(false);

    act(() => {
      result.current.query.setValues({
        deptId: '20',
        keyword: 'admin',
        status: 'disabled',
        unknown: 'ignored',
      });
    });

    expect(result.current.current).toBe(1);
    expect(result.current.query.values).toEqual({
      deptId: '20',
      keyword: 'admin',
      status: 'disabled',
    });
    expect(result.current.requestParams).toEqual({
      filters: [{ field: 'status', op: 'eq', value: 'disabled' }],
      keyword: 'admin',
      page: 1,
      pageSize: 20,
      params: {
        deptId: '20',
      },
    });

    act(() => {
      result.current.query.resetValues(['keyword', 'status']);
    });

    expect(result.current.query.values).toEqual({
      deptId: '20',
    });
    expect(result.current.requestParams).toEqual({
      page: 1,
      pageSize: 20,
      params: {
        deptId: '20',
      },
    });
  });
});
