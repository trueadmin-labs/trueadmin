import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { TableProps } from 'antd';
import { App, Button, Select, Space, Table, Tag, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrueAdminModal } from '@/core/modal';
import { adminUserApi } from '../../services/admin-user.api';
import { positionApi } from '../../services/position.api';
import type { AdminUser } from '../../types/admin-user';
import type { AdminPosition } from '../../types/position';

type PositionMembersModalProps = {
  open: boolean;
  position?: AdminPosition;
  statusText: Record<AdminPosition['status'], string>;
  t: TranslateFunction;
  onCancel: () => void;
  onSaved?: () => void;
};

const DEFAULT_PAGE_SIZE = 10;
const MEMBER_CANDIDATE_LIMIT = 100;

export function PositionMembersModal({
  open,
  position,
  statusText,
  t,
  onCancel,
  onSaved,
}: PositionMembersModalProps) {
  const { message } = App.useApp();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [candidateItems, setCandidateItems] = useState<AdminUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const positionId = position?.id;

  const loadMembers = useCallback(async () => {
    if (!open || !position) {
      return;
    }

    setLoading(true);
    try {
      const [members, memberIds, candidates] = await Promise.all([
        adminUserApi.list(
          {
            page,
            pageSize,
            params: { positionId: position.id },
          },
          { force: true },
        ),
        positionApi.memberIds(position.id),
        adminUserApi.list(
          {
            page: 1,
            pageSize: MEMBER_CANDIDATE_LIMIT,
            params: { deptId: position.deptId },
          },
          { force: true },
        ),
      ]);
      setItems(members.items);
      setCandidateItems(candidates.items);
      setSelectedUserIds(memberIds);
      setTotal(members.total);
    } finally {
      setLoading(false);
    }
  }, [open, page, pageSize, position]);

  useEffect(() => {
    if (!open) {
      setItems([]);
      setCandidateItems([]);
      setSelectedUserIds([]);
      setTotal(0);
      setPage(1);
      return;
    }

    void loadMembers();
  }, [loadMembers, open]);

  useEffect(() => {
    if (open && positionId) {
      setPage(1);
    }
  }, [open, positionId]);

  const userOptions = useMemo(() => {
    const candidates = new Map<number, AdminUser>();
    for (const user of [...candidateItems, ...items]) {
      candidates.set(user.id, user);
    }

    return Array.from(candidates.values()).map((user) => ({
      label: `${user.nickname || user.username} (${user.username})`,
      value: user.id,
    }));
  }, [candidateItems, items]);

  const saveMembers = async () => {
    if (!position) {
      return;
    }

    setSaving(true);
    try {
      await positionApi.syncMembers(position.id, selectedUserIds);
      message.success(t('system.positions.members.success', '岗位成员已保存'));
      await loadMembers();
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<TableProps<AdminUser>['columns']>(
    () => [
      {
        title: t('system.users.column.username', '用户名'),
        dataIndex: 'username',
        width: 160,
      },
      {
        title: t('system.users.column.nickname', '昵称'),
        dataIndex: 'nickname',
        width: 160,
      },
      {
        title: t('system.users.form.primaryDeptId', '主部门'),
        dataIndex: 'primaryDeptName',
        width: 160,
      },
      {
        title: t('system.users.column.roles', '有效角色'),
        dataIndex: 'roleNames',
        render: (_, record) =>
          record.roleNames.length > 0 ? (
            record.roleNames.map((role) => <Tag key={role}>{role}</Tag>)
          ) : (
            <Typography.Text type="secondary">
              {t('system.users.column.roles.empty', '无')}
            </Typography.Text>
          ),
      },
      {
        title: t('system.users.column.status', '状态'),
        dataIndex: 'status',
        width: 100,
        render: (_, record) => (
          <Tag color={record.status === 'enabled' ? 'success' : 'default'}>
            {statusText[record.status]}
          </Tag>
        ),
      },
    ],
    [statusText, t],
  );

  return (
    <TrueAdminModal
      destroyOnHidden
      open={open}
      title={
        position
          ? `${t('system.positions.members.title', '岗位成员')} - ${position.name}`
          : t('system.positions.members.title', '岗位成员')
      }
      width={860}
      footer={
        <Space>
          <Button onClick={onCancel}>{t('crud.action.cancel', '取消')}</Button>
          <Button type="primary" loading={saving} onClick={() => void saveMembers()}>
            {t('crud.action.save', '保存')}
          </Button>
        </Space>
      }
      onCancel={onCancel}
    >
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Select
          mode="multiple"
          allowClear
          showSearch
          disabled={!position}
          loading={loading}
          optionFilterProp="label"
          options={userOptions}
          placeholder={t('system.positions.members.assignPlaceholder', '选择岗位成员')}
          style={{ width: '100%' }}
          value={selectedUserIds}
          onChange={(value) => setSelectedUserIds(value.map((item) => Number(item)))}
        />
        <Typography.Text type="secondary">
          {t(
            'system.positions.members.assignHint',
            '候选成员来自岗位所属部门；移除成员时，系统会确保该成员在所属部门仍至少保留一个岗位。',
          )}
        </Typography.Text>
      </Space>
      <Table<AdminUser>
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          showSizeChanger: true,
          total,
        }}
        scroll={{ x: 760 }}
        size="middle"
        onChange={(pagination) => {
          setPage(pagination.current ?? 1);
          setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE);
        }}
        style={{ marginTop: 16 }}
      />
    </TrueAdminModal>
  );
}
