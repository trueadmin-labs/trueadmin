import { EyeOutlined } from '@ant-design/icons';
import { Button, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { Permission } from '@/core/auth/Permission';
import { TrueAdminCrudPage, useCrudRecordDetail } from '@/core/crud';
import type { CrudColumns, CrudFilterSchema } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { loginLogApi } from '../../services/log.api';
import type { AdminLoginLog } from '../../types/log';
import { LoginLogDetailDrawer } from './LoginLogDetailDrawer';

export default function AdminLoginLogsPage() {
  const { t } = useI18n();
  const detail = useCrudRecordDetail<AdminLoginLog>({ load: loginLogApi.detail });
  const statusText = useMemo<Record<string, string>>(
    () => ({
      failed: t('system.loginLogs.status.failed', '失败'),
      success: t('system.loginLogs.status.success', '成功'),
    }),
    [t],
  );

  const columns = useMemo<CrudColumns<AdminLoginLog>>(
    () => [
      { title: 'ID', dataIndex: 'id', width: 88, sorter: true },
      { title: t('system.loginLogs.column.username', '用户名'), dataIndex: 'username', width: 160 },
      {
        title: t('system.loginLogs.column.status', '状态'),
        dataIndex: 'status',
        width: 100,
        render: (_, record) => (
          <Tag color={record.status === 'success' ? 'success' : 'error'}>
            {statusText[record.status] ?? record.status}
          </Tag>
        ),
      },
      { title: t('system.loginLogs.column.ip', 'IP 地址'), dataIndex: 'ip', width: 160 },
      {
        title: t('system.loginLogs.column.reason', '原因'),
        dataIndex: 'reason',
        width: 160,
        render: (_, record) => record.reason || '-',
      },
      {
        title: t('system.loginLogs.column.userAgent', 'User-Agent'),
        dataIndex: 'userAgent',
        width: 360,
        render: (_, record) => (
          <Typography.Text ellipsis={{ tooltip: record.userAgent }}>
            {record.userAgent || '-'}
          </Typography.Text>
        ),
      },
      {
        title: t('system.loginLogs.column.createdAt', '登录时间'),
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        sorter: true,
      },
    ],
    [statusText, t],
  );

  const filters = useMemo<CrudFilterSchema[]>(
    () => [
      {
        name: 'status',
        label: t('system.loginLogs.column.status', '状态'),
        type: 'select',
        options: [
          { label: statusText.success, value: 'success' },
          { label: statusText.failed, value: 'failed' },
        ],
      },
      {
        name: 'createdAt',
        label: t('system.loginLogs.column.createdAt', '登录时间'),
        type: 'dateRange',
      },
    ],
    [statusText, t],
  );

  return (
    <>
      <TrueAdminCrudPage<AdminLoginLog>
        title={t('system.loginLogs.title', '登录日志')}
        description={t('system.loginLogs.description', '查看后台账号登录成功、失败和访问来源。')}
        resource="system.login-log"
        rowKey="id"
        columns={columns}
        filters={filters}
        service={loginLogApi}
        quickSearch={{
          placeholder: t(
            'system.loginLogs.quickSearch.placeholder',
            '搜索用户名 / IP / User-Agent',
          ),
        }}
        rowActions={{
          delete: false,
          width: 108,
          render: ({ record }) => (
            <Permission code="system:login-log:detail">
              <Button
                icon={<EyeOutlined />}
                size="small"
                type="link"
                onClick={() => void detail.openRecord(record.id, { initialRecord: record })}
              >
                {t('crud.action.detail', '详情')}
              </Button>
            </Permission>
          ),
        }}
        toolbarProps={{
          quickSearchInputProps: { allowClear: true },
          reloadButtonProps: { title: t('crud.action.reload', '刷新') },
        }}
        tableProps={{ size: 'middle' }}
        paginationProps={{ showQuickJumper: true }}
        tableScrollX={1240}
      />
      <LoginLogDetailDrawer
        detail={detail.record}
        loading={detail.loading}
        open={detail.open}
        statusText={statusText}
        t={t}
        onClose={detail.close}
      />
    </>
  );
}
