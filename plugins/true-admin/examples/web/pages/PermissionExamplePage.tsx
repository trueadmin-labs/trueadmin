import { LockOutlined, WarningOutlined } from '@ant-design/icons';
import { ApiError, errorCenter } from '@trueadmin/web-core/error';
import { Alert, Button, Card, Space, Typography } from 'antd';
import { Link } from 'react-router';
import { TrueAdminPermission } from '@/core/auth';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';

const { Paragraph, Text } = Typography;

export default function PermissionExamplePage() {
  const { t } = useI18n();

  const showForbiddenError = () => {
    errorCenter.emit(
      new ApiError(
        'KERNEL.AUTH.FORBIDDEN',
        t('examples.permission.apiForbidden.message', '当前账号没有执行该操作所需的权限。'),
        403,
        {
          reason: 'permission_denied',
          traceId: 'examples-forbidden-trace-id',
        },
      ),
    );
  };

  return (
    <TrueAdminPage
      title={t('examples.permission.title', '权限展示示例')}
      contentAlign="center"
      contentWidth={920}
    >
      <Space orientation="vertical" size={16} className="trueadmin-example-stack">
        <Alert
          showIcon
          type="info"
          title={t('examples.permission.alert.message', '这个页面用于确认权限展示分层')}
          description={t(
            'examples.permission.alert.description',
            '页面级无权限、局部组件无权限、接口级无权限分别走不同展示方式。',
          )}
        />

        <Card title={t('examples.permission.pageLevel.title', '页面级无权限')}>
          <Paragraph>
            {t(
              'examples.permission.pageLevel.description',
              '路由守卫或菜单权限确认后，如果整个页面不可访问，跳转到标准 403 页面。',
            )}
          </Paragraph>
          <Link to="/403">{t('examples.permission.pageLevel.open', '打开页面级 403')}</Link>
        </Card>

        <Card title={t('examples.permission.blockLevel.title', '局部组件无权限')}>
          <Paragraph>
            {t('examples.permission.blockLevel.beforeCode', '抽屉、详情、卡片内容等局部区域可以用')}{' '}
            <Text code>{'<TrueAdminPermission fallback="block" />'}</Text>
            {t('examples.permission.blockLevel.afterCode', '展示无权限占位。')}
          </Paragraph>
          <TrueAdminPermission code="true-admin.examples.secret.view" deny fallback="block">
            <Card size="small">
              {t('examples.permission.blockLevel.secret', '只有有权限时才会看到这里。')}
            </Card>
          </TrueAdminPermission>
        </Card>

        <Card title={t('examples.permission.buttonLevel.title', '按钮级权限')}>
          <Paragraph>
            {t(
              'examples.permission.buttonLevel.description',
              '按钮和表格操作默认无权限时直接不渲染，避免用户看到不可执行动作。',
            )}
          </Paragraph>
          <Space>
            <Button icon={<LockOutlined />}>
              {t('examples.permission.buttonLevel.allowed', '有权限按钮')}
            </Button>
            <TrueAdminPermission code="true-admin.examples.secret.delete" deny>
              <Button danger>
                {t('examples.permission.buttonLevel.hidden', '无权限按钮不会出现')}
              </Button>
            </TrueAdminPermission>
          </Space>
        </Card>

        <Card title={t('examples.permission.apiLevel.title', '接口级无权限')}>
          <Paragraph>
            {t(
              'examples.permission.apiLevel.description',
              '如果用户打开组件后接口返回 403，继续走全局错误弹窗，用来解释运行时失败原因。',
            )}
          </Paragraph>
          <Button icon={<WarningOutlined />} onClick={showForbiddenError}>
            {t('examples.permission.apiLevel.trigger', '模拟接口 403 错误弹窗')}
          </Button>
        </Card>
      </Space>
    </TrueAdminPage>
  );
}
