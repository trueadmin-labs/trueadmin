import { DeleteOutlined, EyeOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { TrueAdminActionBar } from '@core/action';
import { TrueAdminPermissionButton } from '@core/auth';
import { TrueAdminResultState } from '@core/result';
import { TrueAdminDepartmentSelect, TrueAdminUserSelect } from '@modules/system';
import { App, Button, Card, Col, Form, Row, Space, Typography } from 'antd';
import { useState } from 'react';
import { TrueAdminDescriptionSection } from '@/core/description';
import { TrueAdminDictSelect, TrueAdminEnumTag } from '@/core/dict';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminImportExport } from '@/core/import-export';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';
import { TrueAdminAuditPanel } from '@/core/timeline';
import {
  TrueAdminAttachmentUpload,
  type TrueAdminAttachmentValue,
  TrueAdminUploadPreview,
} from '@/core/upload';

const initialFiles: TrueAdminAttachmentValue[] = [
  {
    id: 'preview-contract',
    name: '销售合同示例',
    url: '/mock/attachments/sales-contract.pdf',
    extension: 'pdf',
    size: 245760,
    mimeType: 'application/pdf',
  },
  {
    id: 'preview-image',
    name: '产品截图示例',
    url: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22960%22%20height%3D%22540%22%20viewBox%3D%220%200%20960%20540%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20x2%3D%221%22%20y1%3D%220%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%231677ff%22/%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2322a06b%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width%3D%22960%22%20height%3D%22540%22%20rx%3D%2224%22%20fill%3D%22url%28%23g%29%22/%3E%3Crect%20x%3D%2272%22%20y%3D%2280%22%20width%3D%22816%22%20height%3D%22380%22%20rx%3D%2218%22%20fill%3D%22white%22%20fill-opacity%3D%220.92%22/%3E%3Crect%20x%3D%22112%22%20y%3D%22124%22%20width%3D%22280%22%20height%3D%2228%22%20rx%3D%2214%22%20fill%3D%22%231677ff%22%20fill-opacity%3D%220.18%22/%3E%3Crect%20x%3D%22112%22%20y%3D%22186%22%20width%3D%22736%22%20height%3D%2222%22%20rx%3D%2211%22%20fill%3D%22%23000000%22%20fill-opacity%3D%220.12%22/%3E%3Crect%20x%3D%22112%22%20y%3D%22236%22%20width%3D%22580%22%20height%3D%2222%22%20rx%3D%2211%22%20fill%3D%22%23000000%22%20fill-opacity%3D%220.10%22/%3E%3Crect%20x%3D%22112%22%20y%3D%22296%22%20width%3D%22196%22%20height%3D%2288%22%20rx%3D%2216%22%20fill%3D%22%231677ff%22%20fill-opacity%3D%220.12%22/%3E%3Crect%20x%3D%22348%22%20y%3D%22296%22%20width%3D%22196%22%20height%3D%2288%22%20rx%3D%2216%22%20fill%3D%22%2322a06b%22%20fill-opacity%3D%220.14%22/%3E%3Crect%20x%3D%22584%22%20y%3D%22296%22%20width%3D%22196%22%20height%3D%2288%22%20rx%3D%2216%22%20fill%3D%22%23faad14%22%20fill-opacity%3D%220.18%22/%3E%3Ctext%20x%3D%22480%22%20y%3D%22422%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2228%22%20font-weight%3D%22700%22%20fill%3D%22%231d1d1f%22%3ETrueAdmin%20Preview%3C/text%3E%3C/svg%3E',
    extension: 'svg',
    size: 184320,
    mimeType: 'image/svg+xml',
  },
];

export default function ComponentsExamplePage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [status, setStatus] = useState('enabled');
  const [departmentId, setDepartmentId] = useState<number>();
  const [userId, setUserId] = useState<number>();
  const [files, setFiles] = useState<TrueAdminAttachmentValue[]>(initialFiles);
  const [previewFile, setPreviewFile] = useState<TrueAdminAttachmentValue>();
  const [previewOpen, setPreviewOpen] = useState(false);

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
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <TrueAdminAttachmentUpload
              multiple
              value={files}
              title={t('examples.components.upload.dragTitle', '拖拽附件到这里，或点击选择')}
              hint={t(
                'examples.components.upload.hint',
                '示例不会真实上传文件，适合表单附件场景。',
              )}
              onChangeValue={setFiles}
            />
            <Space size={8} wrap>
              {files.map((file) => (
                <Button
                  key={file.id}
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setPreviewFile(file);
                    setPreviewOpen(true);
                  }}
                >
                  {file.name}
                </Button>
              ))}
            </Space>
            <TrueAdminUploadPreview
              file={previewFile}
              open={previewOpen}
              onOpenChange={setPreviewOpen}
            />
          </Space>
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

        <TrueAdminAuditPanel
          title={t('examples.components.audit.title', '审计时间线')}
          description={t(
            'examples.components.audit.description',
            '展示审批、操作记录和当前流程状态。',
          )}
          status={{ label: t('examples.components.status.pending', '待确认'), color: 'processing' }}
          actions={
            <TrueAdminActionBar
              actions={[
                {
                  key: 'approve',
                  label: t('examples.components.audit.approve', '通过'),
                  type: 'primary',
                  onClick: () => message.success(t('examples.components.audit.approved', '已通过')),
                },
                {
                  key: 'reject',
                  label: t('examples.components.audit.reject', '驳回'),
                  danger: true,
                  onClick: () => message.warning(t('examples.components.audit.rejected', '已驳回')),
                },
              ]}
            />
          }
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

        <Card size="small" title={t('examples.components.actions.title', '页面操作')}>
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <TrueAdminActionBar
              max={3}
              moreText={t('examples.components.actions.more', '更多')}
              actions={[
                {
                  key: 'submit',
                  label: t('examples.components.actions.submit', '提交'),
                  type: 'primary',
                  icon: <SendOutlined />,
                  onClick: () => message.success(t('examples.components.actions.submit', '已提交')),
                },
                {
                  key: 'draft',
                  label: t('examples.components.actions.saveDraft', '保存草稿'),
                  icon: <SaveOutlined />,
                  onClick: () => message.info(t('examples.components.actions.saved', '已保存')),
                },
                {
                  key: 'view',
                  label: t('examples.components.actions.preview', '预览'),
                  icon: <EyeOutlined />,
                  onClick: () => message.info(t('examples.components.actions.previewed', '已预览')),
                },
                {
                  key: 'delete',
                  label: t('examples.components.actions.delete', '删除'),
                  danger: true,
                  icon: <DeleteOutlined />,
                  onClick: () =>
                    message.warning(t('examples.components.actions.deleted', '已删除')),
                },
              ]}
            />
            <Space size={8} wrap>
              <TrueAdminPermissionButton
                permission="system.user.create"
                type="primary"
                deniedMode="disable"
                deniedTooltip={t('examples.components.permission.denied', '没有操作权限')}
                confirm={t('examples.components.permission.confirm', '确认执行该操作？')}
                onClick={() =>
                  message.success(t('examples.components.permission.done', '权限按钮已执行'))
                }
              >
                {t('examples.components.permission.button', '权限按钮')}
              </TrueAdminPermissionButton>
              <TrueAdminPermissionButton
                permission="not.exists.permission"
                deniedMode="disable"
                deniedTooltip={t('examples.components.permission.denied', '没有操作权限')}
              >
                {t('examples.components.permission.disabledButton', '无权限禁用')}
              </TrueAdminPermissionButton>
            </Space>
          </Space>
        </Card>

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
                onReload={() => message.info(t('examples.components.result.reload', '已刷新'))}
              />
            </Col>
          </Row>
        </Card>
      </Space>
    </TrueAdminPage>
  );
}
