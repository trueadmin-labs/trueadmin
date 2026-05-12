import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Progress, Space, Timeline, Typography } from 'antd';
import type { StreamEventPayload } from './types';

export type TrueAdminStreamProgressPanelStatus =
  | 'idle'
  | 'processing'
  | 'success'
  | 'error'
  | 'aborted';

export type TrueAdminStreamProgressPanelProps = {
  status: TrueAdminStreamProgressPanelStatus;
  events: StreamEventPayload[];
  errorMessage?: string;
  labels?: Partial<Record<TrueAdminStreamProgressPanelStatus, string>>;
};

const latestProgress = (events: StreamEventPayload[]) => {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (typeof event.percent === 'number') {
      return event;
    }
  }

  return undefined;
};

const statusText: Record<TrueAdminStreamProgressPanelStatus, string> = {
  idle: '等待开始',
  processing: '处理中',
  success: '处理完成',
  error: '处理失败',
  aborted: '已取消',
};

export function TrueAdminStreamProgressPanel({
  status,
  events,
  errorMessage,
  labels,
}: TrueAdminStreamProgressPanelProps) {
  const progress = latestProgress(events);
  const percent = progress?.percent;
  const timelineEvents = events.filter((event) => event.type !== 'debug');
  const indicator =
    status === 'success' ? (
      <CheckCircleOutlined />
    ) : (
      <LoadingOutlined spin={status === 'processing'} />
    );

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <Space align="center" size={8}>
        {status === 'error' || status === 'aborted' ? <CloseCircleOutlined /> : indicator}
        <Typography.Text strong>{labels?.[status] ?? statusText[status]}</Typography.Text>
      </Space>

      {typeof percent === 'number' ? (
        <Progress percent={percent} status={status === 'error' ? 'exception' : undefined} />
      ) : (
        <Progress percent={100} showInfo={false} status="active" />
      )}

      {timelineEvents.length > 0 && (
        <Timeline
          items={timelineEvents.map((event, index) => ({
            key: `${index}-${event.type}-${event.message}`,
            color: event.type === 'error' ? 'red' : event.type === 'completed' ? 'green' : 'blue',
            content: (
              <Space orientation="vertical" size={2}>
                <Typography.Text>{event.message}</Typography.Text>
                {(event.module || event.stage) && (
                  <Typography.Text type="secondary">
                    {[event.module, event.stage].filter(Boolean).join(' / ')}
                  </Typography.Text>
                )}
              </Space>
            ),
          }))}
        />
      )}

      {errorMessage && <Typography.Text type="danger">{errorMessage}</Typography.Text>}
    </Space>
  );
}
