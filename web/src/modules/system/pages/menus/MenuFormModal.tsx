import type { FormInstance, TreeSelectProps } from 'antd';
import {
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Segmented,
  Select,
  Space,
  TreeSelect,
} from 'antd';
import { useMemo } from 'react';
import { isImageIconValue } from '@/core/icon/TrueAdminIcon';
import { TrueAdminIconPicker } from '@/core/icon/TrueAdminIconPicker';
import { TrueAdminModal } from '@/core/modal';
import { TrueAdminImageUpload } from '@/core/upload';
import { systemUploadApi } from '../../services/upload.api';
import type {
  AdminMenu,
  AdminMenuOpenMode,
  AdminMenuPayload,
  AdminMenuStatus,
  AdminMenuType,
} from '../../types/menu';

export type MenuFormValues = AdminMenuPayload;

export type MenuIconMode = 'name' | 'image';

export const ROOT_PARENT_ID = 0;

const FORM_GUTTER: [number, number] = [16, 0];

export const getMenuIconMode = (icon?: string): MenuIconMode =>
  isImageIconValue(icon) ? 'image' : 'name';

function MenuIconImageInput({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value?: string) => void;
}) {
  const imageValue = value
    ? {
        id: value,
        name: 'menu-icon',
        url: value,
      }
    : null;

  return (
    <TrueAdminImageUpload
      value={imageValue}
      onChange={(nextValue) => {
        const image = Array.isArray(nextValue) ? nextValue[0] : nextValue;
        onChange?.(image?.url ?? '');
      }}
      upload={systemUploadApi.image}
      previewSize={64}
    />
  );
}

const toTreeSelectData = (
  menus: AdminMenu[],
  disabledId?: number,
  ancestorDisabled = false,
): TreeSelectProps['treeData'] =>
  menus.map((menu) => {
    const disabled = ancestorDisabled || menu.id === disabledId;
    return {
      title: menu.name,
      value: menu.id,
      key: menu.id,
      disabled,
      children: menu.children ? toTreeSelectData(menu.children, disabledId, disabled) : undefined,
    };
  });

type MenuFormModalProps = {
  editing?: AdminMenu;
  form: FormInstance<MenuFormValues>;
  iconMode: MenuIconMode;
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
        {watchedType === 'link' ? (
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
                    required: watchedType === 'link',
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
        ) : null}
        <Row gutter={FORM_GUTTER}>
          <Col xs={24} md={12}>
            <Form.Item label={t('system.menus.form.icon', '图标')}>
              <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                <Segmented<MenuIconMode>
                  block
                  value={iconMode}
                  options={[
                    {
                      label: t('system.menus.form.iconMode.name', '图标名称'),
                      value: 'name',
                    },
                    {
                      label: t('system.menus.form.iconMode.image', '图片图标'),
                      value: 'image',
                    },
                  ]}
                  onChange={onChangeIconMode}
                />
                {iconMode === 'name' ? (
                  <Form.Item name="icon" noStyle>
                    <TrueAdminIconPicker placeholder="SettingOutlined" />
                  </Form.Item>
                ) : (
                  <Form.Item name="icon" noStyle>
                    <MenuIconImageInput />
                  </Form.Item>
                )}
              </Space>
            </Form.Item>
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
    </TrueAdminModal>
  );
}
