import type { TimelineProps } from 'antd';
import { Timeline, Typography } from 'antd';
import type { ReactNode } from 'react';

export type TrueAdminAuditTimelineItem = {
  key?: React.Key;
  title: ReactNode;
  description?: ReactNode;
  operator?: ReactNode;
  time?: ReactNode;
  color?: string;
  dot?: ReactNode;
};

export type TrueAdminAuditTimelineProps = Omit<TimelineProps, 'items'> & {
  items: TrueAdminAuditTimelineItem[];
  emptyText?: ReactNode;
};

export function TrueAdminAuditTimeline({
  items,
  emptyText = '-',
  ...timelineProps
}: TrueAdminAuditTimelineProps) {
  if (items.length === 0) {
    return <Typography.Text type="secondary">{emptyText}</Typography.Text>;
  }

  return (
    <Timeline
      {...timelineProps}
      items={items.map((item, index) => ({
        color: item.color,
        dot: item.dot,
        key: item.key ?? index,
        children: (
          <div className="trueadmin-audit-timeline-item">
            <div className="trueadmin-audit-timeline-title">{item.title}</div>
            {item.description ? (
              <div className="trueadmin-audit-timeline-description">{item.description}</div>
            ) : null}
            {item.operator || item.time ? (
              <div className="trueadmin-audit-timeline-meta">
                {item.operator ? <span>{item.operator}</span> : null}
                {item.time ? <span>{item.time}</span> : null}
              </div>
            ) : null}
          </div>
        ),
      }))}
    />
  );
}
