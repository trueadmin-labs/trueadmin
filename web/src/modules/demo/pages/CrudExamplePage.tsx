import { DeleteOutlined, ExportOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { type ActionType, type ProColumns, ProTable } from '@ant-design/pro-components';
import { App, Button, Space, Tag } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { useWorkspaceViewport } from '@/core/layout/WorkspaceViewport';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';

type CrudExampleRecord = {
  id: string;
  name: string;
  owner: string;
  status: 'enabled' | 'disabled' | 'pending';
  category: 'system' | 'business' | 'finance';
  visits: number;
  createdAt: string;
  updatedAt: string;
};

type CrudExampleQuery = {
  current?: number;
  pageSize?: number;
  name?: string;
  owner?: string;
  status?: CrudExampleRecord['status'];
  category?: CrudExampleRecord['category'];
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const statusColor: Record<CrudExampleRecord['status'], string> = {
  disabled: 'default',
  enabled: 'success',
  pending: 'processing',
};

const createRecords = (t: (key?: string, fallback?: string) => string): CrudExampleRecord[] => {
  const statuses: CrudExampleRecord['status'][] = ['enabled', 'pending', 'disabled'];
  const categories: CrudExampleRecord['category'][] = ['system', 'business', 'finance'];
  const owners = [
    t('demo.crud.owner.system', '系统管理员'),
    t('demo.crud.owner.business', '业务管理员'),
    t('demo.crud.owner.finance', '财务管理员'),
    t('demo.crud.owner.ops', '运营管理员'),
  ];

  return Array.from({ length: 64 }).map((_, index) => ({
    id: String(index + 1),
    name: `${t('demo.crud.record.name', '配置项')} ${String(index + 1).padStart(2, '0')}`,
    owner: owners[index % owners.length],
    status: statuses[index % statuses.length],
    category: categories[index % categories.length],
    visits: 1200 + index * 37,
    createdAt: `2026-04-${String((index % 24) + 1).padStart(2, '0')} 09:30`,
    updatedAt: `2026-05-${String((index % 7) + 1).padStart(2, '0')} 16:20`,
  }));
};

const filterRecords = (records: CrudExampleRecord[], params: CrudExampleQuery) =>
  records.filter((record) => {
    const matchName = params.name ? record.name.includes(params.name) : true;
    const matchOwner = params.owner ? record.owner.includes(params.owner) : true;
    const matchStatus = params.status ? record.status === params.status : true;
    const matchCategory = params.category ? record.category === params.category : true;

    return matchName && matchOwner && matchStatus && matchCategory;
  });

export default function CrudExamplePage() {
  const { t } = useI18n();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const { tableScrollY } = useWorkspaceViewport();
  const [selectedRows, setSelectedRows] = useState<CrudExampleRecord[]>([]);
  const records = useMemo(() => createRecords(t), [t]);
  const statusText: Record<CrudExampleRecord['status'], string> = {
    disabled: t('demo.crud.status.disabled', '已禁用'),
    enabled: t('demo.crud.status.enabled', '已启用'),
    pending: t('demo.crud.status.pending', '待确认'),
  };
  const categoryText: Record<CrudExampleRecord['category'], string> = {
    business: t('demo.crud.category.business', '业务配置'),
    finance: t('demo.crud.category.finance', '财务配置'),
    system: t('demo.crud.category.system', '系统配置'),
  };
  const columns: ProColumns<CrudExampleRecord>[] = [
    {
      title: t('demo.crud.column.name', '名称'),
      dataIndex: 'name',
      ellipsis: true,
      width: 220,
    },
    {
      title: t('demo.crud.column.owner', '负责人'),
      dataIndex: 'owner',
      width: 140,
    },
    {
      title: t('demo.crud.column.status', '状态'),
      dataIndex: 'status',
      valueType: 'select',
      width: 120,
      valueEnum: {
        disabled: { text: statusText.disabled, status: 'Default' },
        enabled: { text: statusText.enabled, status: 'Success' },
        pending: { text: statusText.pending, status: 'Processing' },
      },
      render: (_, record) => (
        <Tag color={statusColor[record.status]}>{statusText[record.status]}</Tag>
      ),
    },
    {
      title: t('demo.crud.column.category', '分类'),
      dataIndex: 'category',
      valueType: 'select',
      width: 140,
      valueEnum: {
        business: { text: categoryText.business },
        finance: { text: categoryText.finance },
        system: { text: categoryText.system },
      },
      renderText: (value) => categoryText[value as CrudExampleRecord['category']],
    },
    {
      title: t('demo.crud.column.visits', '访问量'),
      dataIndex: 'visits',
      valueType: 'digit',
      sorter: true,
      search: false,
      width: 120,
    },
    {
      title: t('demo.crud.column.createdAt', '创建时间'),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
    {
      title: t('demo.crud.column.updatedAt', '更新时间'),
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
    {
      title: t('demo.crud.column.action', '操作'),
      valueType: 'option',
      fixed: 'right',
      width: 140,
      render: (_, record) => [
        <Button key="edit" type="link" size="small">
          {t('demo.crud.action.edit', '编辑')}
        </Button>,
        <Button
          key="delete"
          type="link"
          danger
          size="small"
          onClick={() =>
            message.info(
              t('demo.crud.message.deleteOne', '已触发删除').replace('{{name}}', record.name),
            )
          }
        >
          {t('demo.crud.action.delete', '删除')}
        </Button>,
      ],
    },
  ];

  return (
    <TrueAdminPage
      layout="workspace"
      className="trueadmin-crud-page trueadmin-demo-crud-page"
      bodyClassName="trueadmin-crud-page-body"
    >
      <ProTable<CrudExampleRecord, CrudExampleQuery>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={{ labelWidth: 'auto', span: 8 }}
        options={{ density: true, fullScreen: true, reload: true, setting: true }}
        scroll={{ x: 1280, y: tableScrollY }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
        rowSelection={{
          selectedRowKeys: selectedRows.map((row) => row.id),
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        tableAlertRender={({ selectedRowKeys }) =>
          t('demo.crud.selected.count', '已选择 {{count}} 项').replace(
            '{{count}}',
            String(selectedRowKeys.length),
          )
        }
        tableAlertOptionRender={() => (
          <Space size={8}>
            <Button
              type="link"
              size="small"
              onClick={() => message.info(t('demo.crud.message.batchEnable', '已触发批量启用'))}
            >
              {t('demo.crud.batch.enable', '批量启用')}
            </Button>
            <Button
              type="link"
              danger
              size="small"
              onClick={() => {
                message.info(t('demo.crud.message.batchDelete', '已触发批量删除'));
                setSelectedRows([]);
              }}
            >
              {t('demo.crud.batch.delete', '批量删除')}
            </Button>
          </Space>
        )}
        toolbar={{ title: t('demo.crud.table.title', '配置列表') }}
        toolBarRender={() => [
          <Button
            key="reload"
            icon={<ReloadOutlined />}
            onClick={() => actionRef.current?.reload()}
          >
            {t('demo.crud.action.reload', '刷新')}
          </Button>,
          <Button key="export" icon={<ExportOutlined />}>
            {t('demo.crud.action.export', '导出')}
          </Button>,
          <Button
            key="delete"
            danger
            icon={<DeleteOutlined />}
            disabled={selectedRows.length === 0}
          >
            {t('demo.crud.batch.delete', '批量删除')}
          </Button>,
          <Button key="create" type="primary" icon={<PlusOutlined />}>
            {t('demo.crud.action.create', '新增')}
          </Button>,
        ]}
        request={async (params, sort) => {
          await wait(350);
          const sortedRecords = [...filterRecords(records, params)];
          const visitsOrder = sort?.visits;
          if (visitsOrder) {
            sortedRecords.sort((left, right) =>
              visitsOrder === 'ascend' ? left.visits - right.visits : right.visits - left.visits,
            );
          }
          const current = params.current ?? 1;
          const pageSize = params.pageSize ?? 20;
          const start = (current - 1) * pageSize;

          return {
            data: sortedRecords.slice(start, start + pageSize),
            success: true,
            total: sortedRecords.length,
          };
        }}
      />
    </TrueAdminPage>
  );
}
