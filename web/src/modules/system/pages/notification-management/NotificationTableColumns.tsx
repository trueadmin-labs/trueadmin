import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Space, Tag, Typography } from 'antd';
import type { CrudColumns } from '@/core/crud/types';
import {
  type AdminMessageLevel,
  type AdminNotificationBatch,
  type AdminNotificationBatchStatus,
  type AdminNotificationTargetType,
  getAdminMessageSourceConfig,
  getAdminMessageTypeConfig,
  resolveAdminMessageLabel,
} from '@/core/notification';
import { batchStatusColor, levelColor, toPlainText } from './notificationManagementModel';

type NotificationTableColumnsOptions = {
  levelText: Record<AdminMessageLevel, string>;
  statusText: Record<AdminNotificationBatchStatus, string>;
  targetTypeText: Record<AdminNotificationTargetType, string>;
  t: TranslateFunction;
};

export function createNotificationColumns({
  levelText,
  statusText,
  targetTypeText,
  t,
}: NotificationTableColumnsOptions): CrudColumns<AdminNotificationBatch> {
  return [
    {
      dataIndex: 'title',
      fixed: 'left',
      render: (_, record) => {
        const typeConfig = getAdminMessageTypeConfig(record.type);
        const summary = toPlainText(record.content);
        return (
          <div className="trueadmin-message-cell">
            <div className="trueadmin-message-cell-type">
              <Tag color={typeConfig.color} style={{ marginInlineEnd: 0 }}>
                {resolveAdminMessageLabel(typeConfig.label, t, record.type)}
              </Tag>
            </div>
            <Space orientation="vertical" size={4} style={{ minWidth: 0 }}>
              <Typography.Text strong>{record.title}</Typography.Text>
              {summary ? (
                <Typography.Text type="secondary" ellipsis>
                  {summary}
                </Typography.Text>
              ) : null}
            </Space>
          </div>
        );
      },
      title: t('system.messages.column.title', '消息'),
      width: 560,
    },
    {
      dataIndex: 'status',
      render: (_, record) => (
        <Tag color={batchStatusColor[record.status]}>{statusText[record.status]}</Tag>
      ),
      title: t('system.notificationManagement.column.status', '批次状态'),
      width: 120,
    },
    {
      dataIndex: 'level',
      render: (_, record) => <Tag color={levelColor[record.level]}>{levelText[record.level]}</Tag>,
      title: t('system.messages.column.level', '等级'),
      width: 110,
    },
    {
      dataIndex: 'targetSummary',
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text>{record.targetSummary}</Typography.Text>
          <Typography.Text type="secondary">{targetTypeText[record.targetType]}</Typography.Text>
        </Space>
      ),
      title: t('system.notificationManagement.column.target', '接收范围'),
      width: 180,
    },
    {
      dataIndex: 'deliveryTotal',
      render: (_, record) => (
        <Typography.Text>
          {record.sentTotal}/{record.deliveryTotal}
          {record.failedTotal > 0 ? (
            <Typography.Text type="danger"> · {record.failedTotal}</Typography.Text>
          ) : null}
        </Typography.Text>
      ),
      title: t('system.notificationManagement.column.delivery', '投递概况'),
      width: 120,
    },
    {
      dataIndex: 'source',
      render: (_, record) =>
        resolveAdminMessageLabel(
          getAdminMessageSourceConfig(record.source)?.label,
          t,
          record.source,
        ),
      title: t('notification.detail.source', '来源'),
      width: 160,
    },
    {
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      title: t('notification.detail.createdAt', '时间'),
      width: 180,
    },
  ];
}
