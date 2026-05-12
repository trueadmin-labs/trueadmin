import { ApartmentOutlined, TeamOutlined } from '@ant-design/icons';
import { TrueAdminTreeFilter, type TrueAdminTreeFilterItem } from '@trueadmin/web-antd/filter';
import { TrueAdminRemoteSelect } from '@trueadmin/web-antd/remote-select';
import { App, Button, Card, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import type { CrudColumns, CrudService } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';
import { TrueAdminRemoteTableSelect, TrueAdminTablePicker } from '@/core/selector';

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

type SelectorExampleUser = {
  id: number;
  name: string;
  username: string;
  department: 'product' | 'finance' | 'ops';
  status: 'enabled' | 'disabled';
};

const users: SelectorExampleUser[] = Array.from({ length: 48 }, (_, index) => {
  const departments: SelectorExampleUser['department'][] = ['product', 'finance', 'ops'];
  const names = ['陈明', '李娜', '王强', '赵敏', '周扬', '林乔'];
  const department = departments[index % departments.length];
  return {
    id: index + 1,
    name: `${names[index % names.length]} ${index + 1}`,
    username: `user${String(index + 1).padStart(2, '0')}`,
    department,
    status: index % 7 === 0 ? 'disabled' : 'enabled',
  };
});

const departmentItems: Array<TrueAdminTreeFilterItem<string>> = [
  { icon: <ApartmentOutlined />, label: '全部组织', value: 'all' },
  { label: '产品中心', value: 'product' },
  { label: '财务中心', value: 'finance' },
  { label: '运营中心', value: 'ops' },
];

const departmentText: Record<SelectorExampleUser['department'], string> = {
  finance: '财务中心',
  ops: '运营中心',
  product: '产品中心',
};

const statusText: Record<SelectorExampleUser['status'], string> = {
  disabled: '禁用',
  enabled: '启用',
};

const createUserService = (department: string): CrudService<SelectorExampleUser> => ({
  list: async (params) => {
    await wait(220);
    const keyword = String(params.keyword ?? '')
      .trim()
      .toLowerCase();
    const page = Number(params.page ?? 1);
    const pageSize = Number(params.pageSize ?? 20);
    const filtered = users.filter((user) => {
      const matchedDepartment = department === 'all' || user.department === department;
      const matchedKeyword = keyword
        ? `${user.name} ${user.username}`.toLowerCase().includes(keyword)
        : true;
      return matchedDepartment && matchedKeyword;
    });
    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      meta: {},
      page,
      pageSize,
      total: filtered.length,
    };
  },
});

export default function SelectorExamplePage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [selectValue, setSelectValue] = useState<number>();
  const [selectUser, setSelectUser] = useState<SelectorExampleUser>();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [department, setDepartment] = useState('all');
  const [pickerValues, setPickerValues] = useState<React.Key[]>([]);
  const [pickerUsers, setPickerUsers] = useState<SelectorExampleUser[]>([]);
  const [comboValue, setComboValue] = useState<number>();
  const [comboUser, setComboUser] = useState<SelectorExampleUser>();

  const columns = useMemo<CrudColumns<SelectorExampleUser>>(
    () => [
      { dataIndex: 'id', title: 'ID', width: 72 },
      {
        dataIndex: 'name',
        title: t('examples.selector.column.name', '姓名'),
        render: (_, record) => (
          <Space size={6}>
            <TeamOutlined />
            <span>{record.name}</span>
          </Space>
        ),
      },
      { dataIndex: 'username', title: t('examples.selector.column.username', '账号') },
      {
        dataIndex: 'department',
        title: t('examples.selector.column.department', '部门'),
        render: (value: SelectorExampleUser['department']) => departmentText[value],
      },
      {
        dataIndex: 'status',
        title: t('examples.selector.column.status', '状态'),
        width: 96,
        render: (value: SelectorExampleUser['status']) => (
          <Tag color={value === 'enabled' ? 'success' : 'default'}>{statusText[value]}</Tag>
        ),
      },
    ],
    [t],
  );

  const service = useMemo(() => createUserService(department), [department]);

  return (
    <TrueAdminPage
      title={t('examples.selector.title', '选择器示例')}
      description={t('examples.selector.description', '展示远程下拉选择和弹窗表格选择底座。')}
      contentAlign="center"
      contentWidth={920}
    >
      <Space orientation="vertical" size={12} className="trueadmin-example-stack">
        <Card size="small" title={t('examples.selector.remote.title', '远程下拉筛选')}>
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <TrueAdminRemoteSelect<SelectorExampleUser, number>
              allowClear
              placeholder={t('examples.selector.remote.placeholder', '搜索姓名或账号')}
              style={{ maxWidth: 360, width: '100%', marginInline: 'auto' }}
              value={selectValue}
              fetchByValues={async (values) => {
                await wait(160);
                return users.filter((user) => values.includes(user.id));
              }}
              fetchOptions={async ({ keyword }) => {
                await wait(220);
                const normalizedKeyword = keyword.trim().toLowerCase();
                return users
                  .filter((user) =>
                    `${user.name} ${user.username}`.toLowerCase().includes(normalizedKeyword),
                  )
                  .slice(0, 12);
              }}
              getLabel={(user) => `${user.name} / ${user.username}`}
              getValue={(user) => user.id}
              optionRender={(user) => (
                <Space size={8}>
                  <span>{user.name}</span>
                  <Typography.Text type="secondary">{user.username}</Typography.Text>
                  <Tag>{departmentText[user.department]}</Tag>
                </Space>
              )}
              onChange={(value, record) => {
                setSelectValue(value);
                setSelectUser(record);
              }}
            />
            <Typography.Text type="secondary">
              {selectUser
                ? t('examples.selector.remote.selected', '已选择：{{name}}').replace(
                    '{{name}}',
                    `${selectUser.name} / ${selectUser.username}`,
                  )
                : t('examples.selector.remote.empty', '暂未选择用户')}
            </Typography.Text>
          </Space>
        </Card>

        <Card size="small" title={t('examples.selector.combo.title', '下拉 + 表格选择')}>
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <TrueAdminRemoteTableSelect<SelectorExampleUser, number>
              allowClear
              placeholder={t('examples.selector.combo.placeholder', '搜索用户，或打开表格选择')}
              style={{ maxWidth: 420, width: '100%', marginInline: 'auto' }}
              value={comboValue}
              fetchByValues={async (values) => {
                await wait(160);
                return users.filter((user) => values.includes(user.id));
              }}
              fetchOptions={async ({ keyword }) => {
                await wait(220);
                const normalizedKeyword = keyword.trim().toLowerCase();
                return users
                  .filter((user) =>
                    `${user.name} ${user.username}`.toLowerCase().includes(normalizedKeyword),
                  )
                  .slice(0, 12);
              }}
              getLabel={(user) => `${user.name} / ${user.username}`}
              getValue={(user) => user.id}
              optionRender={(user) => (
                <Space size={8}>
                  <span>{user.name}</span>
                  <Typography.Text type="secondary">{user.username}</Typography.Text>
                  <Tag>{departmentText[user.department]}</Tag>
                </Space>
              )}
              pickerButtonTooltip={t('examples.selector.combo.openPicker', '打开表格选择')}
              picker={{
                title: t('examples.selector.combo.modalTitle', '选择用户'),
                rowKey: 'id',
                resource: 'true-admin.examples.selector.combo',
                columns,
                service,
                quickSearch: {
                  placeholder: t('examples.selector.table.quickSearch', '搜索姓名 / 账号'),
                },
                aside: (
                  <TrueAdminTreeFilter<string>
                    title={t('examples.selector.department.title', '组织目录')}
                    value={department}
                    items={departmentItems}
                    placeholder={t('examples.selector.department.placeholder', '搜索组织')}
                    onChange={(value) => setDepartment(value)}
                  />
                ),
              }}
              onChange={(value, record) => {
                setComboValue(value);
                setComboUser(record);
              }}
            />
            <Typography.Text type="secondary">
              {comboUser
                ? t('examples.selector.combo.selected', '已选择：{{name}}').replace(
                    '{{name}}',
                    `${comboUser.name} / ${comboUser.username}`,
                  )
                : t('examples.selector.combo.empty', '暂未选择用户')}
            </Typography.Text>
          </Space>
        </Card>

        <Card size="small" title={t('examples.selector.table.title', '弹窗表格选择')}>
          <Space orientation="vertical" size={12}>
            <Space wrap>
              <Button type="primary" onClick={() => setPickerOpen(true)}>
                {t('examples.selector.table.open', '打开表格选择器')}
              </Button>
              <Typography.Text type="secondary">
                {pickerUsers.length > 0
                  ? t('examples.selector.table.selected', '已选择 {{count}} 人').replace(
                      '{{count}}',
                      String(pickerUsers.length),
                    )
                  : t('examples.selector.table.empty', '暂未选择用户')}
              </Typography.Text>
            </Space>
            {pickerUsers.length > 0 ? (
              <Space wrap>
                {pickerUsers.map((user) => (
                  <Tag key={user.id}>{user.name}</Tag>
                ))}
              </Space>
            ) : null}
          </Space>
        </Card>
      </Space>

      <TrueAdminTablePicker<SelectorExampleUser>
        multiple
        open={pickerOpen}
        title={t('examples.selector.table.modalTitle', '选择用户')}
        value={pickerValues}
        rowKey="id"
        resource="true-admin.examples.selector"
        columns={columns}
        service={service}
        quickSearch={{ placeholder: t('examples.selector.table.quickSearch', '搜索姓名 / 账号') }}
        aside={
          <TrueAdminTreeFilter<string>
            title={t('examples.selector.department.title', '组织目录')}
            value={department}
            items={departmentItems}
            placeholder={t('examples.selector.department.placeholder', '搜索组织')}
            onChange={(value) => setDepartment(value)}
          />
        }
        onCancel={() => setPickerOpen(false)}
        onChange={(keys, rows) => {
          setPickerValues(keys);
          setPickerUsers(rows);
        }}
        onConfirm={(keys, rows) => {
          setPickerValues(keys);
          setPickerUsers(rows);
          setPickerOpen(false);
          message.success(
            t('examples.selector.table.confirmMessage', '已确认选择 {{count}} 人').replace(
              '{{count}}',
              String(rows.length),
            ),
          );
        }}
      />
    </TrueAdminPage>
  );
}
