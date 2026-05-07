import { Pie, Tiny } from '@ant-design/charts';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  ExportOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { StatisticCard } from '@ant-design/pro-components';
import { App, Button, Col, Dropdown, Row, Space, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud/TrueAdminCrudPage';
import type { CrudColumns, CrudFilterSchema, CrudListParams, CrudService } from '@/core/crud/types';
import { TrueAdminQuickFilter } from '@/core/filter/TrueAdminQuickFilter';
import { useI18n } from '@/core/i18n/I18nProvider';

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

type CrudExampleStatusFilter = 'all' | CrudExampleRecord['status'];

type CrudExampleTrendItem = {
  period: string;
  value: number;
};

type CrudExampleMeta = {
  categoryStats: Array<{ category: CrudExampleRecord['category']; count: number }>;
  statusStats: Record<CrudExampleStatusFilter, number>;
  statusTrend: CrudExampleTrendItem[];
  totalVisits: number;
  visitTrend: CrudExampleTrendItem[];
  todayUpdated: number;
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

const splitParam = (value: unknown) =>
  typeof value === 'string' && value.length > 0 ? value.split(',').filter(Boolean) : [];

const getStatusStats = (records: CrudExampleRecord[]): CrudExampleMeta['statusStats'] => ({
  all: records.length,
  disabled: records.filter((record) => record.status === 'disabled').length,
  enabled: records.filter((record) => record.status === 'enabled').length,
  pending: records.filter((record) => record.status === 'pending').length,
});

const toTrendItems = (values: number[]): CrudExampleTrendItem[] =>
  values.map((value, index) => ({
    period: String(index + 1).padStart(2, '0'),
    value,
  }));

const getListMeta = (records: CrudExampleRecord[]): CrudExampleMeta => ({
  categoryStats: ['system', 'business', 'finance'].map((category) => ({
    category: category as CrudExampleRecord['category'],
    count: records.filter((record) => record.category === category).length,
  })),
  statusStats: getStatusStats(records),
  statusTrend: toTrendItems([18, 22, 21, 25, 28, 26, 31, 34, 33, 36, 39, 42]),
  todayUpdated: records.filter((record) => record.updatedAt.startsWith('2026-05-07')).length,
  totalVisits: records.reduce((total, record) => total + record.visits, 0),
  visitTrend: toTrendItems([28, 32, 36, 35, 41, 48, 46, 53, 58, 61, 65, 72]),
});

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 1,
    notation: 'compact',
  }).format(value);

const summaryCardStyles = {
  body: { display: 'flex', height: '100%', justifyContent: 'center', padding: 12 },
};

const filterRecords = (records: CrudExampleRecord[], params: CrudListParams) =>
  records.filter((record) => {
    const keyword = typeof params.keyword === 'string' ? params.keyword.trim() : '';
    const owner = typeof params.owner === 'string' ? params.owner.trim() : '';
    const statusScope = typeof params.statusScope === 'string' ? params.statusScope : 'all';
    const statuses = splitParam(params.status);
    const categories = splitParam(params.category);
    const [createdAtStart, createdAtEnd] = splitParam(params.createdAt);
    const matchKeyword = keyword
      ? record.name.includes(keyword) || record.owner.includes(keyword)
      : true;
    const matchOwner = owner ? record.owner.includes(owner) : true;
    const matchStatusScope = statusScope === 'all' ? true : record.status === statusScope;
    const matchStatus = statuses.length > 0 ? statuses.includes(record.status) : true;
    const matchCategory = categories.length > 0 ? categories.includes(record.category) : true;
    const matchCreatedAtStart = createdAtStart ? record.createdAt >= createdAtStart : true;
    const matchCreatedAtEnd = createdAtEnd ? record.createdAt <= `${createdAtEnd} 23:59` : true;

    return (
      matchKeyword &&
      matchOwner &&
      matchStatusScope &&
      matchStatus &&
      matchCategory &&
      matchCreatedAtStart &&
      matchCreatedAtEnd
    );
  });

const sortRecords = (records: CrudExampleRecord[], params: CrudListParams) => {
  if (params.sort !== 'visits' || !params.order) {
    return records;
  }

  return [...records].sort((left, right) =>
    params.order === 'asc' ? left.visits - right.visits : right.visits - left.visits,
  );
};

export default function CrudExamplePage() {
  const { t } = useI18n();
  const { message } = App.useApp();
  const [selectedRows, setSelectedRows] = useState<CrudExampleRecord[]>([]);
  const [statusScope, setStatusScope] = useState<CrudExampleStatusFilter>('all');
  const records = useMemo(() => createRecords(t), [t]);
  const statusText = useMemo<Record<CrudExampleRecord['status'], string>>(
    () => ({
      disabled: t('demo.crud.status.disabled', '已禁用'),
      enabled: t('demo.crud.status.enabled', '已启用'),
      pending: t('demo.crud.status.pending', '待确认'),
    }),
    [t],
  );
  const categoryText = useMemo<Record<CrudExampleRecord['category'], string>>(
    () => ({
      business: t('demo.crud.category.business', '业务配置'),
      finance: t('demo.crud.category.finance', '财务配置'),
      system: t('demo.crud.category.system', '系统配置'),
    }),
    [t],
  );
  const selectedRowKeys = selectedRows.map((row) => row.id);
  const hasSelectedRows = selectedRows.length > 0;

  const filters = useMemo<CrudFilterSchema[]>(
    () => [
      {
        name: 'owner',
        label: t('demo.crud.column.owner', '负责人'),
        placeholder: t('demo.crud.filter.owner.placeholder', '请输入负责人'),
        type: 'input',
      },
      {
        name: 'status',
        label: t('demo.crud.column.status', '状态'),
        mode: 'multiple',
        type: 'select',
        options: [
          { label: statusText.enabled, value: 'enabled' },
          { label: statusText.pending, value: 'pending' },
          { label: statusText.disabled, value: 'disabled' },
        ],
      },
      {
        name: 'category',
        label: t('demo.crud.column.category', '分类'),
        mode: 'multiple',
        type: 'select',
        options: [
          { label: categoryText.system, value: 'system' },
          { label: categoryText.business, value: 'business' },
          { label: categoryText.finance, value: 'finance' },
        ],
      },
      {
        name: 'createdAt',
        label: t('demo.crud.column.createdAt', '创建时间'),
        type: 'dateRange',
      },
    ],
    [categoryText.business, categoryText.finance, categoryText.system, statusText, t],
  );

  const columns = useMemo<CrudColumns<CrudExampleRecord>>(
    () => [
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
        width: 120,
        render: (_, record) => (
          <Tag color={statusColor[record.status]}>{statusText[record.status]}</Tag>
        ),
      },
      {
        title: t('demo.crud.column.category', '分类'),
        dataIndex: 'category',
        width: 140,
        render: (value) => categoryText[value as CrudExampleRecord['category']],
      },
      {
        title: t('demo.crud.column.visits', '访问量'),
        dataIndex: 'visits',
        sorter: true,
        width: 120,
      },
      {
        title: t('demo.crud.column.createdAt', '创建时间'),
        dataIndex: 'createdAt',
        width: 170,
      },
      {
        title: t('demo.crud.column.updatedAt', '更新时间'),
        dataIndex: 'updatedAt',
        width: 170,
      },
      {
        title: t('demo.crud.column.action', '操作'),
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
                t('demo.crud.message.deleteOne', '已触发删除：{{name}}').replace(
                  '{{name}}',
                  record.name,
                ),
              )
            }
          >
            {t('demo.crud.action.delete', '删除')}
          </Button>,
        ],
      },
    ],
    [categoryText, message, statusText, t],
  );

  const statusFilterItems = useMemo(
    () => [
      { label: t('demo.crud.status.all', '全部'), value: 'all' as const },
      { label: statusText.enabled, value: 'enabled' as const },
      { label: statusText.pending, value: 'pending' as const },
      { label: statusText.disabled, value: 'disabled' as const },
    ],
    [statusText, t],
  );

  const service = useMemo<
    CrudService<
      CrudExampleRecord,
      Partial<CrudExampleRecord>,
      Partial<CrudExampleRecord>,
      CrudExampleMeta
    >
  >(
    () => ({
      list: async (params) => {
        await wait(350);
        const filteredRecords = filterRecords(records, params);
        const sortedRecords = sortRecords(filteredRecords, params);
        const page = params.page ?? 1;
        const pageSize = params.pageSize ?? 20;
        const start = (page - 1) * pageSize;

        return {
          items: sortedRecords.slice(start, start + pageSize),
          meta: getListMeta(records),
          page,
          pageSize,
          total: sortedRecords.length,
        };
      },
    }),
    [records],
  );

  const scopedService = useMemo<
    CrudService<
      CrudExampleRecord,
      Partial<CrudExampleRecord>,
      Partial<CrudExampleRecord>,
      CrudExampleMeta
    >
  >(
    () => ({
      ...service,
      list: (params) => service.list({ ...params, statusScope }),
    }),
    [service, statusScope],
  );

  return (
    <TrueAdminCrudPage<
      CrudExampleRecord,
      Partial<CrudExampleRecord>,
      Partial<CrudExampleRecord>,
      CrudExampleMeta
    >
      title={t('demo.crud.title', 'CRUD 页面示例')}
      resource="demo.crud"
      columns={columns}
      service={scopedService}
      rowKey="id"
      quickSearch={{ placeholder: t('demo.crud.quickSearch.placeholder', '搜索名称 / 负责人') }}
      filters={filters}
      tableScrollX={1280}
      rowSelection={{
        selectedRowKeys,
        onChange: (_, rows) => setSelectedRows(rows),
      }}
      extra={
        <Space size={8} wrap>
          <Button type="primary" icon={<PlusOutlined />}>
            {t('demo.crud.action.create', '新增')}
          </Button>
          <Button icon={<ExportOutlined />}>{t('demo.crud.action.export', '导出')}</Button>
        </Space>
      }
      summaryRender={({ response, total }) => {
        const statusStats = response?.meta?.statusStats;
        const enabledCount = statusStats?.enabled ?? 0;
        const allCount = statusStats?.all ?? 0;
        const visitTrend = response?.meta?.visitTrend ?? [];
        const statusTrend = response?.meta?.statusTrend ?? [];
        const enabledChartData = [
          { label: t('demo.crud.summary.enabled', '启用配置'), value: enabledCount },
          {
            label: t('demo.crud.summary.disabledOther', '其他配置'),
            value: Math.max(allCount - enabledCount, 0),
          },
        ];

        return (
          <Row className="trueadmin-demo-crud-summary" gutter={[12, 12]}>
            <Col xs={24} sm={12} xl={6}>
              <StatisticCard
                className="trueadmin-demo-crud-summary-card"
                chartPlacement="right"
                styles={summaryCardStyles}
                statistic={{
                  title: t('demo.crud.summary.currentTotal', '当前结果'),
                  value: total,
                  suffix: t('demo.crud.summary.unit.items', '项'),
                  valueStyle: { fontSize: 20 },
                }}
                chart={
                  <div className="trueadmin-demo-crud-summary-chart">
                    <Tiny.Line
                      data={statusTrend}
                      xField="period"
                      yField="value"
                      height={48}
                      autoFit
                      color="var(--ant-color-primary)"
                      tooltip={false}
                      smooth
                    />
                  </div>
                }
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatisticCard
                className="trueadmin-demo-crud-summary-card"
                chartPlacement="right"
                styles={summaryCardStyles}
                statistic={{
                  title: t('demo.crud.summary.enabled', '启用配置'),
                  value: enabledCount,
                  suffix: t('demo.crud.summary.unit.items', '项'),
                  trend: 'up',
                  valueStyle: { fontSize: 20 },
                }}
                chart={
                  <div className="trueadmin-demo-crud-summary-chart is-pie">
                    <Pie
                      data={enabledChartData}
                      angleField="value"
                      colorField="label"
                      height={72}
                      autoFit
                      innerRadius={0.72}
                      legend={false}
                      label={false}
                      tooltip={false}
                      color={['var(--ant-color-success)', 'var(--ant-color-fill-secondary)']}
                    />
                  </div>
                }
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatisticCard
                className="trueadmin-demo-crud-summary-card"
                chartPlacement="right"
                styles={summaryCardStyles}
                statistic={{
                  title: t('demo.crud.summary.todayUpdated', '今日更新'),
                  value: response?.meta?.todayUpdated ?? 0,
                  suffix: t('demo.crud.summary.unit.items', '项'),
                  status: 'processing',
                  valueStyle: { fontSize: 20 },
                }}
                chart={
                  <div className="trueadmin-demo-crud-summary-chart">
                    <Tiny.Column
                      data={statusTrend}
                      xField="period"
                      yField="value"
                      height={48}
                      autoFit
                      color="var(--ant-color-info)"
                      tooltip={false}
                    />
                  </div>
                }
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatisticCard
                className="trueadmin-demo-crud-summary-card"
                chartPlacement="right"
                styles={summaryCardStyles}
                statistic={{
                  title: t('demo.crud.summary.totalVisits', '累计访问'),
                  value: response?.meta?.totalVisits ?? 0,
                  formatter: (value) => formatCompactNumber(Number(value ?? 0)),
                  valueStyle: { fontSize: 20 },
                }}
                chart={
                  <div className="trueadmin-demo-crud-summary-chart">
                    <Tiny.Area
                      data={visitTrend}
                      xField="period"
                      yField="value"
                      height={48}
                      autoFit
                      color="var(--ant-color-warning)"
                      tooltip={false}
                      smooth
                    />
                  </div>
                }
              />
            </Col>
          </Row>
        );
      }}
      toolbarRender={({ response }) => (
        <Space className="trueadmin-crud-toolbar-business" size={8} wrap>
          <TrueAdminQuickFilter<CrudExampleStatusFilter>
            value={statusScope}
            items={statusFilterItems.map((item) => ({
              ...item,
              count: response?.meta?.statusStats[item.value],
            }))}
            onChange={setStatusScope}
          />
          <Dropdown
            disabled={!hasSelectedRows}
            menu={{
              items: [
                {
                  key: 'enable',
                  icon: <CheckCircleOutlined />,
                  label: t('demo.crud.batch.enable', '批量启用'),
                },
                {
                  danger: true,
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: t('demo.crud.batch.delete', '批量删除'),
                },
              ],
              onClick: ({ key }) => {
                if (key === 'enable') {
                  message.info(t('demo.crud.message.batchEnable', '已触发批量启用'));
                  return;
                }
                if (key === 'delete') {
                  message.info(t('demo.crud.message.batchDelete', '已触发批量删除'));
                  setSelectedRows([]);
                }
              },
            }}
          >
            <Button disabled={!hasSelectedRows} icon={<DownOutlined />}>
              {t('demo.crud.batch.actions', '批量操作')}
            </Button>
          </Dropdown>
        </Space>
      )}
    />
  );
}
