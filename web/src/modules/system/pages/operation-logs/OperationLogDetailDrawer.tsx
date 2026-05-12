import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Descriptions, Drawer, Spin, Typography } from 'antd';
import type { AdminOperationLog } from '../../types/log';

type OperationLogDetailDrawerProps = {
  detail?: AdminOperationLog;
  loading: boolean;
  open: boolean;
  t: TranslateFunction;
  onClose: () => void;
};

const jsonText = (value: AdminOperationLog['context']) => JSON.stringify(value ?? {}, null, 2);

export function OperationLogDetailDrawer({
  detail,
  loading,
  open,
  t,
  onClose,
}: OperationLogDetailDrawerProps) {
  return (
    <Drawer
      width={560}
      open={open}
      title={t('system.operationLogs.detail.title', '操作日志详情')}
      onClose={onClose}
    >
      <Spin spinning={loading}>
        {detail ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.module', '模块')}>
              {detail.module}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.action', '动作')}>
              {detail.action}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.remark', '说明')}>
              {detail.remark || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.principal', '主体')}>
              {detail.principalType || '-'} / {detail.principalId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.operator', '操作者')}>
              {detail.operatorType || '-'} / {detail.operatorId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.operationDeptId', '操作部门')}>
              {detail.operationDeptId ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.createdAt', '操作时间')}>
              {detail.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.updatedAt', '更新时间')}>
              {detail.updatedAt}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.context', '上下文')}>
              <Typography.Paragraph copyable className="trueadmin-log-detail-code">
                {jsonText(detail.context)}
              </Typography.Paragraph>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Spin>
    </Drawer>
  );
}
