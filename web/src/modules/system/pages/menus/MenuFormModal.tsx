import type { FormInstance, TreeSelectProps } from 'antd';
import { Col, Form, Input, InputNumber, Row, Select, TreeSelect } from 'antd';
import { useMemo } from 'react';
import { TrueAdminLoadingContainer } from '@/core/loading';
import { TrueAdminModal } from '@/core/modal';
import type {
  AdminMenu,
  AdminMenuOpenMode,
  AdminMenuPayload,
  AdminMenuStatus,
  AdminMenuType,
} from '../../types/menu';
import { MenuFormIconField } from './MenuFormIconField';
import { MenuFormLinkFields } from './MenuFormLinkFields';
import { FORM_GUTTER, type MenuIconMode, ROOT_PARENT_ID, toTreeSelectData } from './menuFormModel';

export type MenuFormValues = AdminMenuPayload;
export { getMenuIconMode, type MenuIconMode, ROOT_PARENT_ID } from './menuFormModel';

type MenuFormModalProps = {
  editing?: AdminMenu;
  form: FormInstance<MenuFormValues>;
  iconMode: MenuIconMode;
  loading?: boolean;
  menuTree: AdminMenu[];
  open: boolean;
  openModeText: Record<AdminMenuOpenMode, string>;
  statusText: Record<AdminMenuStatus, string>;
  submitting: boolean;
  t: (key: string, fallback?: string) => string;
  typeText: Record<AdminMenuType, string>;
  onCancel: () => void;
  onChangeIconMode: (mode: MenuIconMode) => void;
  onOk: () => void;
};

export function MenuFormModal({
  editing,
  form,
  iconMode,
  loading = false,
  menuTree,
  open,
  openModeText,
  statusText,
  submitting,
  t,
  typeText,
  onCancel,
  onChangeIconMode,
  onOk,
}: MenuFormModalProps) {
  const watchedType = Form.useWatch('type', form);
  const isEditingCodeMenu = editing?.source === 'code';
  const parentTreeData = useMemo<TreeSelectProps['treeData']>(
    () => [
      {
        title: t('system.common.rootNode', '根节点'),
        value: ROOT_PARENT_ID,
        key: ROOT_PARENT_ID,
        children: toTreeSelectData(menuTree, editing?.id),
      },
    ],
    [editing?.id, menuTree, t],
  );

  return (
    <TrueAdminModal
      destroyOnHidden
      confirmLoading={submitting}
      okButtonProps={{ disabled: loading }}
      open={open}
      title={
        editing
          ? t('system.menus.modal.edit', '编辑资源')
          : t('system.menus.modal.create', '新增资源')
      }
      width={820}
      onCancel={onCancel}
      onOk={onOk}
    >
      <TrueAdminLoadingContainer loading={loading} initialLoadingHeight={420}>
        <Form<MenuFormValues>
          form={form}
          layout="vertical"
          initialValues={{
            parentId: ROOT_PARENT_ID,
            sort: 0,
            status: 'enabled',
            type: 'directory',
          }}
        >
          <Row gutter={FORM_GUTTER}>
            <Col xs={24} md={16}>
              <Form.Item label={t('system.menus.form.parentId', '上级菜单')} name="parentId">
                <TreeSelect
                  treeData={parentTreeData}
                  treeDefaultExpandAll
                  showSearch
                  treeNodeFilterProp="title"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('system.menus.form.type', '类型')} name="type">
                <Select
                  disabled={Boolean(editing)}
                  options={
                    editing
                      ? [{ label: typeText[editing.type], value: editing.type }]
                      : [
                          { label: typeText.directory, value: 'directory' },
                          { label: typeText.link, value: 'link' },
                        ]
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={FORM_GUTTER}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('system.menus.form.name', '菜单名称')}
                name="name"
                rules={[
                  {
                    required: true,
                    message: t('system.menus.form.nameRequired', '请输入菜单名称'),
                  },
                ]}
              >
                <Input maxLength={64} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('system.menus.form.code', '编码')} name="code">
                <Input
                  disabled={isEditingCodeMenu}
                  maxLength={128}
                  placeholder={t('system.menus.form.code.placeholder', '留空自动生成')}
                />
              </Form.Item>
            </Col>
          </Row>
          {isEditingCodeMenu ? (
            <Form.Item label={t('system.menus.form.path', '路由路径')} name="path">
              <Input disabled maxLength={255} />
            </Form.Item>
          ) : null}
          {watchedType === 'link' ? <MenuFormLinkFields openModeText={openModeText} t={t} /> : null}
          <Row gutter={FORM_GUTTER}>
            <Col xs={24} md={12}>
              <MenuFormIconField iconMode={iconMode} t={t} onChangeIconMode={onChangeIconMode} />
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('system.menus.form.permission', '权限标识')} name="permission">
                <Input
                  disabled={isEditingCodeMenu}
                  maxLength={128}
                  placeholder={
                    watchedType === 'link'
                      ? t('system.menus.form.permission.placeholder', '留空自动生成')
                      : 'system:menu:list'
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={FORM_GUTTER}>
            <Col xs={24} md={8}>
              <Form.Item label={t('system.menus.form.sort', '排序')} name="sort">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('system.menus.form.status', '状态')} name="status">
                <Select
                  options={[
                    { label: statusText.enabled, value: 'enabled' },
                    { label: statusText.disabled, value: 'disabled' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </TrueAdminLoadingContainer>
    </TrueAdminModal>
  );
}
