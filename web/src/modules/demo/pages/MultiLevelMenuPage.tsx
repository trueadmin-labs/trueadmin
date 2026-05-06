import { BranchesOutlined } from '@ant-design/icons';
import { Card, Descriptions, Space, Tag, Typography } from 'antd';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';

const { Paragraph, Text } = Typography;

export default function MultiLevelMenuPage() {
  const { t } = useI18n();

  return (
    <TrueAdminPage title={t('demo.multilevel.title', '多级菜单示例')}>
      <Space direction="vertical" size={16} className="trueadmin-example-stack">
        <Card
          size="small"
          title={t('demo.multilevel.structure.title', '菜单层级')}
          extra={
            <Tag icon={<BranchesOutlined />}>{t('demo.multilevel.structure.tag', '三级')}</Tag>
          }
        >
          <Paragraph>
            {t(
              'demo.multilevel.structure.description',
              '这个页面用于验证前端注册菜单在 classic、mixed、columns 布局下的多级展开、选中和面包屑表现。',
            )}
          </Paragraph>
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label={t('demo.multilevel.structure.level1', '一级')}>
              {t('menu.demo.multilevel', '多级菜单')}
            </Descriptions.Item>
            <Descriptions.Item label={t('demo.multilevel.structure.level2', '二级')}>
              {t('menu.demo.multilevel.second', '二级菜单')}
            </Descriptions.Item>
            <Descriptions.Item label={t('demo.multilevel.structure.level3', '三级')}>
              {t('menu.demo.multilevel.third', '三级菜单')}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card size="small" title={t('demo.multilevel.expected.title', '预期表现')}>
          <Space direction="vertical" size={8}>
            <Text>
              {t('demo.multilevel.expected.classic', 'Classic：左侧完整菜单树展开到当前页面。')}
            </Text>
            <Text>
              {t('demo.multilevel.expected.mixed', 'Mixed：顶部选中开发示例，左侧展示多级子菜单。')}
            </Text>
            <Text>
              {t(
                'demo.multilevel.expected.columns',
                'Columns：左侧图标栏选中开发示例，二级面板展示多级菜单。',
              )}
            </Text>
          </Space>
        </Card>
      </Space>
    </TrueAdminPage>
  );
}
