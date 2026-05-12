import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Space, Tag, Typography } from 'antd';
import type { CrudColumns } from '@/core/crud/types';
import {
  type AdminMessageItem,
  type AdminMessageLevel,
  getAdminMessageSourceConfig,
  getAdminMessageTypeConfig,
  resolveAdminMessageLabel,
} from '@/core/notification';
import { levelColor, toPlainText } from './messagePageModel';

type MessageTableColumnsOptions = {
  levelText: Record<AdminMessageLevel, string>;
  t: TranslateFunction;
};

export function createMessageColumns({
  levelText,
  t,
}: MessageTableColumnsOptions): CrudColumns<AdminMessageItem> {
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
              <Space size={6} wrap>
                <Typography.Text strong={!record.readAt}>{record.title}</Typography.Text>
                {record.pinned ? <Tag color="gold">{t('notification.pinned', '置顶')}</Tag> : null}
              </Space>
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
      dataIndex: 'level',
      render: (_, record) => <Tag color={levelColor[record.level]}>{levelText[record.level]}</Tag>,
      title: t('system.messages.column.level', '等级'),
      width: 110,
    },
    {
      dataIndex: 'source',
      render: (_, record) =>
        record.source
          ? resolveAdminMessageLabel(
              getAdminMessageSourceConfig(record.source)?.label,
              t,
              record.source,
            )
          : '-',
      title: t('notification.detail.source', '来源'),
      width: 180,
    },
    {
      dataIndex: 'readAt',
      render: (_, record) =>
        record.readAt ? (
          <Tag>{t('system.messages.status.read', '已读')}</Tag>
        ) : (
          <Tag color="blue">{t('system.messages.status.unread', '未读')}</Tag>
        ),
      title: t('system.messages.column.readStatus', '阅读状态'),
      width: 120,
    },
    {
      dataIndex: 'archivedAt',
      render: (_, record) =>
        record.archivedAt ? <Tag>{t('system.messages.status.archived', '已归档')}</Tag> : '-',
      title: t('system.messages.column.archiveStatus', '归档状态'),
      width: 120,
    },
    {
      dataIndex: 'createdAt',
      key: 'created_at',
      sorter: true,
      title: t('notification.detail.createdAt', '时间'),
      width: 180,
    },
  ];
}
