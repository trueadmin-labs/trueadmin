import { Badge, Segmented, Typography } from 'antd';
import type { ReactNode } from 'react';

export type TrueAdminQuickFilterValue = string | number;

export type TrueAdminQuickFilterItem<TValue extends TrueAdminQuickFilterValue> = {
  label: ReactNode;
  value: TValue;
  count?: number;
  disabled?: boolean;
  icon?: ReactNode;
};

export type TrueAdminQuickFilterMode = 'inline' | 'block';

export type TrueAdminQuickFilterProps<TValue extends TrueAdminQuickFilterValue> = {
  title?: ReactNode;
  mode?: TrueAdminQuickFilterMode;
  value?: TValue;
  items: Array<TrueAdminQuickFilterItem<TValue>>;
  loading?: boolean;
  disabled?: boolean;
  extra?: ReactNode;
  onChange?: (value: TValue) => void;
};

const toBadgeCount = (count?: number) => {
  if (!count || count <= 0) {
    return 0;
  }
  return count > 99 ? '99+' : count;
};

export function TrueAdminQuickFilter<TValue extends TrueAdminQuickFilterValue>({
  title,
  mode = 'inline',
  value,
  items,
  loading,
  disabled,
  extra,
  onChange,
}: TrueAdminQuickFilterProps<TValue>) {
  const options = items.map((item) => ({
    disabled: disabled || loading || item.disabled,
    label: (
      <span className="trueadmin-quick-filter-option">
        {item.icon ? <span className="trueadmin-quick-filter-option-icon">{item.icon}</span> : null}
        <span className="trueadmin-quick-filter-option-label">{item.label}</span>
        {toBadgeCount(item.count) ? (
          <Badge
            className="trueadmin-quick-filter-option-badge"
            count={toBadgeCount(item.count)}
            overflowCount={99}
            size="small"
          />
        ) : null}
      </span>
    ),
    value: item.value,
  }));

  return (
    <div className={`trueadmin-quick-filter is-${mode}`}>
      {title || extra ? (
        <div className="trueadmin-quick-filter-header">
          {title ? <Typography.Text strong>{title}</Typography.Text> : <span />}
          {extra ? <div className="trueadmin-quick-filter-extra">{extra}</div> : null}
        </div>
      ) : null}
      <Segmented<TValue>
        block={mode === 'block'}
        className="trueadmin-quick-filter-segmented"
        options={options}
        value={value}
        onChange={(nextValue) => onChange?.(nextValue)}
      />
    </div>
  );
}
