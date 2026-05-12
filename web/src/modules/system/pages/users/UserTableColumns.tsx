import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Tag } from 'antd';
import type { CrudColumns } from '@/core/crud/types';
import type { AdminUser } from '../../types/admin-user';

const roleColorMap: Record<string, string> = {
  auditor: 'default',
  operator: 'processing',
  'super-admin': 'gold',
  super_admin: 'gold',
};

type UserColumnsOptions = {
  roleText: Record<string, string>;
  statusText: Record<AdminUser['status'], string>;
  t: TranslateFunction;
};

export function createUserColumns({
  roleText,
  statusText,
  t,
}: UserColumnsOptions): CrudColumns<AdminUser> {
  return [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 72,
      sorter: true,
    },
    {
      title: t('system.users.column.username', '用户名'),
      dataIndex: 'username',
      width: 180,
    },
    {
      title: t('system.users.column.nickname', '昵称'),
      dataIndex: 'nickname',
      width: 180,
    },
    {
      title: t('system.users.column.status', '状态'),
      dataIndex: 'status',
      width: 110,
      render: (_, record) => (
        <Tag color={record.status === 'enabled' ? 'success' : 'default'}>
          {statusText[record.status]}
        </Tag>
      ),
    },
    {
      title: t('system.users.column.roles', '角色'),
      dataIndex: 'roles',
      width: 260,
      render: (_, record) =>
        record.roles.map((role) => (
          <Tag color={roleColorMap[role] ?? 'default'} key={role}>
            {roleText[role] ?? role}
          </Tag>
        )),
    },
    {
      title: t('system.users.column.createdAt', '创建时间'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      sorter: true,
    },
  ];
}
