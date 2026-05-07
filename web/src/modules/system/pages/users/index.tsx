import { Tag } from 'antd';
import { TrueAdminCrudPage } from '@/core/crud/TrueAdminCrudPage';
import type { CrudColumns, CrudFilterSchema } from '@/core/crud/types';
import { adminUserApi } from '../../services/admin-user.api';
import type {
  AdminUser,
  AdminUserCreatePayload,
  AdminUserUpdatePayload,
} from '../../types/admin-user';

const filters: CrudFilterSchema[] = [
  {
    name: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '启用', value: 'enabled' },
      { label: '禁用', value: 'disabled' },
    ],
  },
  {
    name: 'roles',
    label: '角色',
    type: 'select',
    mode: 'multiple',
    options: [
      { label: '超级管理员', value: 'super_admin' },
      { label: '运营管理员', value: 'operator' },
      { label: '审计员', value: 'auditor' },
    ],
  },
  {
    name: 'createdAt',
    label: '创建时间',
    type: 'dateRange',
  },
];

const columns: CrudColumns<AdminUser> = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 72,
    sorter: true,
  },
  {
    title: '用户名',
    dataIndex: 'username',
  },
  {
    title: '昵称',
    dataIndex: 'nickname',
  },
  {
    title: '状态',
    dataIndex: 'status',
    render: (_, record) => (
      <Tag color={record.status === 'enabled' ? 'green' : 'default'}>
        {record.status === 'enabled' ? '启用' : '禁用'}
      </Tag>
    ),
  },
  {
    title: '角色',
    dataIndex: 'roles',
    render: (_, record) => record.roles.map((role) => <Tag key={role}>{role}</Tag>),
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
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
      quickSearch={{ placeholder: '搜索用户名 / 昵称' }}
      filters={filters}
    />
  );
}
