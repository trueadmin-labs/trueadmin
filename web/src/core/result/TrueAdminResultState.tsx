import { ReloadOutlined } from '@ant-design/icons';
import type { ButtonProps, EmptyProps, ResultProps } from 'antd';
import { Button, Empty, Result } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import './result.css';

export type TrueAdminResultStateStatus = 'empty' | NonNullable<ResultProps['status']>;

export type TrueAdminResultStateProps = Omit<ResultProps, 'extra' | 'status'> & {
  status?: TrueAdminResultStateStatus;
  extra?: ReactNode;
  className?: string;
  style?: CSSProperties;
  compact?: boolean;
  emptyProps?: EmptyProps;
  reloadText?: ReactNode;
  reloadButtonProps?: Omit<ButtonProps, 'children' | 'icon' | 'onClick'>;
  onReload?: () => void;
};

export function TrueAdminResultState({
  status = 'empty',
  title,
  subTitle,
  extra,
  className,
  style,
  compact = false,
  emptyProps,
  reloadText,
  reloadButtonProps,
  onReload,
  ...resultProps
}: TrueAdminResultStateProps) {
  const { t } = useI18n();
  const mergedReloadText = reloadText ?? t('result.action.reload', '刷新');
  const extraNode =
    extra ??
    (onReload ? (
      <Button icon={<ReloadOutlined />} onClick={onReload} {...reloadButtonProps}>
        {mergedReloadText}
      </Button>
    ) : null);

  if (status === 'empty') {
    return (
      <div
        className={['trueadmin-result-state', compact ? 'is-compact' : '', className]
          .filter(Boolean)
          .join(' ')}
        style={style}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={subTitle ?? title ?? '-'}
          {...emptyProps}
        >
          {extraNode}
        </Empty>
      </div>
    );
  }

  return (
    <Result
      {...resultProps}
      className={['trueadmin-result-state', compact ? 'is-compact' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
      status={status}
      title={title}
      subTitle={subTitle}
      extra={extraNode}
    />
  );
}
