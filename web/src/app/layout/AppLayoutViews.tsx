import { Layout } from 'antd';
import { AppBrand, AppContentFrame, AppHeaderBar, SiderFrame } from './AppLayoutChrome';
import {
  AppColumnRootMenu,
  AppMenu,
  type MenuMatch,
  type RuntimeMenuNode,
  resolveActiveRoot,
} from './AppLayoutMenu';

const { Sider } = Layout;

type LayoutVariantProps = {
  collapsed: boolean;
  darkMode: boolean;
  runtimeMenus: RuntimeMenuNode[];
  menuMatch: MenuMatch | null;
  showFooter: boolean;
  showTabs: boolean;
  activeTabKey?: string;
  outletKey: string;
  scrollKey: string;
};

type RootedLayoutVariantProps = LayoutVariantProps & {
  activeRoot?: RuntimeMenuNode;
  sideOpenKeys: string[];
};

export function ClassicLayout({
  collapsed,
  darkMode,
  runtimeMenus,
  menuMatch,
  showFooter,
  showTabs,
  activeTabKey,
  outletKey,
  scrollKey,
}: LayoutVariantProps) {
  return (
    <>
      <Sider
        className="trueadmin-shell-sider"
        width={208}
        collapsedWidth={64}
        collapsed={collapsed}
        trigger={null}
        theme={darkMode ? 'dark' : 'light'}
      >
        <AppBrand collapsed={collapsed} />
        <SiderFrame>
          <AppMenu
            menus={runtimeMenus}
            selectedKey={menuMatch?.selectedKey}
            selectedOpenKeys={collapsed ? [] : (menuMatch?.openKeys ?? [])}
          />
        </SiderFrame>
      </Sider>
      <Layout className="trueadmin-shell-main">
        <AppHeaderBar
          breadcrumb={menuMatch?.breadcrumb ?? []}
          layoutMode="classic"
          rootMenus={runtimeMenus}
          activeRootKey={resolveActiveRoot(runtimeMenus, menuMatch)?.key}
        />
        <AppContentFrame
          activeTabKey={activeTabKey}
          outletKey={outletKey}
          scrollKey={scrollKey}
          showFooter={showFooter}
          showTabs={showTabs}
        />
      </Layout>
    </>
  );
}

export function MixedLayout({
  collapsed,
  darkMode,
  runtimeMenus,
  menuMatch,
  activeRoot,
  sideOpenKeys,
  showFooter,
  showTabs,
  activeTabKey,
  outletKey,
  scrollKey,
}: RootedLayoutVariantProps) {
  const sideMenus = activeRoot?.children?.length
    ? activeRoot.children
    : activeRoot
      ? [activeRoot]
      : [];

  return (
    <>
      <AppHeaderBar
        breadcrumb={menuMatch?.breadcrumb ?? []}
        layoutMode="mixed"
        rootMenus={runtimeMenus}
        activeRootKey={activeRoot?.key}
      />
      <Layout className="trueadmin-shell-mixed-body">
        <Sider
          className="trueadmin-shell-sider trueadmin-shell-sider-sub"
          width={208}
          collapsedWidth={64}
          collapsed={collapsed}
          trigger={null}
          theme={darkMode ? 'dark' : 'light'}
        >
          <SiderFrame>
            <AppMenu
              menus={sideMenus}
              selectedKey={menuMatch?.selectedKey}
              selectedOpenKeys={collapsed ? [] : sideOpenKeys}
            />
          </SiderFrame>
        </Sider>
        <Layout className="trueadmin-shell-main">
          <AppContentFrame
            activeTabKey={activeTabKey}
            outletKey={outletKey}
            scrollKey={scrollKey}
            showFooter={showFooter}
            showTabs={showTabs}
          />
        </Layout>
      </Layout>
    </>
  );
}

export function ColumnsLayout({
  collapsed,
  darkMode,
  runtimeMenus,
  menuMatch,
  activeRoot,
  sideOpenKeys,
  showFooter,
  showTabs,
  activeTabKey,
  outletKey,
  scrollKey,
}: RootedLayoutVariantProps) {
  const sideMenus = activeRoot?.children?.length
    ? activeRoot.children
    : activeRoot
      ? [activeRoot]
      : [];

  return (
    <>
      <Sider
        className="trueadmin-shell-column-rail"
        width={64}
        collapsedWidth={64}
        collapsed={false}
        trigger={null}
        theme={darkMode ? 'dark' : 'light'}
      >
        <AppBrand collapsed compact />
        <div className="trueadmin-shell-column-root-scroll">
          <AppColumnRootMenu menus={runtimeMenus} selectedKey={activeRoot?.key} />
        </div>
      </Sider>
      <Sider
        className="trueadmin-shell-sider trueadmin-shell-sider-sub trueadmin-shell-column-sub"
        width={176}
        collapsedWidth={64}
        collapsed={collapsed}
        trigger={null}
        theme={darkMode ? 'dark' : 'light'}
      >
        <div className="trueadmin-shell-column-sub-title" title={activeRoot?.label}>
          {activeRoot?.label}
        </div>
        <SiderFrame>
          <AppMenu
            menus={sideMenus}
            selectedKey={menuMatch?.selectedKey}
            selectedOpenKeys={collapsed ? [] : sideOpenKeys}
          />
        </SiderFrame>
      </Sider>
      <Layout className="trueadmin-shell-main">
        <AppHeaderBar
          breadcrumb={menuMatch?.breadcrumb ?? []}
          layoutMode="columns"
          rootMenus={runtimeMenus}
          activeRootKey={activeRoot?.key}
        />
        <AppContentFrame
          activeTabKey={activeTabKey}
          outletKey={outletKey}
          scrollKey={scrollKey}
          showFooter={showFooter}
          showTabs={showTabs}
        />
      </Layout>
    </>
  );
}
