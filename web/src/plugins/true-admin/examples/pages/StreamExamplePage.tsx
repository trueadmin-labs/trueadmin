import { ApiOutlined, ClearOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Descriptions, List, Row, Space, Tag, Typography } from 'antd';
import { useRef, useState } from 'react';
import { ApiError } from '@/core/error/ApiError';
import { http } from '@/core/http/client';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';
import { TrueAdminPageSection } from '@/core/page/TrueAdminPageSection';
import {
  StreamError,
  type StreamEventPayload,
  StreamProgressPanel,
  type StreamProgressPanelStatus,
  streamRequest,
} from '@/core/stream';

type StreamDemoItem = {
  name: string;
  status: string;
};

type StreamDemoResult = {
  items: StreamDemoItem[];
  total: number;
};

const endpoint = '/admin/examples/stream-demo/progress';

const eventColor = (type: string) => {
  if (type === 'completed') {
    return 'green';
  }
  if (type === 'result') {
    return 'blue';
  }
  if (type === 'debug') {
    return 'purple';
  }
  if (type === 'error') {
    return 'red';
  }
  return 'processing';
};

const formatEventPayload = (event: StreamEventPayload) => {
  const payload = event.payload ?? event.response;
  if (!payload) {
    return '';
  }

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
};

export default function StreamExamplePage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const abortRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<StreamProgressPanelStatus>('idle');
  const [events, setEvents] = useState<StreamEventPayload[]>([]);
  const [streamResult, setStreamResult] = useState<StreamDemoResult>();
  const [normalResult, setNormalResult] = useState<StreamDemoResult>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [normalLoading, setNormalLoading] = useState(false);

  const clear = () => {
    setStatus('idle');
    setEvents([]);
    setStreamResult(undefined);
    setNormalResult(undefined);
    setErrorMessage(undefined);
  };

  const runNormal = async () => {
    setNormalLoading(true);
    try {
      const result = await http.Get<StreamDemoResult>(endpoint).send();
      setNormalResult(result);
      message.success(t('examples.stream.message.normalSuccess', '普通请求完成'));
    } catch (error) {
      const text =
        error instanceof Error ? error.message : t('examples.stream.error.unknown', '请求失败');
      message.error(text);
    } finally {
      setNormalLoading(false);
    }
  };

  const runStream = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('processing');
    setEvents([]);
    setStreamResult(undefined);
    setErrorMessage(undefined);

    try {
      const result = await streamRequest<StreamDemoResult>(endpoint, {
        method: 'GET',
        signal: controller.signal,
        onEvent: (event) => {
          setEvents((currentEvents) => [...currentEvents, event]);
        },
      });
      setStreamResult(result.data);
      setStatus('success');
      message.success(t('examples.stream.message.streamSuccess', '流式请求完成'));
    } catch (error) {
      if (error instanceof StreamError && error.reason === 'aborted') {
        setStatus('aborted');
        setErrorMessage(t('examples.stream.message.aborted', '请求已取消'));
        return;
      }

      const text =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : t('examples.stream.error.unknown', '请求失败');
      setStatus('error');
      setErrorMessage(text);
      message.error(text);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  };

  const cancelStream = () => {
    abortRef.current?.abort();
  };

  const renderResult = (result?: StreamDemoResult) => {
    if (!result) {
      return (
        <Typography.Text type="secondary">
          {t('examples.stream.result.empty', '暂无结果')}
        </Typography.Text>
      );
    }

    return (
      <Descriptions size="small" column={1} bordered>
        <Descriptions.Item label={t('examples.stream.result.total', '总数')}>
          {result.total}
        </Descriptions.Item>
        <Descriptions.Item label={t('examples.stream.result.items', '阶段')}>
          <Space wrap>
            {result.items.map((item) => (
              <Tag key={item.name} color={item.status === 'done' ? 'success' : 'default'}>
                {item.name}
              </Tag>
            ))}
          </Space>
        </Descriptions.Item>
      </Descriptions>
    );
  };

  return (
    <TrueAdminPage
      showHeader
      title={t('examples.stream.title', '流式响应示例')}
      description={t(
        'examples.stream.description',
        '验证同一个后端接口在普通 JSON 和 SSE 流式响应下的数据一致性。',
      )}
      contentAlign="center"
      contentWidth={1180}
      extra={
        <Space wrap>
          <Button icon={<ApiOutlined />} loading={normalLoading} onClick={runNormal}>
            {t('examples.stream.action.normal', '普通请求')}
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={status === 'processing'}
            onClick={runStream}
          >
            {t('examples.stream.action.stream', '流式请求')}
          </Button>
          <Button icon={<StopOutlined />} disabled={status !== 'processing'} onClick={cancelStream}>
            {t('examples.stream.action.cancel', '取消')}
          </Button>
          <Button icon={<ClearOutlined />} onClick={clear}>
            {t('examples.stream.action.clear', '清空')}
          </Button>
        </Space>
      }
    >
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} lg={12}>
            <TrueAdminPageSection
              surface
              title={t('examples.stream.panel.progress', '流式进度')}
              description={t(
                'examples.stream.panel.progressDesc',
                '后端每个处理阶段会发送 progress 事件，最终通过 result 块返回标准 ApiResponse。',
              )}
            >
              <StreamProgressPanel
                status={status}
                events={events}
                errorMessage={errorMessage}
                labels={{
                  idle: t('examples.stream.status.idle', '等待开始'),
                  processing: t('examples.stream.status.processing', '处理中'),
                  success: t('examples.stream.status.success', '处理完成'),
                  error: t('examples.stream.status.error', '处理失败'),
                  aborted: t('examples.stream.status.aborted', '已取消'),
                }}
              />
            </TrueAdminPageSection>
          </Col>
          <Col xs={24} lg={12}>
            <TrueAdminPageSection
              surface
              title={t('examples.stream.panel.result', '结果对照')}
              description={t(
                'examples.stream.panel.resultDesc',
                '普通请求和流式请求最终应该得到相同的业务数据。',
              )}
            >
              <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                <Card size="small" title={t('examples.stream.result.normal', '普通请求结果')}>
                  {renderResult(normalResult)}
                </Card>
                <Card size="small" title={t('examples.stream.result.stream', '流式请求结果')}>
                  {renderResult(streamResult)}
                </Card>
              </Space>
            </TrueAdminPageSection>
          </Col>
        </Row>

        <TrueAdminPageSection
          surface
          title={t('examples.stream.panel.events', '事件明细')}
          description={t('examples.stream.panel.eventsDesc', '按接收顺序展示 SSE data 块。')}
        >
          <List
            size="small"
            dataSource={events}
            locale={{ emptyText: t('examples.stream.events.empty', '暂无事件') }}
            renderItem={(event, index) => {
              const payload = formatEventPayload(event);
              return (
                <List.Item>
                  <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                    <Space wrap>
                      <Tag color={eventColor(event.type)}>{event.type}</Tag>
                      <Typography.Text strong>{event.message}</Typography.Text>
                      <Typography.Text type="secondary">#{index + 1}</Typography.Text>
                      {typeof event.percent === 'number' ? <Tag>{event.percent}%</Tag> : null}
                      {event.module ? <Tag>{event.module}</Tag> : null}
                      {event.stage ? <Tag>{event.stage}</Tag> : null}
                    </Space>
                    {payload ? (
                      <Typography.Paragraph code style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {payload}
                      </Typography.Paragraph>
                    ) : null}
                  </Space>
                </List.Item>
              );
            }}
          />
        </TrueAdminPageSection>
      </Space>
    </TrueAdminPage>
  );
}
