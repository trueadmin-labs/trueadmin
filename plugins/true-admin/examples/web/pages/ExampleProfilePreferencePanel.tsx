import { AppstoreOutlined, ExperimentOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Flex, Segmented, Select, Space, Switch, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';

export const EXAMPLE_PROFILE_PREFERENCE_KEY = 'true-admin.examples.experience';

type ExampleProfilePreferencePanelProps = {
  value: Record<string, unknown>;
  saving: boolean;
  onSave: (values: Record<string, unknown>) => Promise<void>;
};

type ExamplePreference = {
  density: 'comfortable' | 'compact';
  showTips: boolean;
  defaultCategory: string;
};

const toBoolean = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback;

const toDensity = (value: unknown): ExamplePreference['density'] =>
  value === 'compact' ? 'compact' : 'comfortable';

const toPreferenceString = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() !== '' ? value : fallback;

export function ExampleProfilePreferencePanel({
  value,
  saving,
  onSave,
}: ExampleProfilePreferencePanelProps) {
  const { t } = useI18n();
  const preference = useMemo<ExamplePreference>(
    () => ({
      density: toDensity(value.density),
      showTips: toBoolean(value.showTips, true),
      defaultCategory: toPreferenceString(value.defaultCategory, 'components'),
    }),
    [value],
  );

  const save = (next: Partial<ExamplePreference>) => onSave({ ...preference, ...next });

  return (
    <Space orientation="vertical" size={14} className="trueadmin-examples-profile-preference">
      <Alert
        type="info"
        showIcon
        icon={<ExperimentOutlined />}
        message={t('examples.profilePreference.notice', '这是插件注册的个人偏好面板')}
        description={t(
          'examples.profilePreference.noticeDesc',
          '用于演示插件如何在个人中心注册自定义配置、读取当前值并保存到自己的 namespace。',
        )}
      />

      <Flex className="trueadmin-profile-preference-row" align="center" justify="space-between">
        <Space size={8}>
          <AppstoreOutlined />
          <span>{t('examples.profilePreference.density', '示例展示密度')}</span>
        </Space>
        <Segmented
          value={preference.density}
          options={[
            {
              label: t('examples.profilePreference.density.comfortable', '舒适'),
              value: 'comfortable',
            },
            { label: t('examples.profilePreference.density.compact', '紧凑'), value: 'compact' },
          ]}
          onChange={(density) => save({ density: density as ExamplePreference['density'] })}
        />
      </Flex>

      <Flex className="trueadmin-profile-preference-row" align="center" justify="space-between">
        <Space size={8}>
          <InfoCircleOutlined />
          <span>{t('examples.profilePreference.showTips', '显示示例提示')}</span>
        </Space>
        <Switch
          checked={preference.showTips}
          loading={saving}
          onChange={(showTips) => save({ showTips })}
        />
      </Flex>

      <Flex className="trueadmin-profile-preference-row" align="center" justify="space-between">
        <span>{t('examples.profilePreference.defaultCategory', '默认示例分类')}</span>
        <Select
          value={preference.defaultCategory}
          style={{ width: 160 }}
          options={[
            {
              label: t('examples.profilePreference.category.components', '通用组件'),
              value: 'components',
            },
            { label: t('examples.profilePreference.category.crud', 'CRUD 页面'), value: 'crud' },
            {
              label: t('examples.profilePreference.category.feedback', '操作反馈'),
              value: 'feedback',
            },
          ]}
          onChange={(defaultCategory) => save({ defaultCategory })}
        />
      </Flex>

      <Typography.Text type="secondary">
        {t('examples.profilePreference.namespace', '保存命名空间')}:{' '}
        <Tag>{EXAMPLE_PROFILE_PREFERENCE_KEY}</Tag>
      </Typography.Text>
    </Space>
  );
}
