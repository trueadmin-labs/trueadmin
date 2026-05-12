import { Tag } from 'antd';
import type { CrudColumns } from '@/core/crud/types';
import type { TranslateFunction } from '@/core/i18n/trans';
import type { DepartmentTreeNode } from '../../types/department';

type DepartmentColumnsOptions = {
  statusText: Record<DepartmentTreeNode['status'], string>;
  t: TranslateFunction;
};

export function createDepartmentColumns({
  statusText,
  t,
}: DepartmentColumnsOptions): CrudColumns<DepartmentTreeNode> {
  return [
    { title: 'ID', dataIndex: 'id', width: 88, sorter: true },
    { title: t('system.departments.column.name', '部门名称'), dataIndex: 'name', width: 220 },
    { title: t('system.departments.column.code', '部门编码'), dataIndex: 'code', width: 220 },
    { title: t('system.departments.column.level', '层级'), dataIndex: 'level', width: 90 },
    {
      title: t('system.departments.column.sort', '排序'),
      dataIndex: 'sort',
      width: 90,
      sorter: true,
    },
    {
      title: t('system.departments.column.status', '状态'),
      dataIndex: 'status',
      width: 110,
      render: (_, record) => (
        <Tag color={record.status === 'enabled' ? 'success' : 'default'}>
          {statusText[record.status]}
        </Tag>
      ),
    },
  ];
}
