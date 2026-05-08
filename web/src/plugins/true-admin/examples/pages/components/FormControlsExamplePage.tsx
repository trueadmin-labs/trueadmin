import { TrueAdminDepartmentSelect, TrueAdminUserSelect } from '@modules/system';
import { Card, Col, Form, Row, Space } from 'antd';
import { useState } from 'react';
import { TrueAdminDictSelect } from '@/core/dict';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';
import { createStatusOptions } from './shared';

export default function FormControlsExamplePage() {
  const { t } = useI18n();
  const [status, setStatus] = useState('enabled');
  const [departmentId, setDepartmentId] = useState<number>();
  const [userId, setUserId] = useState<number>();
  const statusOptions = createStatusOptions(t);

  return (
    <TrueAdminPage
      title={t('examples.formControls.title', '表单控件示例')}
      description={t('examples.formControls.description', '展示字典、部门、用户等常用录入控件。')}
      contentAlign="center"
      contentWidth={920}
    >
      <Space orientation="vertical" size={12} className="trueadmin-example-stack">
        <Card size="small" title={t('examples.components.selector.title', '选择输入')}>
          <Form layout="vertical" colon={false} style={{ maxWidth: 720, marginInline: 'auto' }}>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item label={t('examples.components.dictSelect', '字典选择')}>
                  <TrueAdminDictSelect
                    allowClear
                    value={status}
                    options={statusOptions}
                    placeholder={t('examples.components.dictSelect.placeholder', '请选择状态')}
                    onChange={(value) => setStatus(String(value ?? ''))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={t('examples.components.departmentSelect', '部门选择')}>
                  <TrueAdminDepartmentSelect
                    allowClear
                    value={departmentId}
                    placeholder={t(
                      'examples.components.departmentSelect.placeholder',
                      '请选择部门',
                    )}
                    style={{ width: '100%' }}
                    onChange={(value) => setDepartmentId(value as number | undefined)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={t('examples.components.userSelect', '用户选择')}>
                  <TrueAdminUserSelect<number>
                    allowClear
                    value={userId}
                    placeholder={t('examples.components.userSelect.placeholder', '请选择用户')}
                    style={{ width: '100%' }}
                    onChange={(value) => setUserId(value)}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      </Space>
    </TrueAdminPage>
  );
}
