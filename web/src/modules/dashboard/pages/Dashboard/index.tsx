import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Col, Row, Typography } from 'antd';
import { useModuleLocale } from '@/locales/useModuleLocale';
import React from 'react';

const Dashboard: React.FC = () => {
  useModuleLocale('dashboard');
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  return (
    <PageContainer title="控制台" content="TrueAdmin 管理端基础工作台，后续可接入真实统计、消息与待办。">
      <ProCard split="vertical" variant="outlined">
        <ProCard colSpan="58%">
          <Typography.Title level={3} style={{ marginTop: 0 }}>
            欢迎回来，{currentUser?.nickname || currentUser?.username || '管理员'}
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            当前 Web 端已接入后端登录态、统一响应结构和基础权限模型。下一步可以开始把系统管理页面接入真实 CRUD 接口。
          </Typography.Paragraph>
        </ProCard>
        <ProCard>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <StatisticCard statistic={{ title: '角色', value: currentUser?.roles?.length || 0 }} />
            </Col>
            <Col span={12}>
              <StatisticCard statistic={{ title: '权限点', value: currentUser?.permissions?.length || 0 }} />
            </Col>
          </Row>
        </ProCard>
      </ProCard>
    </PageContainer>
  );
};

export default Dashboard;
