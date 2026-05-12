import { CloseOutlined, PushpinFilled } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS as DndCSS } from '@dnd-kit/utilities';
import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';
import type { CSSProperties } from 'react';
import { TrueAdminIcon } from '@/core/icon/TrueAdminIcon';
import { type ClosingTabState, getGroup } from './AppTabsBarUtils';
import type { AppTab } from './types';

type SortableTabProps = {
  active: boolean;
  entering: boolean;
  closingState?: ClosingTabState;
  tab: AppTab;
  menuItems: MenuProps['items'];
  onActivate: (tab: AppTab) => void;
  onClose: (key: string) => void;
  onScrollTop: (tab: AppTab) => void;
};

export function SortableTab({
  active,
  entering,
  closingState,
  tab,
  menuItems,
  onActivate,
  onClose,
  onScrollTop,
}: SortableTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.key,
    disabled: tab.home,
    data: { group: getGroup(tab) },
  });
  const stateTransition = [
    transition,
    'background-color 0.18s cubic-bezier(0.2, 0, 0, 1)',
    'border-color 0.18s cubic-bezier(0.2, 0, 0, 1)',
    'box-shadow 0.18s cubic-bezier(0.2, 0, 0, 1)',
    'color 0.18s cubic-bezier(0.2, 0, 0, 1)',
  ]
    .filter(Boolean)
    .join(', ');
  const style = {
    transform: DndCSS.Transform.toString(transform),
    transition: closingState ? undefined : stateTransition,
    '--trueadmin-tabs-closing-width': closingState ? `${closingState.width}px` : undefined,
  } as CSSProperties;

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
      <li
        ref={setNodeRef}
        className="trueadmin-tabs-item"
        data-active={active}
        data-entering={entering}
        data-closing={closingState?.closing ?? false}
        data-closing-ready={Boolean(closingState)}
        data-dragging={isDragging}
        data-pinned={tab.pinned}
        data-tab-key={tab.key}
        style={style}
        title={tab.title}
        {...attributes}
        {...listeners}
        onMouseDown={(event) => {
          if (event.button === 1 && !tab.pinned) {
            event.preventDefault();
            onClose(tab.key);
          }
        }}
      >
        <button
          className="trueadmin-tabs-button"
          type="button"
          onClick={() => onActivate(tab)}
          onDoubleClick={() => {
            if (active) {
              onScrollTop(tab);
            }
          }}
        >
          {tab.pinned ? (
            <span className="trueadmin-tabs-pin-slot" aria-hidden="true">
              <PushpinFilled />
            </span>
          ) : null}
          <span className="trueadmin-tabs-icon-slot" aria-hidden="true">
            <TrueAdminIcon icon={tab.icon} />
          </span>
          <span className="trueadmin-tabs-title">{tab.title}</span>
        </button>
        <button
          className="trueadmin-tabs-close"
          type="button"
          aria-label={`关闭 ${tab.title}`}
          disabled={tab.pinned}
          onClick={(event) => {
            event.stopPropagation();
            onClose(tab.key);
          }}
        >
          <CloseOutlined />
        </button>
      </li>
    </Dropdown>
  );
}
