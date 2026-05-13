import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Space, Tag, Typography } from 'antd';
import type { CrudColumns } from '@/core/crud/types';
import type { AdminPosition } from '../../types/position';

type PositionColumnsOptions = {
  showDepartment?: boolean;
  showId?: boolean;
  statusText: Record<AdminPosition['status'], string>;
  sortable?: boolean;
  t: TranslateFunction;
};

export function createPositionColumns({
  showDepartment = true,
  showId = true,
  statusText,
  sortable = true,
  t,
}: PositionColumnsOptions): CrudColumns<AdminPosition> {
  const columns: CrudColumns<AdminPosition> = [
    {
      title: t('system.positions.column.name', '岗位名称'),
      dataIndex: 'name',
      width: 220,
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text type="secondary">{record.code}</Typography.Text>
        </Space>
      ),
    },
    {
      title: t('system.positions.column.roles', '绑定角色'),
      dataIndex: 'roleNames',
      width: 300,
      render: (_, record) =>
        record.roleNames.length > 0 ? (
          record.roleNames.map((name) => <Tag key={name}>{name}</Tag>)
        ) : (
          <Typography.Text type="secondary">
            {t('system.positions.column.roles.empty', '未绑定')}
          </Typography.Text>
        ),
    },
    {
      title: t('system.positions.column.memberCount', '成员数'),
      dataIndex: 'memberCount',
      width: 100,
    },
    {
      title: t('system.positions.column.status', '状态'),
      dataIndex: 'status',
      width: 110,
      render: (_, record) => (
        <Tag color={record.status === 'enabled' ? 'success' : 'default'}>
          {statusText[record.status]}
        </Tag>
      ),
    },
    {
      title: t('system.positions.column.sort', '排序'),
      dataIndex: 'sort',
      width: 90,
      sorter: sortable,
    },
  ];

  if (showDepartment) {
    columns.splice(1, 0, {
      title: t('system.positions.column.department', '所属部门'),
      dataIndex: 'deptPath',
      width: 260,
      render: (_, record) => record.deptPath || record.deptName,
    });
  }

  if (showId) {
    columns.unshift({ title: 'ID', dataIndex: 'id', width: 80, sorter: sortable });
  }

  return columns;
}
