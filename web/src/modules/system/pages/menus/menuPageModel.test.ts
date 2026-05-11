import { describe, expect, it } from 'vitest';
import { createMenuFilters, menuTypeColor } from './menuPageModel';

const t = (key?: string, fallback?: string) => fallback ?? key ?? '';

describe('menuPageModel', () => {
  it('keeps menu type colors stable', () => {
    expect(menuTypeColor).toEqual({
      button: 'default',
      directory: 'processing',
      link: 'warning',
      menu: 'success',
    });
  });

  it('creates menu filters with stable field names and option values', () => {
    const filters = createMenuFilters({
      t,
      sourceText: {
        code: '代码定义',
        custom: '自定义',
      },
      statusText: {
        disabled: '禁用',
        enabled: '启用',
      },
      typeText: {
        button: '按钮',
        directory: '目录',
        link: '链接',
        menu: '菜单',
      },
    });

    expect(filters.map((filter) => filter.name)).toEqual(['type', 'source', 'status']);

    const selectValues = (index: number) => {
      const filter = filters[index];
      expect(filter.type).toBe('select');
      if (filter.type !== 'select') {
        throw new Error(`Expected filter ${String(index)} to be a select filter`);
      }
      return filter.options.map((option) => option.value);
    };

    expect(selectValues(0)).toEqual(['directory', 'menu', 'link', 'button']);
    expect(selectValues(1)).toEqual(['code', 'custom']);
    expect(selectValues(2)).toEqual(['enabled', 'disabled']);
  });
});
