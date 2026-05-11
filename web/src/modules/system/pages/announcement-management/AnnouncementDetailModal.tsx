import { Button, Collapse, Descriptions, Space, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminMarkdown } from '@/core/markdown';
import { TrueAdminModal } from '@/core/modal';
import {
  type AdminAnnouncement,
  type AdminAnnouncementStatus,
  type AdminAnnouncementTargetType,
  type AdminMessageLevel,
  getAdminMessageSourceConfig,
  resolveAdminMessageLabel,
} from '@/core/notification';
import { TrueAdminAuditTimeline, type TrueAdminAuditTimelineItem } from '@/core/timeline';
import { TrueAdminAttachmentUpload } from '@/core/upload';
import { announcementStatusColor, levelColor } from './announcementManagementModel';

type AnnouncementDetailModalProps = {
  open: boolean;
  announcement?: AdminAnnouncement;
  statusText: Record<AdminAnnouncementStatus, string>;
  levelText: Record<AdminMessageLevel, string>;
  targetTypeText: Record<AdminAnnouncementTargetType, string>;
  onClose: () => void;
  afterOpenChange?: (open: boolean) => void;
};

export function AnnouncementDetailModal({
  open,
  announcement,
  statusText,
  levelText,
  targetTypeText,
  onClose,
  afterOpenChange,
}: AnnouncementDetailModalProps) {
  const { t } = useI18n();
  const auditItems = useMemo<TrueAdminAuditTimelineItem[]>(() => {
    if (!announcement) {
      return [];
    }

    return [
      {
        color: 'blue',
        description: t('system.announcementManagement.audit.created.description', '公告已创建'),
        operator: announcement.operatorName,
        time: announcement.createdAt,
        title: t('system.announcementManagement.audit.created', '创建'),
      },
      announcement.publishedAt
        ? {
            color: 'green',
            description: t(
              'system.announcementManagement.audit.published.description',
              '公告已发布',
            ),
            operator: announcement.operatorName,
            time: announcement.publishedAt,
            title: t('system.announcementManagement.audit.published', '发布'),
          }
        : undefined,
      announcement.offlineAt
        ? {
            color: 'gray',
            description: t('system.announcementManagement.audit.offline.description', '公告已下线'),
            operator: announcement.operatorName,
            time: announcement.offlineAt,
            title: t('system.announcementManagement.audit.offline', '下线'),
          }
        : undefined,
    ].filter(Boolean) as TrueAdminAuditTimelineItem[];
  }, [announcement, t]);

  return (
    <TrueAdminModal
      destroyOnHidden
      open={open}
      title={announcement?.title ?? ''}
      width={920}
      footer={<Button onClick={onClose}>{t('modal.action.close', '关闭')}</Button>}
      onCancel={onClose}
      afterOpenChange={afterOpenChange}
    >
      {announcement ? (
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <Space size={8} wrap>
            <Tag color={announcementStatusColor[announcement.status]}>
              {statusText[announcement.status]}
            </Tag>
            <Tag color="purple">{t('notification.type.announcement', '公告')}</Tag>
            <Tag color={levelColor[announcement.level]}>{levelText[announcement.level]}</Tag>
            {announcement.pinned ? (
              <Tag color="gold">{t('notification.pinned', '置顶')}</Tag>
            ) : null}
          </Space>
          <Descriptions size="small" column={{ xs: 1, md: 2 }}>
            <Descriptions.Item label={t('notification.detail.source', '来源')}>
              {resolveAdminMessageLabel(
                getAdminMessageSourceConfig(announcement.source)?.label,
                t,
                announcement.source,
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.announcementManagement.column.target', '可见范围')}>
              {announcement.targetSummary} · {targetTypeText[announcement.targetType]}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.announcementManagement.column.operator', '操作人')}>
              {announcement.operatorName ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item
              label={t('system.announcementManagement.form.scheduledAt', '定时发布时间')}
            >
              {announcement.scheduledAt ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item
              label={t('system.announcementManagement.column.publishedAt', '发布时间')}
            >
              {announcement.publishedAt ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.announcementManagement.form.expireAt', '过期时间')}>
              {announcement.expireAt ?? '-'}
            </Descriptions.Item>
          </Descriptions>
          <div className="trueadmin-message-detail-content">
            <TrueAdminMarkdown value={announcement.content} />
          </div>
          {announcement.attachments?.length ? (
            <TrueAdminAttachmentUpload readonly value={announcement.attachments} />
          ) : null}
          {announcement.payload && Object.keys(announcement.payload).length > 0 ? (
            <Collapse
              className="trueadmin-message-detail-payload"
              ghost
              items={[
                {
                  key: 'payload',
                  label: t('notification.detail.payload', '扩展数据'),
                  children: (
                    <Typography.Paragraph
                      code
                      className="trueadmin-message-detail-payload-code"
                      style={{ margin: 0, whiteSpace: 'pre-wrap' }}
                    >
                      {JSON.stringify(announcement.payload, null, 2)}
                    </Typography.Paragraph>
                  ),
                },
              ]}
              size="small"
            />
          ) : null}
          <div className="trueadmin-notification-management-audit">
            <Typography.Text strong>
              {t('system.announcementManagement.audit.title', '操作记录')}
            </Typography.Text>
            <TrueAdminAuditTimeline items={auditItems} />
          </div>
        </Space>
      ) : null}
    </TrueAdminModal>
  );
}
