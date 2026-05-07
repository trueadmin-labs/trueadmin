import { LockOutlined, WarningOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Space, Typography } from 'antd';
import { Link } from 'react-router';
import { Permission } from '@/core/auth/Permission';
import { ApiError } from '@/core/error/ApiError';
import { errorCenter } from '@/core/error/errorCenter';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';

const { Paragraph, Text } = Typography;

export default function PermissionExamplePage() {
  const { t } = useI18n();

  const showForbiddenError = () => {
    errorCenter.emit(
      new ApiError(
        'KERNEL.AUTH.FORBIDDEN',
        t('demo.permission.apiForbidden.message', '当前账号没有执行该操作所需的权限。'),
        403,
        {
          reason: 'permission_denied',
          traceId: 'demo-forbidden-trace-id',
        },
      ),
    );
  };

  return (
    <TrueAdminPage title={t('demo.permission.title', '权限展示示例')}>
      <Space orientation="vertical" size={16} className="trueadmin-example-stack">
        <Alert
          showIcon
          type="info"
          message={t('demo.permission.alert.message', '这个页面用于确认权限展示分层')}
          description={t(
            'demo.permission.alert.description',
            '页面级无权限、局部组件无权限、接口级无权限分别走不同展示方式。',
          )}
        />

        <Card title={t('demo.permission.pageLevel.title', '页面级无权限')}>
          <Paragraph>
            {t(
              'demo.permission.pageLevel.description',
              '路由守卫或菜单权限确认后，如果整个页面不可访问，跳转到标准 403 页面。',
            )}
          </Paragraph>
          <Link to="/403">{t('demo.permission.pageLevel.open', '打开页面级 403')}</Link>
        </Card>

        <Card title={t('demo.permission.blockLevel.title', '局部组件无权限')}>
          <Paragraph>
            {t('demo.permission.blockLevel.beforeCode', '抽屉、详情、卡片内容等局部区域可以用')}{' '}
            <Text code>{'<Permission fallback="block" />'}</Text>
            {t('demo.permission.blockLevel.afterCode', '展示无权限占位。')}
          </Paragraph>
          <Permission code="demo.secret.view" deny fallback="block">
            <Card size="small">
              {t('demo.permission.blockLevel.secret', '只有有权限时才会看到这里。')}
            </Card>
          </Permission>
        </Card>

        <Card title={t('demo.permission.buttonLevel.title', '按钮级权限')}>
          <Paragraph>
            {t(
              'demo.permission.buttonLevel.description',
              '按钮和表格操作默认无权限时直接不渲染，避免用户看到不可执行动作。',
            )}
          </Paragraph>
          <Space>
            <Button icon={<LockOutlined />}>
              {t('demo.permission.buttonLevel.allowed', '有权限按钮')}
            </Button>
            <Permission code="demo.secret.delete" deny>
              <Button danger>
                {t('demo.permission.buttonLevel.hidden', '无权限按钮不会出现')}
              </Button>
            </Permission>
          </Space>
        </Card>

        <Card title={t('demo.permission.apiLevel.title', '接口级无权限')}>
          <Paragraph>
            {t(
              'demo.permission.apiLevel.description',
              '如果用户打开组件后接口返回 403，继续走全局错误弹窗，用来解释运行时失败原因。',
            )}
          </Paragraph>
          <Button icon={<WarningOutlined />} onClick={showForbiddenError}>
            {t('demo.permission.apiLevel.trigger', '模拟接口 403 错误弹窗')}
          </Button>
        </Card>
      </Space>
    </TrueAdminPage>
  );
}
