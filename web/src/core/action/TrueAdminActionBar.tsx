import { DownOutlined } from '@ant-design/icons';
import type { ButtonProps, DropdownProps, MenuProps, SpaceProps } from 'antd';
import { Button, Dropdown, Space } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

export type TrueAdminActionItem = Omit<ButtonProps, 'children' | 'onClick'> & {
  key: React.Key;
  label: ReactNode;
  visible?: boolean;
  onClick?: (
    event: React.MouseEvent<HTMLElement> | Parameters<NonNullable<MenuProps['onClick']>>[0],
  ) => void;
};

export type TrueAdminActionBarClassNames = {
  root?: string;
  primary?: string;
  more?: string;
};

export type TrueAdminActionBarStyles = {
  root?: CSSProperties;
  primary?: CSSProperties;
  more?: CSSProperties;
};

export type TrueAdminActionBarProps = {
  actions?: TrueAdminActionItem[];
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  classNames?: TrueAdminActionBarClassNames;
  styles?: TrueAdminActionBarStyles;
  max?: number;
  moreText?: ReactNode;
  moreButtonProps?: Omit<ButtonProps, 'children'>;
  dropdownProps?: Omit<DropdownProps, 'children'>;
  spaceProps?: Omit<SpaceProps, 'children'>;
};

export function TrueAdminActionBar({
  actions = [],
  children,
  className,
  style,
  classNames,
  styles,
  max,
  moreText,
  moreButtonProps,
  dropdownProps,
  spaceProps,
}: TrueAdminActionBarProps) {
  const visibleActions = actions.filter((action) => action.visible !== false);
  const primaryActions = max === undefined ? visibleActions : visibleActions.slice(0, max);
  const moreActions = max === undefined ? [] : visibleActions.slice(max);

  return (
    <Space
      size={8}
      wrap
      {...spaceProps}
      className={['trueadmin-action-bar', classNames?.root, className, spaceProps?.className]
        .filter(Boolean)
        .join(' ')}
      style={{ ...styles?.root, ...style, ...spaceProps?.style }}
    >
      {children}
      {primaryActions.map(({ key, label, visible: _visible, ...buttonProps }) => (
        <Button
          key={key}
          {...buttonProps}
          className={['trueadmin-action-bar-item', classNames?.primary, buttonProps.className]
            .filter(Boolean)
            .join(' ')}
          style={{ ...styles?.primary, ...buttonProps.style }}
        >
          {label}
        </Button>
      ))}
      {moreActions.length ? (
        <Dropdown
          trigger={['click']}
          {...dropdownProps}
          menu={{
            ...dropdownProps?.menu,
            items: moreActions.map(
              ({ key, label, visible: _visible, onClick, disabled, danger }) => ({
                key: String(key),
                label,
                disabled,
                danger,
                onClick: onClick
                  ? (event) => {
                      onClick(event);
                    }
                  : undefined,
              }),
            ),
          }}
        >
          <Button
            {...moreButtonProps}
            className={['trueadmin-action-bar-more', classNames?.more, moreButtonProps?.className]
              .filter(Boolean)
              .join(' ')}
            icon={moreButtonProps?.icon ?? <DownOutlined />}
            style={{ ...styles?.more, ...moreButtonProps?.style }}
          >
            {moreText}
          </Button>
        </Dropdown>
      ) : null}
    </Space>
  );
}
