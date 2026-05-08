import { ClockCircleOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Empty, List, Space, Tag, Typography } from 'antd';
import { getAdminMessageTypeConfig } from '../registry';
import type { AdminMessageItem } from '../types';

export type TrueAdminMessageListProps = {
  messages: AdminMessageItem[];
  emptyText?: React.ReactNode;
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
  messages,
  onItemClick,
}: TrueAdminMessageListProps) {
  if (messages.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText ?? '-'} />;
  }

  return (
    <List<AdminMessageItem>
      className="trueadmin-message-list"
      dataSource={messages}
      renderItem={(message) => {
        const typeConfig = getAdminMessageTypeConfig(message.type);
        const summary = toPlainText(message.content);
        return (
          <List.Item
            className={['trueadmin-message-list-item', message.readAt ? '' : 'is-unread']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onItemClick?.(message)}
          >
            <List.Item.Meta
              avatar={<span className="trueadmin-message-list-icon">{typeConfig.icon}</span>}
              title={
                <Space size={6} wrap>
                  <Typography.Text strong={!message.readAt}>{message.title}</Typography.Text>
                  <Tag color={typeConfig.color}>{typeConfig.label ?? message.type}</Tag>
                  {message.kind === 'announcement' ? <Tag color="purple">公告</Tag> : null}
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
                    {message.source ? <span>{message.source}</span> : null}
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
