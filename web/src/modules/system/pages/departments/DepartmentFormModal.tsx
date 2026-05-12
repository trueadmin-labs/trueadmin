import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { FormInstance, TreeSelectProps } from 'antd';
import { Form, Input, InputNumber, Select, Space, TreeSelect } from 'antd';
import { TrueAdminLoadingContainer } from '@/core/loading';
import { TrueAdminModal } from '@/core/modal';
import type { DepartmentTreeNode } from '../../types/department';
import { type DepartmentFormValues, ROOT_PARENT_ID } from './departmentPageModel';

type DepartmentFormModalProps = {
  editing?: DepartmentTreeNode;
  form: FormInstance<DepartmentFormValues>;
  loading?: boolean;
  open: boolean;
  parentTreeData: TreeSelectProps['treeData'];
  statusText: Record<DepartmentTreeNode['status'], string>;
  submitting: boolean;
  t: TranslateFunction;
  onCancel: () => void;
  onSubmit: () => void;
};

export function DepartmentFormModal({
  editing,
  form,
  loading = false,
  open,
  parentTreeData,
  statusText,
  submitting,
  t,
  onCancel,
  onSubmit,
}: DepartmentFormModalProps) {
  return (
    <TrueAdminModal
      destroyOnHidden
      confirmLoading={submitting}
      okButtonProps={{ disabled: loading }}
      open={open}
      title={
        editing
          ? t('system.departments.modal.edit', '编辑部门')
          : t('system.departments.modal.create', '新增部门')
      }
      width={560}
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <TrueAdminLoadingContainer loading={loading} initialLoadingHeight={280}>
        <Form<DepartmentFormValues>
          form={form}
          layout="vertical"
          initialValues={{ parentId: ROOT_PARENT_ID, sort: 0, status: 'enabled' }}
        >
          <Form.Item label={t('system.departments.form.parentId', '上级部门')} name="parentId">
            <TreeSelect
              treeData={parentTreeData}
              treeDefaultExpandAll
              showSearch
              treeNodeFilterProp="title"
            />
          </Form.Item>
          <Form.Item
            label={t('system.departments.form.name', '部门名称')}
            name="name"
            rules={[
              {
                required: true,
                message: t('system.departments.form.nameRequired', '请输入部门名称'),
              },
            ]}
          >
            <Input maxLength={64} />
          </Form.Item>
          <Form.Item
            label={t('system.departments.form.code', '部门编码')}
            name="code"
            rules={[
              {
                required: true,
                message: t('system.departments.form.codeRequired', '请输入部门编码'),
              },
            ]}
          >
            <Input maxLength={64} />
          </Form.Item>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item label={t('system.departments.form.sort', '排序')} name="sort">
              <InputNumber style={{ width: 160 }} />
            </Form.Item>
            <Form.Item label={t('system.departments.form.status', '状态')} name="status">
              <Select
                style={{ width: 180 }}
                options={[
                  { label: statusText.enabled, value: 'enabled' },
                  { label: statusText.disabled, value: 'disabled' },
                ]}
              />
            </Form.Item>
          </Space>
        </Form>
      </TrueAdminLoadingContainer>
    </TrueAdminModal>
  );
}
