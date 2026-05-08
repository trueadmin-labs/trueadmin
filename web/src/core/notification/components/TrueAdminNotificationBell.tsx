import { BellOutlined } from '@ant-design/icons';
import { Badge, Button, Popover } from 'antd';
import { useEffect } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { useAdminNotificationStore } from '../store';
import { TrueAdminNotificationPopover } from './TrueAdminNotificationPopover';

export function TrueAdminNotificationBell() {
  const { t } = useI18n();
  const unreadCount = useAdminNotificationStore((state) => state.unreadCount.total);
  const initialized = useAdminNotificationStore((state) => state.initialized);
  const refresh = useAdminNotificationStore((state) => state.refresh);
  const startRealtime = useAdminNotificationStore((state) => state.startRealtime);
  const stopRealtime = useAdminNotificationStore((state) => state.stopRealtime);

  useEffect(() => {
    startRealtime({ mode: 'auto' });
    return () => stopRealtime();
  }, [startRealtime, stopRealtime]);

  useEffect(() => {
    if (!initialized) {
      void refresh();
    }
  }, [initialized, refresh]);

  return (
    <Popover
      arrow={false}
      content={<TrueAdminNotificationPopover />}
      placement="bottomRight"
      trigger="click"
    >
      <Button
        aria-label={t('notification.title', '消息通知')}
        type="text"
        icon={
          <Badge count={unreadCount} overflowCount={99} size="small">
            <BellOutlined />
          </Badge>
        }
      />
    </Popover>
  );
}
