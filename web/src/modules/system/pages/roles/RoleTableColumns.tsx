import { Tag } from 'antd';
import type { CrudColumns } from '@/core/crud/types';
import type { TranslateFunction } from '@/core/i18n/trans';
import type { AdminRole } from '../../types/role';
import { isBuiltinRole } from './roleAuthorization';

type RoleTableColumnsOptions = {
  statusText: Record<AdminRole['status'], string>;
  t: TranslateFunction;
};

export function createRoleColumns({
  statusText,
  t,
}: RoleTableColumnsOptions): CrudColumns<AdminRole> {
  return [
    { title: 'ID', dataIndex: 'id', width: 88, sorter: true },
    { title: t('system.roles.column.name', '角色名称'), dataIndex: 'name', width: 220 },
    { title: t('system.roles.column.code', '角色编码'), dataIndex: 'code', width: 220 },
    { title: t('system.roles.column.sort', '排序'), dataIndex: 'sort', width: 90, sorter: true },
    {
      title: t('system.roles.column.status', '状态'),
      dataIndex: 'status',
      width: 110,
      render: (_, record) => (
        <Tag color={record.status === 'enabled' ? 'success' : 'default'}>
          {statusText[record.status]}
        </Tag>
      ),
    },
    {
      title: t('system.roles.column.type', '类型'),
      dataIndex: 'builtin',
      width: 120,
      render: (_, record) =>
        isBuiltinRole(record) ? (
          <Tag color="gold">{t('system.roles.type.builtin', '系统内置')}</Tag>
        ) : (
          <Tag>{t('system.roles.type.custom', '自定义')}</Tag>
        ),
    },
  ];
}
