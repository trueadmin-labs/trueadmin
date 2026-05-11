import { Button, Descriptions, Drawer, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud/TrueAdminCrudPage';
import type { CrudColumns, CrudFilterSchema } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { operationLogApi } from '../../services/log.api';
import type { AdminOperationLog } from '../../types/log';

export default function AdminOperationLogsPage() {
  const { t } = useI18n();
  const [detail, setDetail] = useState<AdminOperationLog>();

  const columns = useMemo<CrudColumns<AdminOperationLog>>(
    () => [
      { title: 'ID', dataIndex: 'id', width: 88, sorter: true },
      { title: t('system.operationLogs.column.module', '模块'), dataIndex: 'module', width: 120 },
      { title: t('system.operationLogs.column.action', '动作'), dataIndex: 'action', width: 220 },
      { title: t('system.operationLogs.column.remark', '说明'), dataIndex: 'remark', width: 180 },
      {
        title: t('system.operationLogs.column.operatorType', '操作者类型'),
        dataIndex: 'operatorType',
        width: 120,
      },
      {
        title: t('system.operationLogs.column.operatorId', '操作者 ID'),
        dataIndex: 'operatorId',
        width: 120,
      },
      {
        title: t('system.operationLogs.column.operationDeptId', '操作部门'),
        dataIndex: 'operationDeptId',
        width: 120,
        render: (_, record) => record.operationDeptId ?? '-',
      },
      {
        title: t('system.operationLogs.column.createdAt', '操作时间'),
        dataIndex: 'createdAt',
        key: 'created_at',
        width: 180,
        sorter: true,
      },
      {
        title: t('crud.column.action', '操作'),
        dataIndex: 'id',
        width: 100,
        fixed: 'right',
        render: (_, record) => (
          <Button size="small" type="link" onClick={() => setDetail(record)}>
            {t('crud.action.detail', '详情')}
          </Button>
        ),
      },
    ],
    [t],
  );

  const filters = useMemo<CrudFilterSchema[]>(
    () => [
      { name: 'module', label: t('system.operationLogs.column.module', '模块'), type: 'input' },
      { name: 'action', label: t('system.operationLogs.column.action', '动作'), type: 'input' },
      {
        name: 'operator_id',
        label: t('system.operationLogs.column.operatorId', '操作者 ID'),
        type: 'input',
      },
      {
        name: 'created_at',
        label: t('system.operationLogs.column.createdAt', '操作时间'),
        type: 'dateRange',
      },
    ],
    [t],
  );

  return (
    <>
      <TrueAdminCrudPage<AdminOperationLog>
        title={t('system.operationLogs.title', '操作日志')}
        description={t(
          'system.operationLogs.description',
          '查看后台关键操作记录、操作者和上下文。',
        )}
        resource="system.operation-log"
        rowKey="id"
        columns={columns}
        filters={filters}
        service={operationLogApi}
        quickSearch={{
          placeholder: t(
            'system.operationLogs.quickSearch.placeholder',
            '搜索模块 / 动作 / 说明 / 操作者',
          ),
        }}
        toolbarProps={{
          quickSearchInputProps: { allowClear: true },
          reloadButtonProps: { title: t('crud.action.reload', '刷新') },
        }}
        tableProps={{ size: 'middle' }}
        paginationProps={{ showQuickJumper: true }}
        tableScrollX={1280}
      />
      <Drawer
        width={560}
        open={Boolean(detail)}
        title={t('system.operationLogs.detail.title', '操作日志详情')}
        onClose={() => setDetail(undefined)}
      >
        {detail ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.module', '模块')}>
              {detail.module}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.action', '动作')}>
              {detail.action}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.remark', '说明')}>
              {detail.remark || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.principal', '主体')}>
              {detail.principalType || '-'} / {detail.principalId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.operator', '操作者')}>
              {detail.operatorType || '-'} / {detail.operatorId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.operationDeptId', '操作部门')}>
              {detail.operationDeptId ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.createdAt', '操作时间')}>
              {detail.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label={t('system.operationLogs.column.context', '上下文')}>
              <Typography.Paragraph copyable className="trueadmin-operation-log-context">
                {JSON.stringify(detail.context ?? {}, null, 2)}
              </Typography.Paragraph>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </>
  );
}
