import type { ButtonProps, PopconfirmProps, TooltipProps } from 'antd';
import { Button, Popconfirm, Tooltip } from 'antd';
import type { ReactNode } from 'react';
import { useCurrentUserQuery } from './hooks';
import { hasTrueAdminPermission, type TrueAdminPermissionMode } from './TrueAdminPermission';

export type TrueAdminPermissionButtonProps = ButtonProps & {
  permission?: string | string[];
  permissionMode?: TrueAdminPermissionMode;
  deniedMode?: 'hide' | 'disable';
  deniedTooltip?: ReactNode;
  tooltip?: ReactNode;
  tooltipProps?: Omit<TooltipProps, 'children' | 'title'>;
  confirm?: ReactNode | PopconfirmProps;
};

const isPopconfirmProps = (confirm: ReactNode | PopconfirmProps): confirm is PopconfirmProps =>
  Boolean(confirm && typeof confirm === 'object' && !('type' in confirm));

export function TrueAdminPermissionButton({
  permission,
  permissionMode = 'or',
  deniedMode = 'hide',
  deniedTooltip,
  tooltip,
  tooltipProps,
  confirm,
  disabled,
  children,
  ...buttonProps
}: TrueAdminPermissionButtonProps) {
  const { data } = useCurrentUserQuery();
  const allowed = hasTrueAdminPermission(data?.permissions, permission, permissionMode);

  if (!allowed && deniedMode === 'hide') {
    return null;
  }

  const button = (
    <Button {...buttonProps} disabled={disabled || !allowed}>
      {children}
    </Button>
  );
  const confirmedButton = confirm ? (
    isPopconfirmProps(confirm) ? (
      <Popconfirm {...confirm} disabled={disabled || !allowed || confirm.disabled}>
        {button}
      </Popconfirm>
    ) : (
      <Popconfirm title={confirm} disabled={disabled || !allowed}>
        {button}
      </Popconfirm>
    )
  ) : (
    button
  );
  const tooltipTitle = !allowed ? deniedTooltip : tooltip;

  if (!tooltipTitle) {
    return confirmedButton;
  }

  return (
    <Tooltip {...tooltipProps} title={tooltipTitle}>
      <span className="trueadmin-permission-button-tooltip-wrap">{confirmedButton}</span>
    </Tooltip>
  );
}
