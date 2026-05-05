import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Empty, Typography } from 'antd';
import React from 'react';

const RolesPage: React.FC = () => {
  return (
    <PageContainer title="角色管理" content="维护后台角色、菜单授权和接口权限点授权。">
      <ProCard variant="outlined">
        <Empty description="角色授权界面待接入">
          <Typography.Text type="secondary">这里后续会承接角色列表、菜单树、权限点树和数据权限策略。</Typography.Text>
        </Empty>
      </ProCard>
    </PageContainer>
  );
};

export default RolesPage;
