import { EyeOutlined } from '@ant-design/icons';
import { useMemo } from 'react';
import { TrueAdminCrudPage, useCrudRecordDetail } from '@/core/crud';
import type { CrudColumns, CrudFilterSchema } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { operationLogApi } from '../../services/log.api';
import type { AdminOperationLog } from '../../types/log';
import { OperationLogDetailDrawer } from './OperationLogDetailDrawer';

export default function AdminOperationLogsPage() {
  const { t } = useI18n();
  const detail = useCrudRecordDetail<AdminOperationLog>({ load: operationLogApi.detail });

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
        key: 'createdAt',
        width: 180,
        sorter: true,
      },
    ],
    [t],
  );

  const filters = useMemo<CrudFilterSchema[]>(
    () => [
      { name: 'module', label: t('system.operationLogs.column.module', '模块'), type: 'input' },
      { name: 'action', label: t('system.operationLogs.column.action', '动作'), type: 'input' },
      {
        name: 'operatorId',
        label: t('system.operationLogs.column.operatorId', '操作者 ID'),
        type: 'input',
      },
      {
        name: 'createdAt',
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
        rowActions={{
          presets: ['detail'],
          width: 108,
          overrides: {
            detail: {
              icon: <EyeOutlined />,
              onClick: ({ record }) => void detail.openRecord(record.id, { initialRecord: record }),
            },
          },
        }}
        toolbarProps={{
          quickSearchInputProps: { allowClear: true },
          reloadButtonProps: { title: t('crud.action.reload', '刷新') },
        }}
        tableProps={{ size: 'middle' }}
        paginationProps={{ showQuickJumper: true }}
        tableScrollX={1280}
      />
      <OperationLogDetailDrawer
        detail={detail.record}
        loading={detail.loading}
        open={detail.open}
        t={t}
        onClose={detail.close}
      />
    </>
  );
}
