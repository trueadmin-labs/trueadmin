import { describe, expect, it } from 'vitest';
import type { AdminMenu } from '../../types/menu';
import { getMenuIconMode, toTreeSelectData } from './menuFormModel';

const menu = (id: number, name: string, children?: AdminMenu[]): AdminMenu => ({
  children,
  code: `menu-${String(id)}`,
  icon: '',
  id,
  name,
  openMode: '',
  parentId: 0,
  path: '',
  permission: '',
  showLinkHeader: false,
  sort: id,
  source: 'custom',
  status: 'enabled',
  type: 'directory',
  url: '',
});

describe('menuFormModel', () => {
  it('detects icon input mode from icon value', () => {
    expect(getMenuIconMode('SettingOutlined')).toBe('name');
    expect(getMenuIconMode('https://example.com/icon.png')).toBe('image');
    expect(getMenuIconMode('data:image/png;base64,abc')).toBe('image');
  });

  it('converts menus to tree select data and disables edited descendants', () => {
    const treeData = toTreeSelectData([menu(1, '系统', [menu(2, '菜单'), menu(3, '角色')])], 1);

    expect(treeData).toEqual([
      {
        children: [
          {
            children: undefined,
            disabled: true,
            key: 2,
            title: '菜单',
            value: 2,
          },
          {
            children: undefined,
            disabled: true,
            key: 3,
            title: '角色',
            value: 3,
          },
        ],
        disabled: true,
        key: 1,
        title: '系统',
        value: 1,
      },
    ]);
  });
});
