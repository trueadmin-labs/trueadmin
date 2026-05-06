import type { ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import { TrueAdminCrudPage } from '@/core/crud/TrueAdminCrudPage';
import { adminUserApi } from '../../services/admin-user.api';
import type {
  AdminUser,
  AdminUserCreatePayload,
  AdminUserUpdatePayload,
} from '../../types/admin-user';

const columns: ProColumns<AdminUser>[] = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 72,
    search: false,
    sorter: true,
  },
  {
    title: '用户名',
    dataIndex: 'username',
    copyable: true,
  },
  {
    title: '昵称',
    dataIndex: 'nickname',
  },
  {
    title: '状态',
    dataIndex: 'status',
    valueType: 'select',
    valueEnum: {
      enabled: { text: '启用', status: 'Success' },
      disabled: { text: '禁用', status: 'Default' },
    },
    render: (_, record) => (
      <Tag color={record.status === 'enabled' ? 'green' : 'default'}>
        {record.status === 'enabled' ? '启用' : '禁用'}
      </Tag>
    ),
  },
  {
    title: '角色',
    dataIndex: 'roles',
    search: false,
    render: (_, record) => record.roles.map((role) => <Tag key={role}>{role}</Tag>),
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    valueType: 'dateTime',
    search: false,
    sorter: true,
  },
];

export default function AdminUsersPage() {
  return (
    <TrueAdminCrudPage<AdminUser, AdminUserCreatePayload, AdminUserUpdatePayload>
      title="管理员用户"
      resource="system.user"
      columns={columns}
      service={adminUserApi}
    />
  );
}
