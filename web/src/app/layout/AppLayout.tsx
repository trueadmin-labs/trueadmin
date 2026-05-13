import { Layout, Result, Spin } from 'antd';
import { PreferenceBootstrap } from '@/app/providers/PreferenceBootstrap';
import { useAppLayoutController } from './AppLayoutController';
import { ClassicLayout, ColumnsLayout, MixedLayout } from './AppLayoutViews';
import './layout.css';

export function AppLayout() {
  const layout = useAppLayoutController();

  if (layout.isLoading) {
    return <Spin fullscreen description="正在加载工作台" />;
  }

  if (layout.error) {
    return (
      <Result
        status="500"
        title="菜单加载失败"
        subTitle="请确认后端服务已启动，或使用 test mode 启用最小 Mock。"
      />
    );
  }

  return (
    <Layout className={layout.shellClassName}>
      <PreferenceBootstrap />
      {layout.layoutMode === 'mixed' ? (
        <MixedLayout
          collapsed={layout.collapsed}
          darkMode={layout.darkMode}
          runtimeMenus={layout.runtimeMenus}
          menuMatch={layout.menuMatch}
          activeRoot={layout.activeRoot}
          sideOpenKeys={layout.sideOpenKeys}
          showFooter={layout.showFooter}
          showTabs={layout.showTabs}
          activeTabKey={layout.activeTabKey}
          outletKey={layout.outletKey}
          scrollKey={layout.scrollKey}
        />
      ) : layout.layoutMode === 'columns' ? (
        <ColumnsLayout
          collapsed={layout.collapsed}
          darkMode={layout.darkMode}
          runtimeMenus={layout.runtimeMenus}
          menuMatch={layout.menuMatch}
          activeRoot={layout.activeRoot}
          sideOpenKeys={layout.sideOpenKeys}
          showFooter={layout.showFooter}
          showTabs={layout.showTabs}
          activeTabKey={layout.activeTabKey}
          outletKey={layout.outletKey}
          scrollKey={layout.scrollKey}
        />
      ) : (
        <ClassicLayout
          collapsed={layout.collapsed}
          darkMode={layout.darkMode}
          runtimeMenus={layout.runtimeMenus}
          menuMatch={layout.menuMatch}
          showFooter={layout.showFooter}
          showTabs={layout.showTabs}
          activeTabKey={layout.activeTabKey}
          outletKey={layout.outletKey}
          scrollKey={layout.scrollKey}
        />
      )}
    </Layout>
  );
}
