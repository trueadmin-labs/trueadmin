import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Space, Tag, Typography } from 'antd';
import type { CrudColumns } from '@/core/crud/types';
import type {
  AdminAnnouncement,
  AdminAnnouncementStatus,
  AdminAnnouncementTargetType,
  AdminMessageLevel,
} from '@/core/notification';
import { announcementStatusColor, levelColor, toPlainText } from './announcementManagementModel';

type AnnouncementTableColumnsOptions = {
  levelText: Record<AdminMessageLevel, string>;
  statusText: Record<AdminAnnouncementStatus, string>;
  targetTypeText: Record<AdminAnnouncementTargetType, string>;
  t: TranslateFunction;
};

export function createAnnouncementColumns({
  levelText,
  statusText,
  targetTypeText,
  t,
}: AnnouncementTableColumnsOptions): CrudColumns<AdminAnnouncement> {
  return [
    {
      dataIndex: 'title',
      fixed: 'left',
      render: (_, record) => {
        const summary = toPlainText(record.content);
        return (
          <div className="trueadmin-message-cell">
            <div className="trueadmin-message-cell-type">
              <Tag color="purple" style={{ marginInlineEnd: 0 }}>
                {t('notification.type.announcement', '公告')}
              </Tag>
            </div>
            <Space orientation="vertical" size={4} style={{ minWidth: 0 }}>
              <Space size={6} wrap>
                <Typography.Text strong>{record.title}</Typography.Text>
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
      dataIndex: 'status',
      render: (_, record) => (
        <Tag color={announcementStatusColor[record.status]}>{statusText[record.status]}</Tag>
      ),
      title: t('system.announcementManagement.column.status', '状态'),
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
      title: t('system.announcementManagement.column.target', '可见范围'),
      width: 180,
    },
    {
      dataIndex: 'readTotal',
      title: t('system.announcementManagement.stats.read', '已读'),
      width: 100,
    },
    {
      dataIndex: 'operatorName',
      title: t('system.announcementManagement.column.operator', '操作人'),
      width: 130,
    },
    {
      dataIndex: 'publishedAt',
      key: 'publish_at',
      render: (_, record) => record.publishedAt ?? record.scheduledAt ?? '-',
      sorter: true,
      title: t('system.announcementManagement.column.publishedAt', '发布时间'),
      width: 180,
    },
  ];
}
