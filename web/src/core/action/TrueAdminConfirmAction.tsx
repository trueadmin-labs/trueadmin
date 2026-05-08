import type { ButtonProps, PopconfirmProps } from 'antd';
import { App, Button, Popconfirm } from 'antd';
import type { MouseEvent, ReactElement, ReactNode } from 'react';
import { cloneElement, isValidElement, useState } from 'react';

export type TrueAdminConfirmActionContext = {
  close: () => void;
};

export type TrueAdminConfirmActionTriggerProps = {
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
};

export type TrueAdminConfirmActionProps = Omit<ButtonProps, 'children' | 'loading' | 'onClick'> & {
  action?: (context: TrueAdminConfirmActionContext) => void | Promise<void>;
  children?: ReactNode;
  confirm?: ReactNode | PopconfirmProps;
  confirmProps?: Omit<PopconfirmProps, 'children' | 'onConfirm' | 'open' | 'title'>;
  errorMessage?: ReactNode | false;
  loading?: boolean;
  successMessage?: ReactNode | false;
  trigger?: ReactElement<TrueAdminConfirmActionTriggerProps>;
  onError?: (error: unknown) => void;
  onSuccess?: () => void;
};

const isPopconfirmProps = (confirm: ReactNode | PopconfirmProps): confirm is PopconfirmProps =>
  Boolean(confirm && typeof confirm === 'object' && !('type' in confirm));

export function TrueAdminConfirmAction({
  action,
  children,
  confirm,
  confirmProps,
  disabled,
  errorMessage,
  loading,
  successMessage,
  trigger,
  onError,
  onSuccess,
  ...buttonProps
}: TrueAdminConfirmActionProps) {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [innerLoading, setInnerLoading] = useState(false);
  const mergedLoading = loading ?? innerLoading;
  const mergedDisabled = disabled || mergedLoading;

  const runAction = async () => {
    if (!action) {
      setOpen(false);
      return;
    }

    setInnerLoading(true);
    try {
      await action({ close: () => setOpen(false) });
      setOpen(false);
      if (successMessage) {
        message.success(successMessage);
      }
      onSuccess?.();
    } catch (error) {
      if (errorMessage) {
        message.error(errorMessage);
      }
      onError?.(error);
    } finally {
      setInnerLoading(false);
    }
  };

  const renderTrigger = (onClick?: (event: MouseEvent<HTMLElement>) => void) => {
    if (trigger) {
      return cloneElement(trigger, {
        disabled: mergedDisabled || trigger.props.disabled,
        onClick: (event: MouseEvent<HTMLElement>) => {
          trigger.props.onClick?.(event);
          if (!event.defaultPrevented) {
            onClick?.(event);
          }
        },
      });
    }

    return (
      <Button {...buttonProps} disabled={disabled} loading={mergedLoading} onClick={onClick}>
        {children}
      </Button>
    );
  };

  if (!confirm) {
    return renderTrigger(() => {
      void runAction();
    });
  }

  const triggerNode = renderTrigger();
  const mergedConfirmProps = isPopconfirmProps(confirm)
    ? { ...confirmProps, ...confirm }
    : { ...confirmProps, title: confirm };

  return (
    <Popconfirm
      {...mergedConfirmProps}
      disabled={mergedDisabled || mergedConfirmProps.disabled}
      okButtonProps={{ loading: mergedLoading, ...mergedConfirmProps.okButtonProps }}
      open={open}
      onCancel={(event) => {
        setOpen(false);
        mergedConfirmProps.onCancel?.(event);
      }}
      onConfirm={(event) => {
        void runAction();
        mergedConfirmProps.onConfirm?.(event);
      }}
      onOpenChange={(nextOpen) => {
        if (!mergedDisabled) {
          setOpen(nextOpen);
        }
        mergedConfirmProps.onOpenChange?.(nextOpen);
      }}
    >
      {isValidElement(triggerNode) ? triggerNode : <span>{triggerNode}</span>}
    </Popconfirm>
  );
}
