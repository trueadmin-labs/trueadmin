import { ClockCircleOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Empty, List, Space, Tag, Typography } from 'antd';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminIcon } from '@/core/icon/TrueAdminIcon';
import {
  getAdminMessageSourceConfig,
  getAdminMessageTypeConfig,
  resolveAdminMessageLabel,
} from '../registry';
import type { AdminMessageItem } from '../types';

export type TrueAdminMessageListProps = {
  messages: AdminMessageItem[];
  emptyText?: React.ReactNode;
  loading?: boolean;
  onItemClick?: (message: AdminMessageItem) => void;
};

const toPlainText = (value?: string) =>
  value
    ?.replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`\-[\]|()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function TrueAdminMessageList({
  emptyText,
  loading,
  messages,
  onItemClick,
}: TrueAdminMessageListProps) {
  const { t } = useI18n();
  if (!loading && messages.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText ?? '-'} />;
  }

  return (
    <List<AdminMessageItem>
      className="trueadmin-message-list"
      dataSource={messages}
      loading={loading}
      renderItem={(message) => {
        const typeConfig = getAdminMessageTypeConfig(message.type);
        const sourceLabel = message.source
          ? resolveAdminMessageLabel(
              getAdminMessageSourceConfig(message.source)?.label,
              t,
              message.source,
            )
          : undefined;
        const summary = toPlainText(message.content);
        return (
          <List.Item
            className={['trueadmin-message-list-item', message.readAt ? '' : 'is-unread']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onItemClick?.(message)}
          >
            <List.Item.Meta
              avatar={
                <span className="trueadmin-message-list-icon">
                  <TrueAdminIcon icon={typeConfig.icon} />
                </span>
              }
              title={
                <Space size={6} wrap>
                  <Tag color={typeConfig.color}>
                    {resolveAdminMessageLabel(typeConfig.label, t, message.type)}
                  </Tag>
                  <Typography.Text strong={!message.readAt}>{message.title}</Typography.Text>
                  {message.attachments?.length ? <PaperClipOutlined /> : null}
                </Space>
              }
              description={
                <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                  {summary ? (
                    <Typography.Text type="secondary" ellipsis>
                      {summary}
                    </Typography.Text>
                  ) : null}
                  <Space size={6} className="trueadmin-message-list-time">
                    <ClockCircleOutlined />
                    <span>{message.createdAt}</span>
                    {sourceLabel ? <span>{sourceLabel}</span> : null}
                  </Space>
                </Space>
              }
            />
          </List.Item>
        );
      }}
    />
  );
}
