import { Form, Segmented, Space } from 'antd';
import { TrueAdminIconPicker } from '@/core/icon/TrueAdminIconPicker';
import { MenuIconImageInput } from './MenuIconImageInput';
import type { MenuIconMode } from './menuFormModel';

type MenuFormIconFieldProps = {
  iconMode: MenuIconMode;
  t: (key: string, fallback?: string) => string;
  onChangeIconMode: (mode: MenuIconMode) => void;
};

export function MenuFormIconField({ iconMode, t, onChangeIconMode }: MenuFormIconFieldProps) {
  return (
    <Form.Item label={t('system.menus.form.icon', '图标')}>
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        <Segmented<MenuIconMode>
          block
          value={iconMode}
          options={[
            {
              label: t('system.menus.form.iconMode.name', '图标名称'),
              value: 'name',
            },
            {
              label: t('system.menus.form.iconMode.image', '图片图标'),
              value: 'image',
            },
          ]}
          onChange={onChangeIconMode}
        />
        {iconMode === 'name' ? (
          <Form.Item name="icon" noStyle>
            <TrueAdminIconPicker placeholder="SettingOutlined" />
          </Form.Item>
        ) : (
          <Form.Item name="icon" noStyle>
            <MenuIconImageInput />
          </Form.Item>
        )}
      </Space>
    </Form.Item>
  );
}
