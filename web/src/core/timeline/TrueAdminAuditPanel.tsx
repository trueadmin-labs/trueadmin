import type { CardProps, TagProps } from 'antd';
import { Card, Space, Tag, Typography } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import {
  TrueAdminAuditTimeline,
  type TrueAdminAuditTimelineItem,
  type TrueAdminAuditTimelineProps,
} from './TrueAdminAuditTimeline';

export type TrueAdminAuditPanelClassNames = {
  root?: string;
  header?: string;
  main?: string;
  status?: string;
  actions?: string;
  body?: string;
};

export type TrueAdminAuditPanelStyles = {
  root?: CSSProperties;
  header?: CSSProperties;
  main?: CSSProperties;
  status?: CSSProperties;
  actions?: CSSProperties;
  body?: CSSProperties;
};

export type TrueAdminAuditPanelStatus = {
  label: ReactNode;
  color?: TagProps['color'];
  tagProps?: Omit<TagProps, 'children' | 'color'>;
};

export type TrueAdminAuditPanelProps = Omit<
  CardProps,
  'actions' | 'children' | 'title' | 'extra'
> & {
  title?: ReactNode;
  description?: ReactNode;
  status?: ReactNode | TrueAdminAuditPanelStatus;
  actions?: ReactNode;
  items: TrueAdminAuditTimelineItem[];
  timelineProps?: Omit<TrueAdminAuditTimelineProps, 'items'>;
  classNames?: TrueAdminAuditPanelClassNames;
  styles?: TrueAdminAuditPanelStyles;
};

const isStatusConfig = (
  status: ReactNode | TrueAdminAuditPanelStatus,
): status is TrueAdminAuditPanelStatus =>
  Boolean(status && typeof status === 'object' && 'label' in status);

export function TrueAdminAuditPanel({
  title,
  description,
  status,
  actions,
  items,
  timelineProps,
  className,
  classNames,
  styles,
  style,
  size = 'small',
  ...cardProps
}: TrueAdminAuditPanelProps) {
  const statusNode = status ? (
    isStatusConfig(status) ? (
      <Tag color={status.color} {...status.tagProps}>
        {status.label}
      </Tag>
    ) : (
      status
    )
  ) : null;

  return (
    <Card
      {...cardProps}
      className={['trueadmin-audit-panel', classNames?.root, className].filter(Boolean).join(' ')}
      size={size}
      style={{ ...styles?.root, ...style }}
    >
      {title || description || statusNode || actions ? (
        <div
          className={['trueadmin-audit-panel-header', classNames?.header].filter(Boolean).join(' ')}
          style={styles?.header}
        >
          <div
            className={['trueadmin-audit-panel-main', classNames?.main].filter(Boolean).join(' ')}
            style={styles?.main}
          >
            {title ? (
              <Space size={8} wrap>
                <Typography.Title level={5}>{title}</Typography.Title>
                {statusNode ? (
                  <span className={classNames?.status} style={styles?.status}>
                    {statusNode}
                  </span>
                ) : null}
              </Space>
            ) : statusNode ? (
              <span className={classNames?.status} style={styles?.status}>
                {statusNode}
              </span>
            ) : null}
            {description ? (
              <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
            ) : null}
          </div>
          {actions ? (
            <div
              className={['trueadmin-audit-panel-actions', classNames?.actions]
                .filter(Boolean)
                .join(' ')}
              style={styles?.actions}
            >
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
      <div
        className={['trueadmin-audit-panel-body', classNames?.body].filter(Boolean).join(' ')}
        style={styles?.body}
      >
        <TrueAdminAuditTimeline {...timelineProps} items={items} />
      </div>
    </Card>
  );
}
