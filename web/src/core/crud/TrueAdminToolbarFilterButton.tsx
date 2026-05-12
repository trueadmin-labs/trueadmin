import { FilterOutlined } from '@ant-design/icons';
import { Badge, Button, Tooltip } from 'antd';
import type { CrudToolbarProps } from './types';

type TrueAdminToolbarFilterButtonProps = {
  activeFilterCount: number;
  advancedFilterText: string;
  filtersExpanded: boolean;
  toolbarProps?: CrudToolbarProps;
  onToggleFilters: () => void;
};

export function TrueAdminToolbarFilterButton({
  activeFilterCount,
  advancedFilterText,
  filtersExpanded,
  toolbarProps,
  onToggleFilters,
}: TrueAdminToolbarFilterButtonProps) {
  return (
    <Tooltip title={advancedFilterText}>
      <span
        className={['trueadmin-crud-search-addon', toolbarProps?.classNames?.searchAddon]
          .filter(Boolean)
          .join(' ')}
        style={toolbarProps?.styles?.searchAddon}
      >
        <Badge count={activeFilterCount} offset={[-2, 2]} size="small">
          <Button
            {...toolbarProps?.filterButtonProps}
            aria-label={advancedFilterText}
            className={[
              'trueadmin-crud-icon-button',
              'trueadmin-crud-filter-button',
              filtersExpanded ? 'is-active' : '',
              toolbarProps?.classNames?.filterButton,
            ]
              .filter(Boolean)
              .join(' ')}
            icon={<FilterOutlined />}
            style={{
              ...toolbarProps?.styles?.filterButton,
              ...toolbarProps?.filterButtonProps?.style,
            }}
            onClick={onToggleFilters}
          />
        </Badge>
      </span>
    </Tooltip>
  );
}
