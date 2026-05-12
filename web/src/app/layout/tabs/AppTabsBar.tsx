import { DndContext } from '@dnd-kit/core';
import { useAppTabsBarController } from './AppTabsBarController';
import { restrictToHorizontalAxis, sameGroupCollisionDetection } from './AppTabsBarDnd';
import { SortableTabGroup } from './AppTabsBarItems';
import { TabsMoreButton } from './AppTabsBarMenu';

export function AppTabsBar({ activeKey }: { activeKey?: string }) {
  const tabsBar = useAppTabsBarController(activeKey);

  return (
    <nav className="trueadmin-shell-tabs" aria-label="页面标签栏">
      <DndContext
        sensors={tabsBar.sensors}
        collisionDetection={sameGroupCollisionDetection}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={tabsBar.handleDragEnd}
      >
        <ul ref={tabsBar.scrollRef} className="trueadmin-tabs-scroll">
          <SortableTabGroup
            activeKey={activeKey}
            closingTabs={tabsBar.closingTabs}
            enteringKeys={tabsBar.enteringKeys}
            tabs={tabsBar.pinnedTabs}
            getMenuItems={tabsBar.getMenuItems}
            onActivate={tabsBar.activateTab}
            onClose={tabsBar.requestClose}
            onScrollTop={tabsBar.scrollActiveTabToTop}
          />
          {tabsBar.pinnedTabs.length > 0 && tabsBar.normalTabs.length > 0 ? (
            <li className="trueadmin-tabs-group-divider" aria-hidden="true" />
          ) : null}
          <SortableTabGroup
            activeKey={activeKey}
            closingTabs={tabsBar.closingTabs}
            enteringKeys={tabsBar.enteringKeys}
            tabs={tabsBar.normalTabs}
            getMenuItems={tabsBar.getMenuItems}
            onActivate={tabsBar.activateTab}
            onClose={tabsBar.requestClose}
            onScrollTop={tabsBar.scrollActiveTabToTop}
          />
        </ul>
      </DndContext>
      <TabsMoreButton menuItems={tabsBar.getMenuItems(activeKey ?? tabsBar.tabs[0]?.key ?? '')} />
    </nav>
  );
}
