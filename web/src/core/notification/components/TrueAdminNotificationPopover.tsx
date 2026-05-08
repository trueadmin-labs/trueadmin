import { Button, Divider, Space, Tabs, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useI18n } from '@/core/i18n/I18nProvider';
import { useAdminNotificationStore } from '../store';
import type { AdminMessageItem, AdminMessageKind } from '../types';
import { TrueAdminMessageDetailModal } from './TrueAdminMessageDetailModal';
import { TrueAdminMessageList } from './TrueAdminMessageList';

type NotificationTabKey = 'all' | AdminMessageKind;

export function TrueAdminNotificationPopover() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const messages = useAdminNotificationStore((state) => state.latestMessages);
  const readAll = useAdminNotificationStore((state) => state.readAll);
  const refresh = useAdminNotificationStore((state) => state.refresh);
  const [detailMessage, setDetailMessage] = useState<AdminMessageItem>();
  const tabItems = useMemo(
    () =>
      (['all', 'notification', 'announcement'] as NotificationTabKey[]).map((key) => ({
        key,
        label:
          key === 'all'
            ? t('notification.tab.all', '全部')
            : key === 'notification'
              ? t('notification.tab.notification', '通知')
              : t('notification.tab.announcement', '公告'),
        children: (
          <TrueAdminMessageList
            messages={messages
              .filter((message) => key === 'all' || message.kind === key)
              .slice(0, 5)}
            emptyText={t('notification.empty', '暂无消息')}
            onItemClick={setDetailMessage}
          />
        ),
      })),
    [messages, t],
  );

  return (
    <div className="trueadmin-notification-popover">
      <div className="trueadmin-notification-popover-header">
        <Typography.Text strong>{t('notification.title', '消息通知')}</Typography.Text>
        <Space size={8}>
          <Button size="small" type="link" onClick={() => void refresh()}>
            {t('notification.action.refresh', '刷新')}
          </Button>
          <Button size="small" type="link" onClick={() => void readAll('all')}>
            {t('notification.action.readAll', '全部已读')}
          </Button>
        </Space>
      </div>
      <Tabs size="small" items={tabItems} />
      <Divider style={{ margin: '8px 0' }} />
      <Button block type="link" onClick={() => navigate('/system/messages')}>
        {t('notification.action.viewAll', '查看全部')}
      </Button>
      <TrueAdminMessageDetailModal
        open={Boolean(detailMessage)}
        message={detailMessage}
        onClose={() => setDetailMessage(undefined)}
      />
    </div>
  );
}
