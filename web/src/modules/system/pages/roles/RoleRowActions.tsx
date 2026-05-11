import { SafetyCertificateOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import { TrueAdminConfirmAction } from '@/core/action';
import type { CrudTableAction } from '@/core/crud/types';
import type { TranslateFunction } from '@/core/i18n/trans';
import type { AdminRole, AdminRolePayload } from '../../types/role';
import { isBuiltinRole } from './roleAuthorization';

type RoleRowActionsProps = {
  action: CrudTableAction<AdminRole, AdminRolePayload, AdminRolePayload>;
  record: AdminRole;
  t: TranslateFunction;
  onAuthorize: (record: AdminRole) => void;
  onEdit: (record: AdminRole) => void;
};

export function RoleRowActions({ action, record, t, onAuthorize, onEdit }: RoleRowActionsProps) {
  const builtin = isBuiltinRole(record);

  return (
    <Space size={4} wrap>
      <Button disabled={builtin} size="small" type="link" onClick={() => onEdit(record)}>
        {t('crud.action.edit', '编辑')}
      </Button>
      <Button
        disabled={builtin}
        size="small"
        type="link"
        icon={<SafetyCertificateOutlined />}
        onClick={() => onAuthorize(record)}
      >
        {t('system.roles.action.authorize', '授权')}
      </Button>
      <TrueAdminConfirmAction
        danger
        disabled={builtin}
        size="small"
        type="link"
        action={async () => {
          await action.delete?.(record.id);
        }}
        confirm={t('system.roles.deleteConfirm', '确认删除该角色吗？')}
        successMessage={t('system.roles.deleteSuccess', '角色已删除')}
      >
        {t('crud.action.delete', '删除')}
      </TrueAdminConfirmAction>
    </Space>
  );
}
