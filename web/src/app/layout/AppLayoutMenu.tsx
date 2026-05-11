import type { MenuProps } from 'antd';
import { Menu, Tooltip } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { TrueAdminIcon, type TrueAdminIconInput } from '@/core/icon/TrueAdminIcon';
import type { AppMenu as AppMenuConfig } from '@/core/menu/types';
import { useLayoutStore } from '@/core/store/layoutStore';

type MenuItem = Required<MenuProps>['items'][number];

export type RuntimeMenuNode = {
  key: string;
  path: string;
  id?: number;
  code: string;
  type?: AppMenuConfig['type'];
  url?: string;
  openMode?: AppMenuConfig['openMode'];
  showLinkHeader?: boolean;
  label: string;
  icon?: TrueAdminIconInput;
  children?: RuntimeMenuNode[];
};

export type MenuMatch = {
  selectedKey: string;
  openKeys: string[];
  breadcrumb: string[];
};

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

export const toRuntimeMenus = (
  menus: AppMenuConfig[] | undefined,
  t: (key?: string, fallback?: string) => string,
): RuntimeMenuNode[] =>
  (menus ?? [])
    .filter((menu) => menu.type !== 'button' && menu.status !== 'disabled')
    .map((menu) => ({
      key: String(menu.id ?? (menu.path || menu.code)),
      id: menu.id,
      code: menu.code,
      type: menu.type,
      path: menu.path,
      url: menu.url,
      openMode: menu.openMode,
      showLinkHeader: menu.showLinkHeader,
      label: t(menu.i18n, menu.title),
      icon: menu.icon || menu.code,
      children: toRuntimeMenus(menu.children, t),
    }));

const toMenuItems = (menus: RuntimeMenuNode[]): MenuItem[] =>
  menus.map((menu) => ({
    key: menu.key,
    icon: <TrueAdminIcon icon={menu.icon} />,
    label: menu.label,
    children: menu.children?.length ? toMenuItems(menu.children) : undefined,
  }));

const toRootMenuItems = (menus: RuntimeMenuNode[]): MenuItem[] =>
  menus.map((menu) => ({
    key: menu.key,
    icon: <TrueAdminIcon icon={menu.icon} />,
    label: menu.label,
  }));

const toMenuNodeMap = (menus: RuntimeMenuNode[], nodeMap = new Map<string, RuntimeMenuNode>()) => {
  for (const menu of menus) {
    nodeMap.set(menu.key, menu);
    toMenuNodeMap(menu.children ?? [], nodeMap);
  }

  return nodeMap;
};

const getFirstNavigableMenu = (menu: RuntimeMenuNode): RuntimeMenuNode => {
  const firstChild = menu.children?.find(
    (child) => child.type === 'link' || child.path || child.children?.length,
  );

  return firstChild ? getFirstNavigableMenu(firstChild) : menu;
};

const toRootMenuNodeMap = (menus: RuntimeMenuNode[]) => {
  const nodeMap = new Map<string, RuntimeMenuNode>();

  for (const menu of menus) {
    nodeMap.set(menu.key, getFirstNavigableMenu(menu));
  }

  return nodeMap;
};

const toIframeLinkPath = (menu: RuntimeMenuNode): string =>
  `/link-frame/${encodeURIComponent(String(menu.id ?? menu.code))}`;

const openRuntimeMenu = (
  menu: RuntimeMenuNode | undefined,
  navigate: ReturnType<typeof useNavigate>,
) => {
  if (!menu) {
    return;
  }

  if (menu.type === 'link') {
    const url = menu.url ?? '';
    if (menu.openMode === 'iframe') {
      navigate(toIframeLinkPath(menu));
      return;
    }

    if (!url) {
      navigate(toIframeLinkPath(menu));
      return;
    }
    if (menu.openMode === 'self') {
      window.location.assign(url);
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  if (!menu.path) {
    return;
  }

  navigate(menu.path || menu.key);
};

export const findMenuMatch = (
  menus: RuntimeMenuNode[],
  pathname: string,
  parents: string[] = [],
  labels: string[] = [],
): MenuMatch | null => {
  const currentPath = normalizePath(pathname);

  for (const menu of menus) {
    const nextLabels = [...labels, menu.label];
    if (
      (menu.path && normalizePath(menu.path) === currentPath) ||
      (menu.type === 'link' &&
        menu.openMode === 'iframe' &&
        normalizePath(toIframeLinkPath(menu)) === currentPath)
    ) {
      return {
        selectedKey: menu.key,
        openKeys: parents,
        breadcrumb: nextLabels,
      };
    }

    const childMatch = findMenuMatch(
      menu.children ?? [],
      pathname,
      [...parents, menu.key],
      nextLabels,
    );
    if (childMatch) {
      return childMatch;
    }
  }

  return null;
};

const findMenuByKey = (menus: RuntimeMenuNode[], key?: string): RuntimeMenuNode | undefined => {
  if (!key) {
    return undefined;
  }

  for (const menu of menus) {
    if (menu.key === key) {
      return menu;
    }

    const child = findMenuByKey(menu.children ?? [], key);
    if (child) {
      return child;
    }
  }

  return undefined;
};

const getRootSubmenuKeys = (menus: RuntimeMenuNode[]) =>
  menus.filter((menu) => menu.children?.length).map((menu) => menu.key);

export const resolveActiveRoot = (menus: RuntimeMenuNode[], menuMatch: MenuMatch | null) => {
  const rootKeys = menus.map((menu) => menu.key);
  const matchedRootKey = menuMatch?.openKeys[0] ?? menuMatch?.selectedKey;

  if (matchedRootKey && rootKeys.includes(matchedRootKey)) {
    return findMenuByKey(menus, matchedRootKey) ?? menus[0];
  }

  return menus[0];
};

export const getSideOpenKeys = (menuMatch: MenuMatch | null, activeRootKey?: string) =>
  (menuMatch?.openKeys ?? []).filter((key) => key !== activeRootKey);

export function AppMenu({
  menus,
  selectedKey,
  selectedOpenKeys,
}: {
  menus: RuntimeMenuNode[];
  selectedKey?: string;
  selectedOpenKeys: string[];
}) {
  const navigate = useNavigate();
  const darkMode = useLayoutStore((state) => state.darkMode);
  const [openKeys, setOpenKeys] = useState<string[]>(selectedOpenKeys);
  const rootSubmenuKeys = useMemo(() => getRootSubmenuKeys(menus), [menus]);
  const menuNodeMap = useMemo(() => toMenuNodeMap(menus), [menus]);
  const selectedOpenKeysKey = selectedOpenKeys.join('\0');

  useEffect(() => {
    setOpenKeys(selectedOpenKeys);
  }, [selectedOpenKeysKey]);

  const handleOpenChange: MenuProps['onOpenChange'] = (keys) => {
    const latestOpenKey = keys.find((key) => !openKeys.includes(key));
    if (latestOpenKey && rootSubmenuKeys.includes(latestOpenKey)) {
      setOpenKeys([latestOpenKey]);
      return;
    }

    const activeRootKey = keys.find((key) => rootSubmenuKeys.includes(key));
    setOpenKeys(
      activeRootKey
        ? keys.filter((key) => key === activeRootKey || !rootSubmenuKeys.includes(key))
        : keys,
    );
  };

  return (
    <div className="trueadmin-shell-menu-scroll">
      <Menu
        mode="inline"
        theme={darkMode ? 'dark' : 'light'}
        items={toMenuItems(menus)}
        selectedKeys={selectedKey ? [selectedKey] : []}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        onClick={({ key }) => openRuntimeMenu(menuNodeMap.get(String(key)), navigate)}
      />
    </div>
  );
}

export function AppRootMenu({
  menus,
  selectedKey,
  variant,
}: {
  menus: RuntimeMenuNode[];
  selectedKey?: string;
  variant: 'top' | 'columns';
}) {
  const navigate = useNavigate();
  const darkMode = useLayoutStore((state) => state.darkMode);
  const menuNodeMap = useMemo(() => toRootMenuNodeMap(menus), [menus]);

  return (
    <Menu
      className={`trueadmin-shell-root-menu is-${variant}`}
      mode={variant === 'top' ? 'horizontal' : 'vertical'}
      theme={darkMode ? 'dark' : 'light'}
      items={toRootMenuItems(menus)}
      selectedKeys={selectedKey ? [selectedKey] : []}
      onClick={({ key }) => openRuntimeMenu(menuNodeMap.get(String(key)), navigate)}
    />
  );
}

export function AppColumnRootMenu({
  menus,
  selectedKey,
}: {
  menus: RuntimeMenuNode[];
  selectedKey?: string;
}) {
  const navigate = useNavigate();
  const menuNodeMap = useMemo(() => toRootMenuNodeMap(menus), [menus]);

  return (
    <nav className="trueadmin-shell-column-root-menu" aria-label="一级菜单">
      {menus.map((menu) => {
        const selected = menu.key === selectedKey;

        return (
          <Tooltip key={menu.key} title={menu.label} placement="right">
            <button
              type="button"
              className="trueadmin-shell-column-root-item"
              data-selected={selected}
              aria-label={menu.label}
              aria-current={selected ? 'page' : undefined}
              onClick={() => openRuntimeMenu(menuNodeMap.get(menu.key), navigate)}
            >
              <span className="trueadmin-shell-column-root-icon" aria-hidden="true">
                <TrueAdminIcon icon={menu.icon} />
              </span>
            </button>
          </Tooltip>
        );
      })}
    </nav>
  );
}
