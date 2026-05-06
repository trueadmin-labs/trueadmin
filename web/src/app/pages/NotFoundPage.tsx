import { Result } from 'antd';

export default function NotFoundPage() {
  return (
    <Result status="404" title="404" subTitle="页面不存在，可能是菜单 path 尚未绑定前端模块。" />
  );
}
