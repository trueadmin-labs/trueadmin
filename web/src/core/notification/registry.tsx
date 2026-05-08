import { BellOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { AdminMessageTypeConfig } from './types';

const registry = new Map<string, AdminMessageTypeConfig>();

export const defaultAdminMessageTypeConfig: AdminMessageTypeConfig = {
  color: 'default',
  icon: <InfoCircleOutlined />,
};

export const registerAdminMessageType = (type: string, config: AdminMessageTypeConfig) => {
  registry.set(type, config);

  return () => {
    registry.delete(type);
  };
};

export const getAdminMessageTypeConfig = (type: string): AdminMessageTypeConfig => ({
  ...defaultAdminMessageTypeConfig,
  ...registry.get(type),
});

export const getRegisteredAdminMessageTypes = () => [...registry.keys()];

registerAdminMessageType('system', {
  color: 'blue',
  icon: <InfoCircleOutlined />,
});

registerAdminMessageType('announcement', {
  color: 'purple',
  icon: <BellOutlined />,
});

registerAdminMessageType('alert', {
  color: 'red',
  icon: <ExclamationCircleOutlined />,
});
