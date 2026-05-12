import { TrueAdminResultState } from '@core/result';
import { Card, Col, Row, Space, Typography } from 'antd';
import { useState } from 'react';
import { TrueAdminDescriptionSection } from '@/core/description';
import { TrueAdminEnumTag } from '@/core/dict';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';
import { createStatusOptions } from './shared';

export default function DisplayExamplePage() {
  const { t } = useI18n();
  const [status] = useState('enabled');
  const statusOptions = createStatusOptions(t);

  return (
    <TrueAdminPage
      title={t('examples.display.title', '数据展示示例')}
      description={t('examples.display.description', '展示状态、详情分区和结果态等展示组件。')}
      contentAlign="center"
      contentWidth={920}
    >
      <Space orientation="vertical" size={12} className="trueadmin-example-stack">
        <Card size="small" title={t('examples.components.display.title', '状态展示')}>
          <Space size={16} wrap>
            <Space size={8}>
              <Typography.Text type="secondary">
                {t('examples.components.enumTag.single', '单值')}
              </Typography.Text>
              <TrueAdminEnumTag value={status} options={statusOptions} />
            </Space>
            <Space size={8}>
              <Typography.Text type="secondary">
                {t('examples.components.enumTag.multiple', '多值')}
              </Typography.Text>
              <TrueAdminEnumTag value={['enabled', 'pending']} options={statusOptions} />
            </Space>
          </Space>
        </Card>

        <TrueAdminDescriptionSection
          surface
          title={t('examples.components.descriptionSection.title', '详情分区')}
          description={t(
            'examples.components.descriptionSection.description',
            '统一标题、描述和 Descriptions 布局。',
          )}
          items={[
            {
              label: t('examples.components.descriptionSection.code', '编号'),
              children: 'ORD-2026-0001',
            },
            {
              label: t('examples.components.descriptionSection.customer', '客户'),
              children: 'TrueAdmin Demo',
            },
            {
              label: t('examples.components.descriptionSection.status', '状态'),
              children: <TrueAdminEnumTag value={status} options={statusOptions} />,
            },
            {
              label: t('examples.components.descriptionSection.owner', '负责人'),
              children: 'User #1001',
            },
          ]}
        />

        <Card size="small" title={t('examples.components.result.title', '结果态')}>
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <TrueAdminResultState
                compact
                status="empty"
                subTitle={t('examples.components.result.empty', '暂无数据')}
              />
            </Col>
            <Col xs={24} md={8}>
              <TrueAdminResultState
                compact
                status="403"
                title="403"
                subTitle={t('examples.components.result.forbidden', '当前账号无权访问')}
              />
            </Col>
            <Col xs={24} md={8}>
              <TrueAdminResultState
                compact
                status="error"
                title={t('examples.components.result.error', '加载失败')}
                subTitle={t(
                  'examples.components.result.errorDesc',
                  '可以保留页面结构并提供重试入口',
                )}
              />
            </Col>
          </Row>
        </Card>
      </Space>
    </TrueAdminPage>
  );
}
