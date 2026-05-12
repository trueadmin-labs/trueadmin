import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Space, Tag, Typography } from 'antd';
import type { CrudColumns } from '@/core/crud/types';
import { TrueAdminIcon } from '@/core/icon/TrueAdminIcon';
import type {
  AdminMenu,
  AdminMenuOpenMode,
  AdminMenuSource,
  AdminMenuType,
} from '../../types/menu';
import { menuTypeColor } from './menuPageModel';

type MenuTableColumnsOptions = {
  openModeText: Record<AdminMenuOpenMode, string>;
  sourceText: Record<AdminMenuSource, string>;
  statusText: Record<AdminMenu['status'], string>;
  t: TranslateFunction;
  typeText: Record<AdminMenuType, string>;
};

export function createMenuColumns({
  openModeText,
  sourceText,
  statusText,
  t,
  typeText,
}: MenuTableColumnsOptions): CrudColumns<AdminMenu> {
  return [
    { title: 'ID', dataIndex: 'id', width: 88, sorter: true },
    {
      title: t('system.menus.column.name', '菜单名称'),
      dataIndex: 'name',
      width: 240,
      render: (_, record) => (
        <Space size={8}>
          <span className="trueadmin-system-menu-icon">
            <TrueAdminIcon icon={record.icon || record.code} />
          </span>
          <span>{record.name}</span>
        </Space>
      ),
    },
    {
      title: t('system.menus.column.type', '类型'),
      dataIndex: 'type',
      width: 100,
      render: (_, record) => <Tag color={menuTypeColor[record.type]}>{typeText[record.type]}</Tag>,
    },
    {
      title: t('system.menus.column.source', '来源'),
      dataIndex: 'source',
      width: 110,
      render: (_, record) => (
        <Tag color={record.source === 'code' ? 'blue' : 'green'}>{sourceText[record.source]}</Tag>
      ),
    },
    { title: t('system.menus.column.code', '编码'), dataIndex: 'code', width: 220 },
    { title: t('system.menus.column.path', '路径'), dataIndex: 'path', width: 220 },
    {
      title: t('system.menus.column.link', '链接'),
      dataIndex: 'url',
      width: 260,
      render: (_, record) =>
        record.type === 'link' ? (
          <Space orientation="vertical" size={2}>
            <Typography.Link
              href={record.url}
              target="_blank"
              rel="noreferrer"
              ellipsis
              style={{ maxWidth: 230 }}
            >
              {record.url}
            </Typography.Link>
            <Tag>{record.openMode ? openModeText[record.openMode] : '-'}</Tag>
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: t('system.menus.column.permission', '权限标识'),
      dataIndex: 'permission',
      width: 220,
    },
    { title: t('system.menus.column.sort', '排序'), dataIndex: 'sort', width: 90, sorter: true },
    {
      title: t('system.menus.column.status', '状态'),
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
