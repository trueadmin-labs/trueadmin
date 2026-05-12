import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Descriptions, Drawer, Spin, Tag, Typography } from 'antd';
import type { AdminLoginLog } from '../../types/log';

type LoginLogDetailDrawerProps = {
  detail?: AdminLoginLog;
  loading: boolean;
  open: boolean;
  statusText: Record<string, string>;
  t: TranslateFunction;
  onClose: () => void;
};

export function LoginLogDetailDrawer({
  detail,
  loading,
  open,
  statusText,
  t,
  onClose,
}: LoginLogDetailDrawerProps) {
  return (
    <Drawer
      width={560}
      open={open}
      title={t('system.loginLogs.detail.title', '登录日志详情')}
      onClose={onClose}
    >
      <Spin spinning={loading}>
        {detail ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
            <Descriptions.Item label={t('system.loginLogs.column.adminUserId', '管理员 ID')}>
              {detail.adminUserId ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.loginLogs.column.username', '用户名')}>
              {detail.username}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.loginLogs.column.status', '状态')}>
              <Tag color={detail.status === 'success' ? 'success' : 'error'}>
                {statusText[detail.status] ?? detail.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('system.loginLogs.column.ip', 'IP 地址')}>
              {detail.ip}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.loginLogs.column.reason', '原因')}>
              {detail.reason || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.loginLogs.column.createdAt', '登录时间')}>
              {detail.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.loginLogs.column.updatedAt', '更新时间')}>
              {detail.updatedAt}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.loginLogs.column.userAgent', 'User-Agent')}>
              <Typography.Paragraph copyable className="trueadmin-log-detail-code">
                {detail.userAgent || '-'}
              </Typography.Paragraph>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Spin>
    </Drawer>
  );
}
