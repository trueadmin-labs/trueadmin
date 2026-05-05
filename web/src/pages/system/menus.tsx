import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Empty, Typography } from 'antd';
import React from 'react';

const MenusPage: React.FC = () => {
  return (
    <PageContainer title="菜单管理" content="维护后台菜单、按钮权限与前端路由元信息。">
      <ProCard variant="outlined">
        <Empty description="菜单树维护界面待接入">
          <Typography.Text type="secondary">菜单来源最终会和后端元数据扫描、数据库菜单配置协同。</Typography.Text>
        </Empty>
      </ProCard>
    </PageContainer>
  );
};

export default MenusPage;
