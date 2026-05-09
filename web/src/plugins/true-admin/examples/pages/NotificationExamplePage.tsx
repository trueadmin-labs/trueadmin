import { BellOutlined, SendOutlined } from '@ant-design/icons';
import { http } from '@core/http/client';
import { App, Button, Card, Descriptions, Space, Typography } from 'antd';
import { useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';

type DemoResult = {
  id?: number;
  status?: string;
  title?: string;
  deliveryTotal?: number;
  sentTotal?: number;
};

const sendDemo = (mode: 'direct' | 'template') =>
  http.Post<DemoResult>(`/admin/examples/notification-demo/${mode}`).send();

export default function NotificationExamplePage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [loading, setLoading] = useState<'direct' | 'template'>();
  const [result, setResult] = useState<DemoResult>();

  const run = async (mode: 'direct' | 'template') => {
    setLoading(mode);
    try {
      const response = await sendDemo(mode);
      setResult(response);
      message.success(t('examples.notification.message.sent', '示例通知已发送'));
    } finally {
      setLoading(undefined);
    }
  };

  return (
    <TrueAdminPage
      title={t('examples.notification.title', '站内消息示例')}
      description={t(
        'examples.notification.description',
        '演示插件如何发送后台通知、注册模板和扩展消息详情 payload 渲染。',
      )}
      contentAlign="center"
      contentWidth={920}
    >
      <Space orientation="vertical" size={12} className="trueadmin-example-stack">
        <Card size="small" title={t('examples.notification.send.title', '发送通知')}>
          <Space size={8} wrap>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={loading === 'direct'}
              onClick={() => void run('direct')}
            >
              {t('examples.notification.action.direct', '发送普通通知')}
            </Button>
            <Button
              icon={<BellOutlined />}
              loading={loading === 'template'}
              onClick={() => void run('template')}
            >
              {t('examples.notification.action.template', '发送模板通知')}
            </Button>
          </Space>
        </Card>

        <Card size="small" title={t('examples.notification.result.title', '发送结果')}>
          {result ? (
            <Descriptions size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="ID">{result.id ?? '-'}</Descriptions.Item>
              <Descriptions.Item label={t('examples.notification.result.status', '状态')}>
                {result.status ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('examples.notification.result.titleField', '标题')}>
                {result.title ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('examples.notification.result.delivery', '投递')}>
                {result.sentTotal ?? 0}/{result.deliveryTotal ?? 0}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Typography.Text type="secondary">
              {t('examples.notification.result.empty', '暂无发送结果')}
            </Typography.Text>
          )}
        </Card>
      </Space>
    </TrueAdminPage>
  );
}
