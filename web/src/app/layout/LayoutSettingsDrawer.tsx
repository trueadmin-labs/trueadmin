import {
  BgColorsOutlined,
  CheckOutlined,
  LayoutOutlined,
  MenuFoldOutlined,
  MoonOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Divider,
  Drawer,
  Flex,
  Segmented,
  Space,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import { useState } from 'react';
import { authKeys } from '@/core/auth';
import { useI18n } from '@/core/i18n/I18nProvider';
import { queryClient } from '@/core/query/client';
import { type LayoutMode, useLayoutStore } from '@/core/store/layoutStore';
import {
  getCurrentSystemLayoutPreference,
  SYSTEM_LAYOUT_PREFERENCE_KEY,
} from '@/modules/system/profile/layoutPreference';
import { profileApi } from '@/modules/system/services/profile.api';

const colorPresets = [
  { label: '商务蓝', value: '#2f54eb' },
  { label: '深海蓝', value: '#1d39c4' },
  { label: '典雅黑', value: '#334155' },
  { label: '湖泊青', value: '#08979c' },
  { label: '松石绿', value: '#237804' },
  { label: '冷杉绿', value: '#0f766e' },
  { label: '沉稳靛', value: '#4338ca' },
  { label: '石墨紫', value: '#531dab' },
];

const layoutOptions: Array<{
  label: string;
  value: LayoutMode;
  disabled?: boolean;
}> = [
  { label: 'Classic', value: 'classic' },
  { label: 'Mixed', value: 'mixed' },
  { label: 'Columns', value: 'columns' },
];

function SettingSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
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

export function LayoutSettingsDrawer() {
  const { t } = useI18n();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const layoutMode = useLayoutStore((state) => state.layoutMode);
  const setLayoutMode = useLayoutStore((state) => state.setLayoutMode);
  const collapsed = useLayoutStore((state) => state.collapsed);
  const setCollapsed = useLayoutStore((state) => state.setCollapsed);
  const darkMode = useLayoutStore((state) => state.darkMode);
  const setDarkMode = useLayoutStore((state) => state.setDarkMode);
  const showFooter = useLayoutStore((state) => state.showFooter);
  const setShowFooter = useLayoutStore((state) => state.setShowFooter);
  const showTabs = useLayoutStore((state) => state.showTabs);
  const setShowTabs = useLayoutStore((state) => state.setShowTabs);
  const showBreadcrumb = useLayoutStore((state) => state.showBreadcrumb);
  const setShowBreadcrumb = useLayoutStore((state) => state.setShowBreadcrumb);
  const primaryColor = useLayoutStore((state) => state.primaryColor);
  const setPrimaryColor = useLayoutStore((state) => state.setPrimaryColor);

  const saveLayoutPreference = async () => {
    setSaving(true);
    try {
      const nextProfile = await profileApi.updatePreferences({
        namespace: SYSTEM_LAYOUT_PREFERENCE_KEY,
        values: getCurrentSystemLayoutPreference(),
      });
      queryClient.setQueryData(authKeys.me, (current: unknown) =>
        current && typeof current === 'object'
          ? { ...current, preferences: nextProfile.preferences }
          : current,
      );
      message.success(t('system.layoutSettings.saveSuccess', '界面设置已保存到个人配置'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Tooltip title="布局设置">
        <Button type="text" icon={<SettingOutlined />} onClick={() => setOpen(true)} />
      </Tooltip>
      <Drawer
        className={`trueadmin-settings-drawer${darkMode ? ' is-dark' : ''}`}
        title={t('system.layoutSettings.title', '布局设置')}
        size={360}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <Button
            block
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={saveLayoutPreference}
          >
            {t('system.layoutSettings.save', '保存到个人配置')}
          </Button>
        }
      >
        <Space orientation="vertical" size={20} className="trueadmin-settings-content">
          <SettingSection
            title={t('system.layoutSettings.theme', '主题')}
            icon={<BgColorsOutlined />}
          >
            <div className="trueadmin-settings-color-grid">
              {colorPresets.map((color) => (
                <Tooltip title={color.label} key={color.value}>
                  <button
                    className="trueadmin-settings-color-swatch"
                    type="button"
                    aria-label={color.label}
                    aria-pressed={primaryColor === color.value}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setPrimaryColor(color.value)}
                  >
                    {primaryColor === color.value ? <CheckOutlined /> : null}
                  </button>
                </Tooltip>
              ))}
            </div>
            <Flex className="trueadmin-settings-row" align="center" justify="space-between">
              <span>{t('system.layoutSettings.darkMode', '暗黑模式')}</span>
              <Switch checked={darkMode} onChange={setDarkMode} />
            </Flex>
          </SettingSection>

          <Divider className="trueadmin-settings-divider" />

          <SettingSection
            title={t('system.layoutSettings.layout', '布局')}
            icon={<LayoutOutlined />}
          >
            <Segmented
              block
              value={layoutMode}
              options={layoutOptions}
              onChange={(value) => setLayoutMode(value as LayoutMode)}
            />
            <Typography.Paragraph type="secondary" className="trueadmin-settings-hint">
              {t('system.layoutSettings.layoutHint', '三种布局均可切换，适配不同菜单组织方式。')}
            </Typography.Paragraph>
          </SettingSection>

          <Divider className="trueadmin-settings-divider" />

          <SettingSection
            title={t('system.layoutSettings.display', '显示')}
            icon={<MenuFoldOutlined />}
          >
            <Space orientation="vertical" size={12} className="trueadmin-settings-content">
              <Flex className="trueadmin-settings-row" align="center" justify="space-between">
                <span>{t('system.layoutSettings.collapsed', '折叠菜单')}</span>
                <Switch checked={collapsed} onChange={setCollapsed} />
              </Flex>
              <Flex className="trueadmin-settings-row" align="center" justify="space-between">
                <span>{t('system.layoutSettings.showBreadcrumb', '面包屑')}</span>
                <Switch checked={showBreadcrumb} onChange={setShowBreadcrumb} />
              </Flex>
              <Flex className="trueadmin-settings-row" align="center" justify="space-between">
                <span>{t('system.layoutSettings.showFooter', '页脚')}</span>
                <Switch checked={showFooter} onChange={setShowFooter} />
              </Flex>
              <Flex className="trueadmin-settings-row" align="center" justify="space-between">
                <span>{t('system.layoutSettings.showTabs', '标签栏')}</span>
                <Switch checked={showTabs} onChange={setShowTabs} />
              </Flex>
            </Space>
          </SettingSection>

          <Divider className="trueadmin-settings-divider" />

          <div className="trueadmin-settings-summary">
            <MoonOutlined />
            <span>
              {darkMode
                ? t('system.layoutSettings.summary.dark', '当前为暗黑主题')
                : t('system.layoutSettings.summary.light', '当前为亮色主题')}
            </span>
          </div>
        </Space>
      </Drawer>
    </>
  );
}
