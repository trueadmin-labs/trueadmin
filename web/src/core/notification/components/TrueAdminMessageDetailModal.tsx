import { Button, Descriptions, Space, Tag, Typography } from 'antd';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminMarkdown } from '@/core/markdown';
import { TrueAdminModal } from '@/core/modal';
import { TrueAdminAttachmentUpload } from '@/core/upload';
import { getAdminMessageTypeConfig } from '../registry';
import { useAdminNotificationStore } from '../store';
import type { AdminMessageItem } from '../types';

export type TrueAdminMessageDetailModalProps = {
  message?: AdminMessageItem;
  open?: boolean;
  onClose?: () => void;
};

export function TrueAdminMessageDetailModal({
  message,
  onClose,
  open,
}: TrueAdminMessageDetailModalProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const markRead = useAdminNotificationStore((state) => state.markRead);

  useEffect(() => {
    if (open && message && !message.readAt) {
      void markRead([message]);
    }
  }, [markRead, message, open]);

  if (!message) {
    return null;
  }

  const typeConfig = getAdminMessageTypeConfig(message.type);
  const goTarget = () => {
    if (!message.targetUrl) {
      return;
    }

    onClose?.();
    if (/^https?:\/\//.test(message.targetUrl)) {
      window.open(message.targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    navigate(message.targetUrl);
  };

  return (
    <TrueAdminModal
      destroyOnHidden
      open={open}
      title={message.title}
      width={920}
      footer={
        <Space>
          {message.targetUrl ? (
            <Button type="primary" onClick={goTarget}>
              {t('notification.detail.goTarget', '前往处理')}
            </Button>
          ) : null}
          <Button onClick={onClose}>{t('modal.action.close', '关闭')}</Button>
        </Space>
      }
      onCancel={onClose}
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Space size={8} wrap>
          <Tag color={message.kind === 'announcement' ? 'purple' : 'blue'}>
            {message.kind === 'announcement'
              ? t('notification.kind.announcement', '公告')
              : t('notification.kind.notification', '通知')}
          </Tag>
          <Tag color={typeConfig.color}>{typeConfig.label ?? message.type}</Tag>
          <Tag>{message.level}</Tag>
          {message.pinned ? <Tag color="gold">{t('notification.pinned', '置顶')}</Tag> : null}
        </Space>
        <TrueAdminMarkdown value={message.content} />
        {message.attachments?.length ? (
          <TrueAdminAttachmentUpload readonly value={message.attachments} />
        ) : null}
        <Descriptions size="small" column={2} bordered>
          <Descriptions.Item label={t('notification.detail.source', '来源')}>
            {message.source ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('notification.detail.createdAt', '时间')}>
            {message.createdAt}
          </Descriptions.Item>
          <Descriptions.Item label={t('notification.detail.readAt', '已读时间')} span={2}>
            {message.readAt ?? '-'}
          </Descriptions.Item>
          {message.payload ? (
            <Descriptions.Item label="Payload" span={2}>
              <Typography.Paragraph code style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(message.payload, null, 2)}
              </Typography.Paragraph>
            </Descriptions.Item>
          ) : null}
        </Descriptions>
      </Space>
    </TrueAdminModal>
  );
}
