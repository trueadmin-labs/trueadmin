import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Space, Tag, Typography } from 'antd';
import type { CrudColumns } from '@/core/crud/types';
import type { AdminUser } from '../../types/admin-user';

type UserColumnsOptions = {
  statusText: Record<AdminUser['status'], string>;
  t: TranslateFunction;
};

export function createUserColumns({ statusText, t }: UserColumnsOptions): CrudColumns<AdminUser> {
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
      width: 300,
      render: (_, record) =>
        record.roleNames.length > 0 ? (
          record.roleNames.map((role) => <Tag key={role}>{role}</Tag>)
        ) : (
          <Typography.Text type="secondary">
            {t('system.users.column.roles.empty', '无')}
          </Typography.Text>
        ),
    },
    {
      title: t('system.users.column.positions', '岗位'),
      dataIndex: 'positions',
      width: 360,
      render: (_, record) =>
        record.positions.length > 0 ? (
          <Space wrap size={[4, 4]}>
            {record.positions.map((position) => (
              <Tag key={position.id}>
                {position.deptName} / {position.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <Typography.Text type="secondary">
            {t('system.users.column.positions.empty', '未绑定岗位')}
          </Typography.Text>
        ),
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
