import { Button, Popconfirm, Space } from 'antd';
import type { CrudTableAction } from '@/core/crud/types';
import type { TranslateFunction } from '@/core/i18n/trans';
import type { AdminMenu, AdminMenuPayload } from '../../types/menu';

type MenuRowActionsProps = {
  action: CrudTableAction<AdminMenu, AdminMenuPayload, AdminMenuPayload>;
  record: AdminMenu;
  t: TranslateFunction;
  onDeleteSuccess: () => Promise<void>;
  onEdit: (record: AdminMenu) => void;
};

export function MenuRowActions({
  action,
  record,
  t,
  onDeleteSuccess,
  onEdit,
}: MenuRowActionsProps) {
  return (
    <Space size={0}>
      <Button size="small" type="link" onClick={() => onEdit(record)}>
        {t('crud.action.edit', '编辑')}
      </Button>
      {record.source === 'custom' ? (
        <Popconfirm
          title={t('system.menus.deleteConfirm', '确认删除该资源吗？')}
          onConfirm={async () => {
            await action.delete?.(record.id);
            await onDeleteSuccess();
          }}
        >
          <Button danger size="small" type="link">
            {t('crud.action.delete', '删除')}
          </Button>
        </Popconfirm>
      ) : null}
    </Space>
  );
}
