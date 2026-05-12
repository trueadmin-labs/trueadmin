import { Flex, Switch } from 'antd';
import type { ReactNode } from 'react';

export function LayoutSettingsSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="trueadmin-settings-section">
      <div className="trueadmin-settings-section-title">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}

export function LayoutSettingsSwitchRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: ReactNode;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Flex className="trueadmin-settings-row" align="center" justify="space-between">
      <span>{label}</span>
      <Switch checked={checked} onChange={onChange} />
    </Flex>
  );
}
