import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import type { MenuProps } from 'antd';
import { SortableTab } from './AppTabsBarItem';
import type { ClosingTabState } from './AppTabsBarUtils';
import type { AppTab } from './types';

export function SortableTabGroup({
  activeKey,
  closingTabs,
  enteringKeys,
  tabs,
  getMenuItems,
  onActivate,
  onClose,
  onScrollTop,
}: {
  activeKey?: string;
  closingTabs: Record<string, ClosingTabState>;
  enteringKeys: string[];
  tabs: AppTab[];
  getMenuItems: (key: string) => MenuProps['items'];
  onActivate: (tab: AppTab) => void;
  onClose: (key: string) => void;
  onScrollTop: (tab: AppTab) => void;
}) {
  return (
    <SortableContext items={tabs.map((tab) => tab.key)} strategy={horizontalListSortingStrategy}>
      {tabs.map((tab) => (
        <SortableTab
          key={tab.key}
          active={tab.key === activeKey}
          entering={enteringKeys.includes(tab.key)}
          closingState={closingTabs[tab.key]}
          tab={tab}
          menuItems={getMenuItems(tab.key)}
          onActivate={onActivate}
          onClose={onClose}
          onScrollTop={onScrollTop}
        />
      ))}
    </SortableContext>
  );
}
