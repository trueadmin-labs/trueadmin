import { Checkbox, Col, Form, Input, Row, Select } from 'antd';
import type { AdminMenuOpenMode } from '../../types/menu';
import { FORM_GUTTER } from './menuFormModel';

type MenuFormLinkFieldsProps = {
  openModeText: Record<AdminMenuOpenMode, string>;
  t: (key: string, fallback?: string) => string;
};

export function MenuFormLinkFields({ openModeText, t }: MenuFormLinkFieldsProps) {
  return (
    <Row gutter={FORM_GUTTER}>
      <Col xs={24} md={16}>
        <Form.Item
          label={t('system.menus.form.url', '链接地址')}
          name="url"
          rules={[
            {
              required: true,
              message: t('system.menus.form.urlRequired', '请输入链接地址'),
            },
            {
              type: 'url',
              message: t('system.menus.form.urlInvalid', '请输入有效链接地址'),
            },
          ]}
        >
          <Input maxLength={1024} placeholder="https://example.com" />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item
          label={t('system.menus.form.openMode', '打开方式')}
          name="openMode"
          rules={[
            {
              required: true,
              message: t('system.menus.form.openModeRequired', '请选择打开方式'),
            },
          ]}
        >
          <Select
            options={[
              { label: openModeText.blank, value: 'blank' },
              { label: openModeText.self, value: 'self' },
              { label: openModeText.iframe, value: 'iframe' },
            ]}
          />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item name="showLinkHeader" valuePropName="checked">
          <Checkbox>{t('system.menus.form.showLinkHeader', '显示顶部链接栏')}</Checkbox>
        </Form.Item>
      </Col>
    </Row>
  );
}
