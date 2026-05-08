import { Pie, Tiny } from '@ant-design/charts';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { StatisticCard } from '@ant-design/pro-components';
import { App, Button, Col, Dropdown, Form, Input, Row, Select, Space, Tag, Tooltip } from 'antd';
import type { Key } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud/TrueAdminCrudPage';
import type {
  CrudColumns,
  CrudExtraQuerySchema,
  CrudFilterSchema,
  CrudListParams,
  CrudLoadLifecycleContext,
  CrudPageResult,
  CrudRequestLifecycleContext,
  CrudService,
} from '@/core/crud/types';
import { downloadFile } from '@/core/download';
import { TrueAdminQuickFilter } from '@/core/filter/TrueAdminQuickFilter';
import { TrueAdminTreeFilter } from '@/core/filter/TrueAdminTreeFilter';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminModal } from '@/core/modal';

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
type CrudExampleCategoryFilter = 'all' | CrudExampleRecord['category'];
type CrudExampleCategoryTreeValue = CrudExampleCategoryFilter | 'config';

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
    t('examples.crud.owner.system', '系统管理员'),
    t('examples.crud.owner.business', '业务管理员'),
    t('examples.crud.owner.finance', '财务管理员'),
    t('examples.crud.owner.ops', '运营管理员'),
  ];

  return Array.from({ length: 64 }).map((_, index) => ({
    id: String(index + 1),
    name: `${t('examples.crud.record.name', '配置项')} ${String(index + 1).padStart(2, '0')}`,
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

const formatLifecycleParams = (params: CrudListParams) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    return '-';
  }

  return entries
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : String(value)}`)
    .join(' / ');
};

const filterRecords = (records: CrudExampleRecord[], params: CrudListParams) =>
  records.filter((record) => {
    const keyword = typeof params.keyword === 'string' ? params.keyword.trim() : '';
    const owner = typeof params.owner === 'string' ? params.owner.trim() : '';
    const statusScope = typeof params.statusScope === 'string' ? params.statusScope : 'all';
    const categoryScope = typeof params.categoryScope === 'string' ? params.categoryScope : 'all';
    const statuses = splitParam(params.status);
    const categories = splitParam(params.category);
    const [createdAtStart, createdAtEnd] = splitParam(params.createdAt);
    const matchKeyword = keyword
      ? record.name.includes(keyword) || record.owner.includes(keyword)
      : true;
    const matchOwner = owner ? record.owner.includes(owner) : true;
    const matchStatusScope = statusScope === 'all' ? true : record.status === statusScope;
    const matchCategoryScope = categoryScope === 'all' ? true : record.category === categoryScope;
    const matchStatus = statuses.length > 0 ? statuses.includes(record.status) : true;
    const matchCategory = categories.length > 0 ? categories.includes(record.category) : true;
    const matchCreatedAtStart = createdAtStart ? record.createdAt >= createdAtStart : true;
    const matchCreatedAtEnd = createdAtEnd ? record.createdAt <= `${createdAtEnd} 23:59` : true;

    return (
      matchKeyword &&
      matchOwner &&
      matchStatusScope &&
      matchCategoryScope &&
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
  const [form] = Form.useForm<Partial<CrudExampleRecord>>();
  const [records, setRecords] = useState(() => createRecords(t));
  const recordsRef = useRef(records);
  const [editingRecord, setEditingRecord] = useState<CrudExampleRecord>();
  const [formOpen, setFormOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<CrudExampleRecord[]>([]);
  const [categoryFilterCollapsed, setCategoryFilterCollapsed] = useState(false);
  const [categoryTreeLoading, setCategoryTreeLoading] = useState(false);
  const statusText = useMemo<Record<CrudExampleRecord['status'], string>>(
    () => ({
      disabled: t('examples.crud.status.disabled', '已禁用'),
      enabled: t('examples.crud.status.enabled', '已启用'),
      pending: t('examples.crud.status.pending', '待确认'),
    }),
    [t],
  );
  const categoryText = useMemo<Record<CrudExampleRecord['category'], string>>(
    () => ({
      business: t('examples.crud.category.business', '业务配置'),
      finance: t('examples.crud.category.finance', '财务配置'),
      system: t('examples.crud.category.system', '系统配置'),
    }),
    [t],
  );
  const selectedRowKeys = selectedRows.map((row) => row.id);
  const hasSelectedRows = selectedRows.length > 0;

  const filters = useMemo<CrudFilterSchema[]>(
    () => [
      {
        name: 'owner',
        label: t('examples.crud.column.owner', '负责人'),
        placeholder: t('examples.crud.filter.owner.placeholder', '请输入负责人'),
        type: 'input',
      },
      {
        name: 'status',
        label: t('examples.crud.column.status', '状态'),
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
        label: t('examples.crud.column.category', '分类'),
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
        label: t('examples.crud.column.createdAt', '创建时间'),
        type: 'dateRange',
      },
    ],
    [categoryText.business, categoryText.finance, categoryText.system, statusText, t],
  );

  const extraQuery = useMemo<CrudExtraQuerySchema[]>(
    () => [{ name: 'categoryScope' }, { name: 'statusScope' }],
    [],
  );

  const columns = useMemo<CrudColumns<CrudExampleRecord>>(
    () => [
      {
        title: t('examples.crud.column.name', '名称'),
        dataIndex: 'name',
        ellipsis: true,
        width: 220,
      },
      {
        title: t('examples.crud.column.owner', '负责人'),
        dataIndex: 'owner',
        width: 140,
      },
      {
        title: t('examples.crud.column.status', '状态'),
        dataIndex: 'status',
        width: 120,
        render: (_, record) => (
          <Tag color={statusColor[record.status]}>{statusText[record.status]}</Tag>
        ),
      },
      {
        title: t('examples.crud.column.category', '分类'),
        dataIndex: 'category',
        width: 140,
        render: (value) => categoryText[value as CrudExampleRecord['category']],
      },
      {
        title: t('examples.crud.column.visits', '访问量'),
        dataIndex: 'visits',
        sorter: true,
        width: 120,
      },
      {
        title: t('examples.crud.column.createdAt', '创建时间'),
        dataIndex: 'createdAt',
        width: 170,
      },
      {
        title: t('examples.crud.column.updatedAt', '更新时间'),
        dataIndex: 'updatedAt',
        width: 170,
      },
    ],
    [categoryText, statusText, t],
  );

  const statusFilterItems = useMemo(
    () => [
      { label: t('examples.crud.status.all', '全部'), value: 'all' as const },
      { label: statusText.enabled, value: 'enabled' as const },
      { label: statusText.pending, value: 'pending' as const },
      { label: statusText.disabled, value: 'disabled' as const },
    ],
    [statusText, t],
  );

  const categoryFilterItems = useMemo(
    () => [
      {
        label: t('examples.crud.category.all', '全部分类'),
        searchText: t('examples.crud.category.all.searchText', '全部 分类'),
        value: 'all' as const,
      },
      {
        children: [
          { label: categoryText.system, value: 'system' as const },
          { label: categoryText.business, value: 'business' as const },
          { label: categoryText.finance, value: 'finance' as const },
        ],
        label: t('examples.crud.category.group.config', '配置分类'),
        searchText: t('examples.crud.category.group.config.searchText', '配置 分类'),
        selectable: false,
        value: 'config' as const,
      },
    ],
    [categoryText.business, categoryText.finance, categoryText.system, t],
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
      create: async (payload) => {
        await wait(300);
        const now = '2026-05-07 18:30';
        const nextRecord: CrudExampleRecord = {
          category: payload.category ?? 'system',
          createdAt: now,
          id: String(Date.now()),
          name: payload.name ?? t('examples.crud.record.name', '配置项'),
          owner: payload.owner ?? t('examples.crud.owner.system', '系统管理员'),
          status: payload.status ?? 'pending',
          updatedAt: now,
          visits: 0,
        };
        const nextRecords = [nextRecord, ...recordsRef.current];
        recordsRef.current = nextRecords;
        setRecords(nextRecords);
        return nextRecord;
      },
      delete: async (id) => {
        await wait(300);
        const nextRecords = recordsRef.current.filter((record) => record.id !== String(id));
        recordsRef.current = nextRecords;
        setRecords(nextRecords);
        return { id };
      },
      list: async (params) => {
        await wait(350);
        const currentRecords = recordsRef.current;
        const filteredRecords = filterRecords(currentRecords, params);
        const sortedRecords = sortRecords(filteredRecords, params);
        const page = params.page ?? 1;
        const pageSize = params.pageSize ?? 20;
        const start = (page - 1) * pageSize;

        return {
          items: sortedRecords.slice(start, start + pageSize),
          meta: getListMeta(currentRecords),
          page,
          pageSize,
          total: sortedRecords.length,
        };
      },
      update: async (id, payload) => {
        await wait(300);
        let nextRecord: CrudExampleRecord | undefined;
        const nextRecords = recordsRef.current.map((record) => {
          if (record.id !== String(id)) {
            return record;
          }
          nextRecord = { ...record, ...payload, updatedAt: '2026-05-07 18:30' };
          return nextRecord;
        });
        if (!nextRecord) {
          throw new Error('Record not found.');
        }
        recordsRef.current = nextRecords;
        setRecords(nextRecords);
        return nextRecord;
      },
    }),
    [t],
  );

  const appendLifecycleLog = useCallback(
    (name: string, messageText: string, payload: Record<string, unknown>) => {
      console.info('[CRUD lifecycle]', name, messageText, payload);
    },
    [],
  );

  const handleReloadCategoryTree = useCallback(async () => {
    setCategoryTreeLoading(true);
    await wait(350);
    setCategoryTreeLoading(false);
    message.success(t('examples.crud.category.tree.reloadSuccess', '分类目录已刷新'));
  }, [message, t]);

  const handleBeforeRequest = useCallback(
    (params: CrudListParams, context: CrudRequestLifecycleContext) => {
      appendLifecycleLog('beforeRequest', formatLifecycleParams(params), { context, params });
      return undefined;
    },
    [appendLifecycleLog],
  );

  const handleTransformParams = useCallback(
    (params: CrudListParams, context: CrudRequestLifecycleContext) => {
      const nextParams = { ...params, lifecycleDemo: 'enabled' };
      appendLifecycleLog('transformParams', formatLifecycleParams(nextParams), {
        context,
        nextParams,
        params,
      });
      return nextParams;
    },
    [appendLifecycleLog],
  );

  const handleTransformResponse = useCallback(
    (
      response: CrudPageResult<CrudExampleRecord, CrudExampleMeta>,
      context: CrudLoadLifecycleContext,
    ) => {
      appendLifecycleLog(
        'transformResponse',
        `items=${response.items.length} / total=${response.total}`,
        { context, response },
      );
      return response;
    },
    [appendLifecycleLog],
  );

  const handleLoadSuccess = useCallback(
    (
      response: CrudPageResult<CrudExampleRecord, CrudExampleMeta>,
      context: CrudLoadLifecycleContext,
    ) => {
      appendLifecycleLog('onLoadSuccess', `total=${response.total}`, { context, response });
    },
    [appendLifecycleLog],
  );

  const handleLoadError = useCallback(
    (error: unknown, context: CrudLoadLifecycleContext) => {
      appendLifecycleLog('onLoadError', error instanceof Error ? error.message : String(error), {
        context,
        error,
      });
      return undefined;
    },
    [appendLifecycleLog],
  );

  const openCreateForm = useCallback(() => {
    setEditingRecord(undefined);
    form.resetFields();
    form.setFieldsValue({ category: 'system', status: 'pending' });
    setFormOpen(true);
  }, [form]);

  const openEditForm = useCallback(
    (record: CrudExampleRecord) => {
      setEditingRecord(record);
      form.setFieldsValue(record);
      setFormOpen(true);
    },
    [form],
  );

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingRecord(undefined);
    form.resetFields();
  }, [form]);

  const handleCreateSuccess = useCallback(
    (
      record: CrudExampleRecord,
      context: { payload: Partial<CrudExampleRecord>; resource: string },
    ) => {
      appendLifecycleLog('onCreateSuccess', record.name, { context, record });
      message.success(t('examples.crud.message.createSuccess', '新增成功'));
    },
    [appendLifecycleLog, message, t],
  );

  const handleUpdateSuccess = useCallback(
    (
      record: CrudExampleRecord,
      context: { id: Key; payload: Partial<CrudExampleRecord>; resource: string },
    ) => {
      appendLifecycleLog('onUpdateSuccess', record.name, { context, record });
      message.success(t('examples.crud.message.updateSuccess', '保存成功'));
    },
    [appendLifecycleLog, message, t],
  );

  const handleDeleteSuccess = useCallback(
    (result: unknown, context: { id: Key; resource: string }) => {
      appendLifecycleLog('onDeleteSuccess', String(context.id), { context, result });
      message.success(t('examples.crud.message.deleteSuccess', '删除成功'));
    },
    [appendLifecycleLog, message, t],
  );

  return (
    <TrueAdminCrudPage<
      CrudExampleRecord,
      Partial<CrudExampleRecord>,
      Partial<CrudExampleRecord>,
      CrudExampleMeta
    >
      title={t('examples.crud.title', 'CRUD 页面示例')}
      description={t(
        'examples.crud.description',
        '展示分类目录、统计概览、高级筛选和标准表格组合。',
      )}
      resource="true-admin.examples.crud"
      columns={columns}
      service={service}
      extraQuery={extraQuery}
      beforeRequest={handleBeforeRequest}
      transformParams={handleTransformParams}
      transformResponse={handleTransformResponse}
      onLoadSuccess={handleLoadSuccess}
      onLoadError={handleLoadError}
      onCreateSuccess={handleCreateSuccess}
      onUpdateSuccess={handleUpdateSuccess}
      onDeleteSuccess={handleDeleteSuccess}
      rowKey="id"
      quickSearch={{ placeholder: t('examples.crud.quickSearch.placeholder', '搜索名称 / 负责人') }}
      filters={filters}
      locale={{
        actionColumnTitle: t('crud.column.action', '操作'),
        advancedFilterText: t('crud.filter.advanced', '高级筛选'),
        filterResetText: t('crud.filter.reset', '重置'),
        filterSearchText: t('crud.filter.search', '查询'),
        paginationTotalText: (total) =>
          t('crud.pagination.total', '共 {{total}} 条').replace('{{total}}', String(total)),
        quickSearchPlaceholder: t('examples.crud.quickSearch.placeholder', '搜索名称 / 负责人'),
        searchText: t('crud.action.search', '搜索'),
      }}
      toolbarProps={{
        quickSearchInputProps: { allowClear: true },
        reloadButtonProps: { title: t('crud.action.reload', '刷新') },
      }}
      filterPanelProps={{
        formProps: { colon: false },
      }}
      tableProps={{
        size: 'middle',
      }}
      paginationProps={{
        showQuickJumper: true,
      }}
      tableScrollX={1280}
      asideWidth={categoryFilterCollapsed ? 44 : 260}
      asideBodyClassName={
        categoryFilterCollapsed
          ? 'trueadmin-examples-crud-aside is-collapsed'
          : 'trueadmin-examples-crud-aside is-expanded'
      }
      aside={({ query }) => {
        const categoryScope = (query.values.categoryScope as CrudExampleCategoryFilter) ?? 'all';

        return (
          <>
            <div
              className="trueadmin-examples-crud-aside-panel"
              aria-hidden={categoryFilterCollapsed}
            >
              <TrueAdminTreeFilter<CrudExampleCategoryTreeValue>
                title={t('examples.crud.category.tree.title', '分类目录')}
                placeholder={t('examples.crud.category.tree.placeholder', '搜索分类')}
                emptyText={t('examples.crud.category.tree.empty', '暂无匹配分类')}
                value={categoryScope}
                loading={categoryTreeLoading}
                expandAllText={t('examples.crud.category.tree.expandAll', '展开全部')}
                collapseAllText={t('examples.crud.category.tree.collapseAll', '收起全部')}
                reloadText={t('examples.crud.category.tree.reload', '刷新分类目录')}
                onReload={handleReloadCategoryTree}
                extra={
                  <Tooltip title={t('examples.crud.category.tree.hide', '隐藏分类目录')}>
                    <Button
                      size="small"
                      type="text"
                      icon={<MenuFoldOutlined />}
                      onClick={() => setCategoryFilterCollapsed(true)}
                    />
                  </Tooltip>
                }
                items={categoryFilterItems}
                onChange={(nextValue) => {
                  if (nextValue !== 'config') {
                    query.setValue('categoryScope', nextValue === 'all' ? undefined : nextValue);
                    setSelectedRows([]);
                  }
                }}
              />
            </div>
            <div
              className="trueadmin-examples-crud-aside-rail"
              aria-hidden={!categoryFilterCollapsed}
            >
              <Tooltip
                title={t('examples.crud.category.tree.show', '显示分类目录')}
                placement="right"
              >
                <Button
                  type="text"
                  icon={<MenuUnfoldOutlined />}
                  onClick={() => setCategoryFilterCollapsed(false)}
                />
              </Tooltip>
            </div>
          </>
        );
      }}
      rowActions={{
        render: ({ record }) => (
          <Button key="edit" type="link" size="small" onClick={() => openEditForm(record)}>
            {t('examples.crud.action.edit', '编辑')}
          </Button>
        ),
        width: 150,
      }}
      rowSelection={{
        selectedRowKeys,
        onChange: (_, rows) => setSelectedRows(rows),
      }}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateForm}>
          {t('examples.crud.action.create', '新增')}
        </Button>
      }
      importExport={{
        import: {
          accept: '.xlsx,.xls,.csv',
          description: t(
            'examples.crud.import.description',
            '请先下载模板，按模板整理数据后上传。',
          ),
          template: {
            onDownload: () => {
              void downloadFile('/mock/attachments/quotation.xlsx', {
                filename: 'trueadmin-import-template.xlsx',
              });
              message.info(t('examples.crud.message.downloadTemplate', '已触发下载导入模板'));
            },
          },
          onConfirm: async (file) => {
            await wait(350);
            message.success(
              t('examples.crud.message.importSuccess', '已确认导入：{{name}}').replace(
                '{{name}}',
                file.name,
              ),
            );
          },
        },
        export: {
          onExport: (type) => {
            const messageKey =
              type === 'page'
                ? 'examples.crud.message.exportPage'
                : type === 'selected'
                  ? 'examples.crud.message.exportSelected'
                  : 'examples.crud.message.exportFilteredAll';
            const fallback =
              type === 'page'
                ? '已触发导出当页'
                : type === 'selected'
                  ? '已触发导出选中'
                  : '已触发导出全部结果';
            message.info(t(messageKey, fallback));
          },
        },
      }}
      summaryRender={({ response, total }) => {
        const statusStats = response?.meta?.statusStats;
        const enabledCount = statusStats?.enabled ?? 0;
        const allCount = statusStats?.all ?? 0;
        const visitTrend = response?.meta?.visitTrend ?? [];
        const statusTrend = response?.meta?.statusTrend ?? [];
        const enabledChartData = [
          { label: t('examples.crud.summary.enabled', '启用配置'), value: enabledCount },
          {
            label: t('examples.crud.summary.disabledOther', '其他配置'),
            value: Math.max(allCount - enabledCount, 0),
          },
        ];

        return (
          <Row className="trueadmin-examples-crud-summary" gutter={[12, 12]}>
            <Col xs={24} sm={12} xl={6}>
              <StatisticCard
                className="trueadmin-examples-crud-summary-card"
                chartPlacement="right"
                styles={summaryCardStyles}
                statistic={{
                  title: t('examples.crud.summary.currentTotal', '当前结果'),
                  value: total,
                  suffix: t('examples.crud.summary.unit.items', '项'),
                  styles: { content: { fontSize: 20 } },
                }}
                chart={
                  <div className="trueadmin-examples-crud-summary-chart">
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
                className="trueadmin-examples-crud-summary-card"
                chartPlacement="right"
                styles={summaryCardStyles}
                statistic={{
                  title: t('examples.crud.summary.enabled', '启用配置'),
                  value: enabledCount,
                  suffix: t('examples.crud.summary.unit.items', '项'),
                  trend: 'up',
                  styles: { content: { fontSize: 20 } },
                }}
                chart={
                  <div className="trueadmin-examples-crud-summary-chart is-pie">
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
                className="trueadmin-examples-crud-summary-card"
                chartPlacement="right"
                styles={summaryCardStyles}
                statistic={{
                  title: t('examples.crud.summary.todayUpdated', '今日更新'),
                  value: response?.meta?.todayUpdated ?? 0,
                  suffix: t('examples.crud.summary.unit.items', '项'),
                  status: 'processing',
                  styles: { content: { fontSize: 20 } },
                }}
                chart={
                  <div className="trueadmin-examples-crud-summary-chart">
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
                className="trueadmin-examples-crud-summary-card"
                chartPlacement="right"
                styles={summaryCardStyles}
                statistic={{
                  title: t('examples.crud.summary.totalVisits', '累计访问'),
                  value: response?.meta?.totalVisits ?? 0,
                  formatter: (value) => formatCompactNumber(Number(value ?? 0)),
                  styles: { content: { fontSize: 20 } },
                }}
                chart={
                  <div className="trueadmin-examples-crud-summary-chart">
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
      toolbarRender={({ action, query, response }) => {
        const statusScope = (query.values.statusScope as CrudExampleStatusFilter) ?? 'all';

        return (
          <>
            <Space className="trueadmin-crud-toolbar-business" size={8} wrap>
              <TrueAdminQuickFilter<CrudExampleStatusFilter>
                value={statusScope}
                items={statusFilterItems.map((item) => ({
                  ...item,
                  count: item.value === 'pending' ? response?.meta?.statusStats.pending : undefined,
                }))}
                onChange={(nextValue) => {
                  query.setValue('statusScope', nextValue === 'all' ? undefined : nextValue);
                  setSelectedRows([]);
                }}
              />
              <Dropdown
                disabled={!hasSelectedRows}
                menu={{
                  items: [
                    {
                      key: 'enable',
                      icon: <CheckCircleOutlined />,
                      label: t('examples.crud.batch.enable', '批量启用'),
                    },
                    {
                      danger: true,
                      key: 'delete',
                      icon: <DeleteOutlined />,
                      label: t('examples.crud.batch.delete', '批量删除'),
                    },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'enable') {
                      message.info(t('examples.crud.message.batchEnable', '已触发批量启用'));
                      return;
                    }
                    if (key === 'delete') {
                      message.info(t('examples.crud.message.batchDelete', '已触发批量删除'));
                      setSelectedRows([]);
                    }
                  },
                }}
              >
                <Button disabled={!hasSelectedRows} icon={<DownOutlined />}>
                  {t('examples.crud.batch.actions', '批量操作')}
                </Button>
              </Dropdown>
            </Space>
            <TrueAdminModal
              title={
                editingRecord
                  ? t('examples.crud.form.editTitle', '编辑配置')
                  : t('examples.crud.form.createTitle', '新增配置')
              }
              open={formOpen}
              confirmLoading={formSubmitting}
              onCancel={closeForm}
              onOk={() => form.submit()}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={async (values) => {
                  setFormSubmitting(true);
                  try {
                    if (editingRecord) {
                      await action.update?.(editingRecord.id, values);
                    } else {
                      await action.create?.(values);
                    }
                    closeForm();
                  } finally {
                    setFormSubmitting(false);
                  }
                }}
              >
                <Form.Item
                  name="name"
                  label={t('examples.crud.column.name', '名称')}
                  rules={[
                    { required: true, message: t('examples.crud.form.nameRequired', '请输入名称') },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="owner"
                  label={t('examples.crud.column.owner', '负责人')}
                  rules={[
                    {
                      required: true,
                      message: t('examples.crud.form.ownerRequired', '请输入负责人'),
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item name="status" label={t('examples.crud.column.status', '状态')}>
                  <Select
                    options={[
                      { label: statusText.enabled, value: 'enabled' },
                      { label: statusText.pending, value: 'pending' },
                      { label: statusText.disabled, value: 'disabled' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="category" label={t('examples.crud.column.category', '分类')}>
                  <Select
                    options={[
                      { label: categoryText.system, value: 'system' },
                      { label: categoryText.business, value: 'business' },
                      { label: categoryText.finance, value: 'finance' },
                    ]}
                  />
                </Form.Item>
              </Form>
            </TrueAdminModal>
          </>
        );
      }}
    />
  );
}
