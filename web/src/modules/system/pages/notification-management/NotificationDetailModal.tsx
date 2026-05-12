import { Button, Collapse, Descriptions, Space, Tag, Typography } from 'antd';
import { useI18n } from '@/core/i18n/I18nProvider';
import { LoadingContainer } from '@/core/loading/LoadingContainer';
import { TrueAdminMarkdown } from '@/core/markdown';
import { TrueAdminModal } from '@/core/modal';
import {
  type AdminMessageLevel,
  type AdminNotificationBatch,
  type AdminNotificationBatchStatus,
  type AdminNotificationTargetType,
  getAdminMessageSourceConfig,
  getAdminMessageTypeConfig,
  resolveAdminMessageLabel,
} from '@/core/notification';
import { TrueAdminAttachmentUpload } from '@/core/upload';
import { batchStatusColor, levelColor } from './notificationManagementModel';

type NotificationDetailModalProps = {
  open: boolean;
  batch?: AdminNotificationBatch;
  loading?: boolean;
  statusText: Record<AdminNotificationBatchStatus, string>;
  levelText: Record<AdminMessageLevel, string>;
  targetTypeText: Record<AdminNotificationTargetType, string>;
  onClose: () => void;
  afterOpenChange?: (open: boolean) => void;
};

export function NotificationDetailModal({
  open,
  batch,
  loading = false,
  statusText,
  levelText,
  targetTypeText,
  onClose,
  afterOpenChange,
}: NotificationDetailModalProps) {
  const { t } = useI18n();
  const typeConfig = batch ? getAdminMessageTypeConfig(batch.type) : undefined;
  return (
    <TrueAdminModal
      destroyOnHidden
      open={open}
      title={batch?.title ?? ''}
      width={920}
      footer={<Button onClick={onClose}>{t('modal.action.close', '关闭')}</Button>}
      onCancel={onClose}
      afterOpenChange={afterOpenChange}
    >
      <LoadingContainer loading={loading} initialLoadingHeight={360}>
        {batch && typeConfig ? (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Space size={8} wrap>
              <Tag color={batchStatusColor[batch.status]}>{statusText[batch.status]}</Tag>
              <Tag color={typeConfig.color}>
                {resolveAdminMessageLabel(typeConfig.label, t, batch.type)}
              </Tag>
              <Tag color={levelColor[batch.level]}>{levelText[batch.level]}</Tag>
            </Space>
            <Descriptions size="small" column={{ xs: 1, md: 2 }}>
              <Descriptions.Item label={t('notification.detail.source', '来源')}>
                {resolveAdminMessageLabel(
                  getAdminMessageSourceConfig(batch.source)?.label,
                  t,
                  batch.source,
                )}
              </Descriptions.Item>
              <Descriptions.Item
                label={t('system.notificationManagement.column.target', '接收范围')}
              >
                {batch.targetSummary} · {targetTypeText[batch.targetType]}
              </Descriptions.Item>
              <Descriptions.Item
                label={t('system.notificationManagement.column.delivery', '投递概况')}
              >
                {batch.sentTotal}/{batch.deliveryTotal}
                {batch.failedTotal > 0 ? ` · ${String(batch.failedTotal)}` : ''}
              </Descriptions.Item>
              <Descriptions.Item
                label={t('system.notificationManagement.column.operator', '操作人')}
              >
                {batch.operatorName ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('notification.detail.createdAt', '时间')}>
                {batch.createdAt ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item
                label={t('system.notificationManagement.form.expireAt', '过期时间')}
              >
                {batch.expireAt ?? '-'}
              </Descriptions.Item>
            </Descriptions>
            <div className="trueadmin-message-detail-content">
              <TrueAdminMarkdown value={batch.content} />
            </div>
            {batch.attachments?.length ? (
              <TrueAdminAttachmentUpload readonly value={batch.attachments} />
            ) : null}
            {batch.payload && Object.keys(batch.payload).length > 0 ? (
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
                        {JSON.stringify(batch.payload, null, 2)}
                      </Typography.Paragraph>
                    ),
                  },
                ]}
                size="small"
              />
            ) : null}
          </Space>
        ) : null}
      </LoadingContainer>
    </TrueAdminModal>
  );
}
