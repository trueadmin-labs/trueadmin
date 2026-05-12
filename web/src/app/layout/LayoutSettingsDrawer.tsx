import {
  BgColorsOutlined,
  CheckOutlined,
  LayoutOutlined,
  MenuFoldOutlined,
  MoonOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { App, Button, Divider, Drawer, Segmented, Space, Tooltip, Typography } from 'antd';
import { useCallback, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { type LayoutMode, useLayoutStore } from '@/core/store/layoutStore';
import { LayoutSettingsSection, LayoutSettingsSwitchRow } from './LayoutSettingsSection';
import { colorPresets, layoutOptions } from './layoutSettingsModel';
import { useLayoutPreferenceSave } from './useLayoutPreferenceSave';

export function LayoutSettingsDrawer() {
  const { t } = useI18n();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
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
  const handleSaveSuccess = useCallback(() => {
    message.success(t('system.layoutSettings.saveSuccess', '界面设置已保存到个人配置'));
  }, [message, t]);
  const { saveLayoutPreference, saving } = useLayoutPreferenceSave({
    onSuccess: handleSaveSuccess,
  });

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
          <LayoutSettingsSection
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
            <LayoutSettingsSwitchRow
              checked={darkMode}
              label={t('system.layoutSettings.darkMode', '暗黑模式')}
              onChange={setDarkMode}
            />
          </LayoutSettingsSection>

          <Divider className="trueadmin-settings-divider" />

          <LayoutSettingsSection
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
          </LayoutSettingsSection>

          <Divider className="trueadmin-settings-divider" />

          <LayoutSettingsSection
            title={t('system.layoutSettings.display', '显示')}
            icon={<MenuFoldOutlined />}
          >
            <Space orientation="vertical" size={12} className="trueadmin-settings-content">
              <LayoutSettingsSwitchRow
                checked={collapsed}
                label={t('system.layoutSettings.collapsed', '折叠菜单')}
                onChange={setCollapsed}
              />
              <LayoutSettingsSwitchRow
                checked={showBreadcrumb}
                label={t('system.layoutSettings.showBreadcrumb', '面包屑')}
                onChange={setShowBreadcrumb}
              />
              <LayoutSettingsSwitchRow
                checked={showFooter}
                label={t('system.layoutSettings.showFooter', '页脚')}
                onChange={setShowFooter}
              />
              <LayoutSettingsSwitchRow
                checked={showTabs}
                label={t('system.layoutSettings.showTabs', '标签栏')}
                onChange={setShowTabs}
              />
            </Space>
          </LayoutSettingsSection>

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
