import { TrueAdminDepartmentSelect, TrueAdminUserSelect } from '@modules/system';
import { App, Button, Card, Col, Form, Row, Space, Typography } from 'antd';
import { useState } from 'react';
import { TrueAdminDescriptionSection } from '@/core/description';
import { TrueAdminDictSelect, TrueAdminEnumTag } from '@/core/dict';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminImportExport } from '@/core/import-export';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';
import { TrueAdminAuditTimeline } from '@/core/timeline';
import { TrueAdminAttachmentUpload, type TrueAdminAttachmentValue } from '@/core/upload';

export default function ComponentsExamplePage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [status, setStatus] = useState('enabled');
  const [departmentId, setDepartmentId] = useState<number>();
  const [userId, setUserId] = useState<number>();
  const [files, setFiles] = useState<TrueAdminAttachmentValue[]>([]);

  const statusOptions = [
    {
      label: t('examples.components.status.enabled', '已启用'),
      value: 'enabled',
      color: 'success',
    },
    {
      label: t('examples.components.status.disabled', '已禁用'),
      value: 'disabled',
      color: 'default',
    },
    {
      label: t('examples.components.status.pending', '待确认'),
      value: 'pending',
      color: 'processing',
    },
  ];

  return (
    <TrueAdminPage
      title={t('examples.components.title', '通用组件示例')}
      description={t('examples.components.description', '展示常用业务组件的标准用法和组合方式。')}
    >
      <Space orientation="vertical" size={12} className="trueadmin-example-stack">
        <Card size="small" title={t('examples.components.selector.title', '选择输入')}>
          <Form layout="vertical" colon={false} style={{ maxWidth: 720 }}>
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

        <Card size="small" title={t('examples.components.upload.title', '附件上传')}>
          <TrueAdminAttachmentUpload
            multiple
            value={files}
            title={t('examples.components.upload.dragTitle', '拖拽附件到这里，或点击选择')}
            hint={t('examples.components.upload.hint', '示例不会真实上传文件，适合表单附件场景。')}
            onChangeValue={setFiles}
          />
        </Card>

        <Card size="small" title={t('examples.components.importExport.title', '导入导出')}>
          <TrueAdminImportExport
            importConfig={{
              onClick: () =>
                message.info(t('examples.components.importExport.import', '已触发导入')),
            }}
            exportConfig={{
              selectedDisabled: true,
              onExport: (type) =>
                message.info(
                  t('examples.components.importExport.export', '已触发导出：{{type}}').replace(
                    '{{type}}',
                    type,
                  ),
                ),
            }}
          />
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
              children: userId ? `User #${userId}` : '-',
            },
          ]}
        />

        <Card size="small" title={t('examples.components.audit.title', '审计时间线')}>
          <TrueAdminAuditTimeline
            items={[
              {
                color: 'green',
                title: t('examples.components.audit.created', '创建记录'),
                description: t('examples.components.audit.createdDesc', '系统创建了业务单据。'),
                operator: t('examples.components.audit.operator.admin', '系统管理员'),
                time: '2026-05-08 09:30',
              },
              {
                color: 'blue',
                title: t('examples.components.audit.updated', '更新状态'),
                description: t('examples.components.audit.updatedDesc', '状态变更为待确认。'),
                operator: t('examples.components.audit.operator.ops', '运营管理员'),
                time: '2026-05-08 10:15',
              },
            ]}
          />
        </Card>

        <Card size="small" title={t('examples.components.actions.title', '页面操作')}>
          <Button
            type="primary"
            onClick={() => message.success(t('examples.components.actions.submit', '已提交'))}
          >
            {t('examples.components.actions.submit', '提交')}
          </Button>
        </Card>
      </Space>
    </TrueAdminPage>
  );
}
