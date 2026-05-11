import { describe, expect, it } from 'vitest';
import { createRoleFilters } from './rolePageModel';

const t = (key?: string, fallback?: string) => fallback ?? key ?? '';

describe('rolePageModel', () => {
  it('creates role filters with stable field names and status values', () => {
    const filters = createRoleFilters({
      t,
      statusText: {
        disabled: '禁用',
        enabled: '启用',
      },
    });

    expect(filters.map((filter) => filter.name)).toEqual(['status']);
    expect(filters[0].type).toBe('select');
    if (filters[0].type !== 'select') {
      throw new Error('Expected status filter to be a select filter');
    }
    expect(filters[0].options.map((option) => option.value)).toEqual(['enabled', 'disabled']);
  });
});
