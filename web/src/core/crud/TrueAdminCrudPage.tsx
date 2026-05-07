import { PlusOutlined } from '@ant-design/icons';
import { type ActionType, ProTable } from '@ant-design/pro-components';
import { App, Button, Popconfirm } from 'antd';
import { useRef } from 'react';
import { Permission } from '@/core/auth/Permission';
import { errorCenter } from '@/core/error/errorCenter';
import { useWorkspaceViewport } from '@/core/layout/WorkspaceViewport';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';
import type { CrudListParams, TrueAdminCrudPageProps } from './types';

const toPermissionCode = (resource: string, action: string) =>
  `${resource.replaceAll('.', ':')}:${action}`;

function TrueAdminCrudTable<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
>({
  resource,
  rowKey,
  columns,
  service,
}: Pick<
  TrueAdminCrudPageProps<TRecord, TCreate, TUpdate>,
  'resource' | 'rowKey' | 'columns' | 'service'
>) {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const { tableScrollY } = useWorkspaceViewport();

  const operationColumn = service.delete
    ? [
        {
          title: '操作',
          valueType: 'option' as const,
          width: 120,
          render: (_: unknown, record: TRecord) => (
            <Permission code={toPermissionCode(resource, 'delete')}>
              <Popconfirm
                title="确认删除这条记录吗？"
                onConfirm={async () => {
                  try {
                    await service.delete?.(record.id as React.Key);
                    message.success('删除成功');
                    actionRef.current?.reload();
                  } catch (error) {
                    errorCenter.emit(error);
                  }
                }}
              >
                <Button danger type="link" size="small">
                  删除
                </Button>
              </Popconfirm>
            </Permission>
          ),
        },
      ]
    : [];

  return (
    <ProTable<TRecord, CrudListParams>
      actionRef={actionRef}
      rowKey={rowKey as string}
      columns={[...columns, ...operationColumn]}
      search={{ labelWidth: 'auto' }}
      scroll={{ y: tableScrollY }}
      pagination={{ defaultPageSize: 20, showSizeChanger: true }}
      options={{ density: false, fullScreen: false, reload: true, setting: true }}
      toolBarRender={() => [
        service.create ? (
          <Permission key="create" code={toPermissionCode(resource, 'create')}>
            <Button type="primary" icon={<PlusOutlined />} disabled>
              新增
            </Button>
          </Permission>
        ) : null,
      ]}
      request={async (params, sort) => {
        const sortEntry = Object.entries(sort ?? {})[0];
        const result = await service.list({
          ...params,
          page: params.current,
          pageSize: params.pageSize,
          sort: sortEntry?.[0],
          order:
            sortEntry?.[1] === 'ascend' ? 'asc' : sortEntry?.[1] === 'descend' ? 'desc' : undefined,
        });

        return {
          data: result.items,
          total: result.total,
          success: true,
        };
      }}
    />
  );
}

export function TrueAdminCrudPage<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
>({
  title,
  resource,
  rowKey = 'id',
  columns,
  service,
  extra,
}: TrueAdminCrudPageProps<TRecord, TCreate, TUpdate>) {
  return (
    <TrueAdminPage
      title={title}
      extra={extra}
      layout="workspace"
      className="trueadmin-crud-page"
      bodyClassName="trueadmin-crud-page-body"
    >
      <TrueAdminCrudTable resource={resource} rowKey={rowKey} columns={columns} service={service} />
    </TrueAdminPage>
  );
}
