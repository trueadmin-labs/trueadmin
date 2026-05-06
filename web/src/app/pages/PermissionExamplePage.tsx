import { LockOutlined, WarningOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Space, Typography } from 'antd';
import { Link } from 'react-router';
import { Permission } from '@/core/auth/Permission';
import { ApiError } from '@/core/error/ApiError';
import { errorCenter } from '@/core/error/errorCenter';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';

const { Paragraph, Text } = Typography;

export default function PermissionExamplePage() {
  const showForbiddenError = () => {
    errorCenter.emit(
      new ApiError('KERNEL.AUTH.FORBIDDEN', '当前账号没有执行该操作所需的权限。', 403, {
        reason: 'permission_denied',
        traceId: 'demo-forbidden-trace-id',
      }),
    );
  };

  return (
    <TrueAdminPage title="权限展示示例">
      <Space direction="vertical" size={16} className="trueadmin-example-stack">
        <Alert
          showIcon
          type="info"
          message="这个页面用于确认权限展示分层"
          description="页面级无权限、局部组件无权限、接口级无权限分别走不同展示方式。"
        />

        <Card title="页面级无权限">
          <Paragraph>
            路由守卫或菜单权限确认后，如果整个页面不可访问，跳转到标准 403 页面。
          </Paragraph>
          <Link to="/403">打开页面级 403</Link>
        </Card>

        <Card title="局部组件无权限">
          <Paragraph>
            抽屉、详情、卡片内容等局部区域可以用{' '}
            <Text code>{'<Permission fallback="block" />'}</Text> 展示无权限占位。
          </Paragraph>
          <Permission code="demo.secret.view" deny fallback="block">
            <Card size="small">只有有权限时才会看到这里。</Card>
          </Permission>
        </Card>

        <Card title="按钮级权限">
          <Paragraph>按钮和表格操作默认无权限时直接不渲染，避免用户看到不可执行动作。</Paragraph>
          <Space>
            <Button icon={<LockOutlined />}>有权限按钮</Button>
            <Permission code="demo.secret.delete" deny>
              <Button danger>无权限按钮不会出现</Button>
            </Permission>
          </Space>
        </Card>

        <Card title="接口级无权限">
          <Paragraph>
            如果用户打开组件后接口返回 403，继续走全局错误弹窗，用来解释运行时失败原因。
          </Paragraph>
          <Button icon={<WarningOutlined />} onClick={showForbiddenError}>
            模拟接口 403 错误弹窗
          </Button>
        </Card>
      </Space>
    </TrueAdminPage>
  );
}
