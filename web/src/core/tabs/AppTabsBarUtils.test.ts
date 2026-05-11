import { describe, expect, it } from 'vitest';
import {
  getNextTabAfterClose,
  isSamePath,
  keepTabsByCloseScope,
  normalizePath,
  toPixelDelta,
} from './AppTabsBarUtils';
import type { AppTab } from './types';

const tab = (key: string, overrides: Partial<AppTab> = {}): AppTab => ({
  home: false,
  key,
  openedAt: 1,
  path: `/${key}`,
  pinned: false,
  refreshKey: 0,
  title: key,
  ...overrides,
});

describe('AppTabsBarUtils', () => {
  it('normalizes paths before comparing them', () => {
    expect(normalizePath('/system/users///')).toBe('/system/users');
    expect(normalizePath('///')).toBe('/');
    expect(isSamePath('/system/users', '/system/users/')).toBe(true);
  });

  it('selects the next sensible tab after close', () => {
    const tabs = [tab('home', { home: true, path: '/' }), tab('users'), tab('roles')];

    expect(getNextTabAfterClose(tabs, 'users')?.key).toBe('roles');
    expect(getNextTabAfterClose(tabs, 'roles')?.key).toBe('users');
    expect(getNextTabAfterClose(tabs, 'missing')?.key).toBe('home');
  });

  it('keeps tabs according to close scope while preserving pinned tabs', () => {
    const tabs = [
      tab('home', { home: true, path: '/', pinned: true }),
      tab('users'),
      tab('roles'),
      tab('menus'),
    ];

    expect(keepTabsByCloseScope(tabs, 'roles', 'others').map((item) => item.key)).toEqual([
      'home',
      'roles',
    ]);
    expect(keepTabsByCloseScope(tabs, 'roles', 'left').map((item) => item.key)).toEqual([
      'home',
      'roles',
      'menus',
    ]);
    expect(keepTabsByCloseScope(tabs, 'roles', 'right').map((item) => item.key)).toEqual([
      'home',
      'users',
      'roles',
    ]);
    expect(keepTabsByCloseScope(tabs, 'roles', 'all').map((item) => item.key)).toEqual(['home']);
  });

  it('normalizes wheel deltas by delta mode', () => {
    const target = { clientWidth: 320 } as HTMLElement;

    expect(toPixelDelta({ deltaMode: 0, deltaY: 12 } as WheelEvent, target)).toBe(12);
    expect(toPixelDelta({ deltaMode: 1, deltaY: 2 } as WheelEvent, target)).toBe(32);
    expect(toPixelDelta({ deltaMode: 2, deltaY: 1 } as WheelEvent, target)).toBe(320);
  });
});
