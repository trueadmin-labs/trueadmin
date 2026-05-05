import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Button, Empty, Space, Typography } from 'antd';
import React from 'react';

const UsersPage: React.FC = () => {
  return (
    <PageContainer title="管理员用户" content="维护后台管理员账号，后续接入 admin_users 表的查询、新增、编辑、禁用能力。">
      <ProCard variant="outlined">
        <Empty description="管理员用户 CRUD 接口待接入">
          <Space direction="vertical">
            <Typography.Text type="secondary">建议下一步使用 ProTable 对接后端分页接口。</Typography.Text>
            <Button type="primary" disabled>新建管理员</Button>
          </Space>
        </Empty>
      </ProCard>
    </PageContainer>
  );
};

export default UsersPage;
