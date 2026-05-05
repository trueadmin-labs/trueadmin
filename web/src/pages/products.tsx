import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Empty, Typography } from 'antd';
import React from 'react';

const ProductsPage: React.FC = () => {
  return (
    <PageContainer title="商品管理" content="作为业务模块页面示例，用来验证后台模块如何扩展菜单、权限和 CRUD。">
      <ProCard variant="outlined">
        <Empty description="商品模块待实现">
          <Typography.Text type="secondary">后续可在后端新增 Product 模块，并通过权限注解与元数据扫描生成权限点。</Typography.Text>
        </Empty>
      </ProCard>
    </PageContainer>
  );
};

export default ProductsPage;
