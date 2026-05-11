import {
  BgColorsOutlined,
  CheckOutlined,
  LayoutOutlined,
  MenuFoldOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { Button, Flex, Segmented, Space, Switch, Tooltip, Typography } from 'antd';
import { useMemo } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { type LayoutMode, type LayoutPreferences, useLayoutStore } from '@/core/store/layoutStore';
import { pickSystemLayoutPreference } from '../../profile/layoutPreference';

type SystemLayoutPreferencePanelProps = {
  saving: boolean;
  onSave: (values: Record<string, unknown>) => Promise<void>;
};

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

const layoutOptions: Array<{ label: string; value: LayoutMode }> = [
  { label: 'Classic', value: 'classic' },
  { label: 'Mixed', value: 'mixed' },
  { label: 'Columns', value: 'columns' },
];

export function SystemLayoutPreferencePanel({ saving, onSave }: SystemLayoutPreferencePanelProps) {
  const { t } = useI18n();
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

  const layoutState = useMemo<LayoutPreferences>(
    () =>
      pickSystemLayoutPreference({
        layoutMode,
        collapsed,
        darkMode,
        showFooter,
        showTabs,
        showBreadcrumb,
        primaryColor,
      }),
    [collapsed, darkMode, layoutMode, primaryColor, showBreadcrumb, showFooter, showTabs],
  );

  return (
    <Space orientation="vertical" size={18} className="trueadmin-profile-preference-panel">
      <section className="trueadmin-profile-preference-section">
        <div className="trueadmin-profile-preference-title">
          <BgColorsOutlined />
          <span>{t('system.profile.preferences.theme', '主题')}</span>
        </div>
        <div className="trueadmin-profile-preference-color-grid">
          {colorPresets.map((color) => (
            <Tooltip title={color.label} key={color.value}>
              <button
                className="trueadmin-settings-color-swatch"
                type="button"
                aria-label={color.label}
                aria-pressed={layoutState.primaryColor === color.value}
                style={{ backgroundColor: color.value }}
                onClick={() => setPrimaryColor(color.value)}
              >
                {layoutState.primaryColor === color.value ? <CheckOutlined /> : null}
              </button>
            </Tooltip>
          ))}
        </div>
        <Flex className="trueadmin-profile-preference-row" align="center" justify="space-between">
          <span>{t('system.profile.preferences.darkMode', '暗黑模式')}</span>
          <Switch checked={layoutState.darkMode} onChange={setDarkMode} />
        </Flex>
      </section>

      <section className="trueadmin-profile-preference-section">
        <div className="trueadmin-profile-preference-title">
          <LayoutOutlined />
          <span>{t('system.profile.preferences.layout', '布局')}</span>
        </div>
        <Segmented
          block
          value={layoutState.layoutMode}
          options={layoutOptions}
          onChange={(layoutMode) => setLayoutMode(layoutMode as LayoutMode)}
        />
        <Typography.Paragraph type="secondary" className="trueadmin-profile-preference-hint">
          {t(
            'system.profile.preferences.layoutHint',
            '调整会先在当前界面预览，点击保存后才会写入当前账号。',
          )}
        </Typography.Paragraph>
      </section>

      <section className="trueadmin-profile-preference-section">
        <div className="trueadmin-profile-preference-title">
          <MenuFoldOutlined />
          <span>{t('system.profile.preferences.display', '显示')}</span>
        </div>
        <Space orientation="vertical" size={12} className="trueadmin-profile-preference-panel">
          <Flex className="trueadmin-profile-preference-row" align="center" justify="space-between">
            <span>{t('system.profile.preferences.collapsed', '折叠菜单')}</span>
            <Switch checked={layoutState.collapsed} onChange={setCollapsed} />
          </Flex>
          <Flex className="trueadmin-profile-preference-row" align="center" justify="space-between">
            <span>{t('system.profile.preferences.showBreadcrumb', '面包屑')}</span>
            <Switch checked={layoutState.showBreadcrumb} onChange={setShowBreadcrumb} />
          </Flex>
          <Flex className="trueadmin-profile-preference-row" align="center" justify="space-between">
            <span>{t('system.profile.preferences.showFooter', '页脚')}</span>
            <Switch checked={layoutState.showFooter} onChange={setShowFooter} />
          </Flex>
          <Flex className="trueadmin-profile-preference-row" align="center" justify="space-between">
            <span>{t('system.profile.preferences.showTabs', '标签栏')}</span>
            <Switch checked={layoutState.showTabs} onChange={setShowTabs} />
          </Flex>
        </Space>
      </section>

      <Button
        type="primary"
        icon={<SaveOutlined />}
        loading={saving}
        onClick={() => onSave(layoutState)}
      >
        {t('system.profile.preferences.saveCurrentLayout', '保存当前界面设置')}
      </Button>
    </Space>
  );
}
