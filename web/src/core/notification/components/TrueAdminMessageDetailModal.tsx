import { Button, Collapse, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminMarkdown } from '@/core/markdown';
import { TrueAdminModal } from '@/core/modal';
import { TrueAdminAttachmentUpload } from '@/core/upload';
import {
  getAdminMessageSourceConfig,
  getAdminMessageTypeConfig,
  resolveAdminMessageLabel,
} from '../registry';
import { useAdminNotificationStore } from '../store';
import type { AdminMessageItem, AdminMessageLevel } from '../types';

export type TrueAdminMessageDetailModalProps = {
  message?: AdminMessageItem;
  open?: boolean;
  onClose?: () => void;
};

const levelColorMap: Record<AdminMessageLevel, string> = {
  error: 'red',
  info: 'blue',
  success: 'green',
  warning: 'gold',
};

export function TrueAdminMessageDetailModal({
  message,
  onClose,
  open,
}: TrueAdminMessageDetailModalProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const markRead = useAdminNotificationStore((state) => state.markRead);
  const [cachedMessage, setCachedMessage] = useState<AdminMessageItem>();
  const [optimisticReadAt, setOptimisticReadAt] = useState<string>();
  const markedReadKeyRef = useRef<string | undefined>(undefined);
  const activeMessage = message ?? cachedMessage;
  const messageKey = activeMessage ? [activeMessage.kind, activeMessage.id].join(':') : undefined;

  useEffect(() => {
    if (message) {
      setCachedMessage(message);
    }
  }, [message]);

  useEffect(() => {
    setOptimisticReadAt(undefined);
  }, [messageKey]);

  useEffect(() => {
    if (!open || !message || message.readAt) {
      return;
    }

    const nextMessageKey = [message.kind, message.id].join(':');
    if (markedReadKeyRef.current === nextMessageKey) {
      return;
    }

    markedReadKeyRef.current = nextMessageKey;
    const readAt = new Date().toISOString();
    setOptimisticReadAt(readAt);
    void markRead([message]).catch(() => {
      markedReadKeyRef.current = undefined;
      setOptimisticReadAt(undefined);
    });
  }, [markRead, message, open]);

  const displayMessage = useMemo(
    () =>
      activeMessage && optimisticReadAt
        ? { ...activeMessage, readAt: activeMessage.readAt ?? optimisticReadAt }
        : activeMessage,
    [activeMessage, optimisticReadAt],
  );

  if (!displayMessage) {
    return null;
  }

  const typeConfig = getAdminMessageTypeConfig(displayMessage.type);
  const sourceConfig = displayMessage.source
    ? getAdminMessageSourceConfig(displayMessage.source)
    : undefined;
  const sourceLabel = displayMessage.source
    ? resolveAdminMessageLabel(sourceConfig?.label, t, displayMessage.source)
    : '-';
  const levelLabel = t(`notification.level.${displayMessage.level}`, displayMessage.level);
  const payloadContent = displayMessage.payload
    ? (typeConfig.payloadRender?.({ message: displayMessage, payload: displayMessage.payload }) ??
      sourceConfig?.payloadRender?.({
        message: displayMessage,
        payload: displayMessage.payload,
      }) ?? (
        <Typography.Paragraph
          code
          className="trueadmin-message-detail-payload-code"
          style={{ margin: 0, whiteSpace: 'pre-wrap' }}
        >
          {JSON.stringify(displayMessage.payload, null, 2)}
        </Typography.Paragraph>
      ))
    : null;
  const goTarget = () => {
    if (!displayMessage.targetUrl) {
      return;
    }

    onClose?.();
    if (/^https?:\/\//.test(displayMessage.targetUrl)) {
      window.open(displayMessage.targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    navigate(displayMessage.targetUrl);
  };

  return (
    <TrueAdminModal
      destroyOnHidden
      open={open}
      title={displayMessage.title}
      width={920}
      footer={
        <Space>
          {displayMessage.targetUrl ? (
            <Button type="primary" onClick={goTarget}>
              {t('notification.detail.goTarget', '前往处理')}
            </Button>
          ) : null}
          <Button onClick={onClose}>{t('modal.action.close', '关闭')}</Button>
        </Space>
      }
      afterOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setCachedMessage(undefined);
          setOptimisticReadAt(undefined);
          markedReadKeyRef.current = undefined;
        }
      }}
      onCancel={onClose}
    >
      <Space
        className="trueadmin-message-detail"
        orientation="vertical"
        size={16}
        style={{ width: '100%' }}
      >
        <div className="trueadmin-message-detail-meta">
          <Space size={8} wrap>
            <Tag color={typeConfig.color}>
              {resolveAdminMessageLabel(typeConfig.label, t, displayMessage.type)}
            </Tag>
            <Tag color={levelColorMap[displayMessage.level]}>{levelLabel}</Tag>
            {displayMessage.pinned ? (
              <Tag color="gold">{t('notification.pinned', '置顶')}</Tag>
            ) : null}
          </Space>
          <Space className="trueadmin-message-detail-meta-extra" size={16} wrap>
            <span className="trueadmin-message-detail-meta-item">
              <Typography.Text type="secondary">
                {t('notification.detail.source', '来源')}
              </Typography.Text>
              <Typography.Text>{sourceLabel}</Typography.Text>
            </span>
            <span className="trueadmin-message-detail-meta-item">
              <Typography.Text type="secondary">
                {t('notification.detail.createdAt', '时间')}
              </Typography.Text>
              <Typography.Text>{displayMessage.createdAt}</Typography.Text>
            </span>
          </Space>
        </div>
        <div className="trueadmin-message-detail-content">
          <TrueAdminMarkdown value={displayMessage.content} />
        </div>
        {displayMessage.attachments?.length ? (
          <TrueAdminAttachmentUpload readonly value={displayMessage.attachments} />
        ) : null}
        {payloadContent ? (
          <Collapse
            className="trueadmin-message-detail-payload"
            ghost
            items={[
              {
                key: 'payload',
                label: t('notification.detail.payload', '扩展数据'),
                children: payloadContent,
              },
            ]}
            size="small"
          />
        ) : null}
      </Space>
    </TrueAdminModal>
  );
}
