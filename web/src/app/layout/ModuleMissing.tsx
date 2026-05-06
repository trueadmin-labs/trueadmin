import { PageContainer } from '@ant-design/pro-components';
import { Result } from 'antd';
import { useLocation } from 'react-router';
import { PageTransition } from '@/core/page/PageTransition';

export function ModuleMissing() {
  const location = useLocation();

  return (
    <PageTransition>
      <PageContainer title="页面未安装">
        <Result
          status="404"
          title="页面未安装"
          subTitle={`当前路径 ${location.pathname} 已由后端菜单下发，但前端模块还没有提供对应页面。`}
        />
      </PageContainer>
    </PageTransition>
  );
}
