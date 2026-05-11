import { CloudUploadOutlined } from '@ant-design/icons';
import { App, Button, Form, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { TrueAdminConfirmAction } from '@/core/action';
import { TrueAdminCrudPage } from '@/core/crud';
import type {
  CrudColumns,
  CrudExtraQuerySchema,
  CrudFilterSchema,
  CrudService,
} from '@/core/crud/types';
import { errorCenter } from '@/core/error/errorCenter';
import { TrueAdminQuickFilter } from '@/core/filter/TrueAdminQuickFilter';
import { useI18n } from '@/core/i18n/I18nProvider';
import {
  type AdminAnnouncement,
  type AdminAnnouncementListMeta,
  type AdminAnnouncementStatus,
  type AdminAnnouncementTargetType,
  type AdminAnnouncementUpdatePayload,
  type AdminMessageLevel,
  adminNotificationManagementApi,
  getAdminMessageSourceConfig,
  getRegisteredAdminMessageSources,
  resolveAdminMessageLabel,
} from '@/core/notification';
import { roleApi } from '../../services/role.api';
import { AnnouncementDetailModal } from './AnnouncementDetailModal';
import { AnnouncementFormModal } from './AnnouncementFormModal';
import {
  type AnnouncementFormValues,
  type AnnouncementSubmitMode,
  announcementStatusColor,
  getInitialAnnouncementValues,
  levelColor,
  toMinuteDateTime,
  toPlainText,
} from './announcementManagementModel';

export default function AdminAnnouncementManagementPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAnnouncement>();
  const [detail, setDetail] = useState<AdminAnnouncement>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [roleOptions, setRoleOptions] = useState<Array<{ label: string; value: number }>>([]);
  const [roleOptionsLoading, setRoleOptionsLoading] = useState(false);
  const [form] = Form.useForm<AnnouncementFormValues>();
  const metadataOnlyEdit = editing
    ? editing.status === 'active' || editing.status === 'expired'
    : false;

  useEffect(() => {
    let mounted = true;
    setRoleOptionsLoading(true);
    roleApi
      .options()
      .then((roles) => {
        if (mounted) {
          setRoleOptions(roles.map((role) => ({ label: role.name, value: role.id })));
        }
      })
      .catch((error) => {
        if (mounted) {
          errorCenter.emit(error);
        }
      })
      .finally(() => {
        if (mounted) {
          setRoleOptionsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [message, t]);

  const levelText = useMemo<Record<AdminMessageLevel, string>>(
    () => ({
      error: t('notification.level.error', '错误'),
      info: t('notification.level.info', '提示'),
      success: t('notification.level.success', '成功'),
      warning: t('notification.level.warning', '警告'),
    }),
    [t],
  );

  const statusText = useMemo<Record<AdminAnnouncementStatus, string>>(
    () => ({
      active: t('system.announcementManagement.status.active', '已发布'),
      draft: t('system.announcementManagement.status.draft', '草稿'),
      expired: t('system.announcementManagement.status.expired', '已过期'),
      offline: t('system.announcementManagement.status.offline', '已下线'),
      scheduled: t('system.announcementManagement.status.scheduled', '定时发布'),
    }),
    [t],
  );

  const targetTypeText = useMemo<Record<AdminAnnouncementTargetType, string>>(
    () => ({
      all: t('system.announcementManagement.target.all', '全员'),
      role: t('system.announcementManagement.target.role', '指定角色'),
    }),
    [t],
  );

  const sourceOptions = useMemo(
    () =>
      getRegisteredAdminMessageSources().map((source) => ({
        label: resolveAdminMessageLabel(getAdminMessageSourceConfig(source)?.label, t, source),
        value: source,
      })),
    [t],
  );

  const filters = useMemo<CrudFilterSchema[]>(
    () => [
      {
        label: t('system.messages.level.placeholder', '等级'),
        name: 'level',
        options: Object.entries(levelText).map(([value, label]) => ({ label, value })),
        placeholder: t('system.messages.level.placeholder', '等级'),
        type: 'select',
      },
      {
        label: t('notification.detail.source', '来源'),
        name: 'source',
        options: sourceOptions,
        placeholder: t('notification.detail.source', '来源'),
        type: 'select',
      },
    ],
    [levelText, sourceOptions, t],
  );

  const service = useMemo<
    CrudService<
      AdminAnnouncement,
      Partial<AdminAnnouncement>,
      Partial<AdminAnnouncement>,
      AdminAnnouncementListMeta
    >
  >(
    () => ({
      list: async (params, options) =>
        adminNotificationManagementApi.listAnnouncements(params).send(options?.force),
    }),
    [refreshSeed],
  );

  const columns = useMemo<CrudColumns<AdminAnnouncement>>(
    () => [
      {
        dataIndex: 'title',
        fixed: 'left',
        render: (_, record) => {
          const summary = toPlainText(record.content);
          return (
            <div className="trueadmin-message-cell">
              <div className="trueadmin-message-cell-type">
                <Tag color="purple" style={{ marginInlineEnd: 0 }}>
                  {t('notification.type.announcement', '公告')}
                </Tag>
              </div>
              <Space orientation="vertical" size={4} style={{ minWidth: 0 }}>
                <Space size={6} wrap>
                  <Typography.Text strong>{record.title}</Typography.Text>
                  {record.pinned ? (
                    <Tag color="gold">{t('notification.pinned', '置顶')}</Tag>
                  ) : null}
                </Space>
                {summary ? (
                  <Typography.Text type="secondary" ellipsis>
                    {summary}
                  </Typography.Text>
                ) : null}
              </Space>
            </div>
          );
        },
        title: t('system.messages.column.title', '消息'),
        width: 560,
      },
      {
        dataIndex: 'status',
        render: (_, record) => (
          <Tag color={announcementStatusColor[record.status]}>{statusText[record.status]}</Tag>
        ),
        title: t('system.announcementManagement.column.status', '状态'),
        width: 120,
      },
      {
        dataIndex: 'level',
        render: (_, record) => (
          <Tag color={levelColor[record.level]}>{levelText[record.level]}</Tag>
        ),
        title: t('system.messages.column.level', '等级'),
        width: 110,
      },
      {
        dataIndex: 'targetSummary',
        render: (_, record) => (
          <Space orientation="vertical" size={2}>
            <Typography.Text>{record.targetSummary}</Typography.Text>
            <Typography.Text type="secondary">{targetTypeText[record.targetType]}</Typography.Text>
          </Space>
        ),
        title: t('system.announcementManagement.column.target', '可见范围'),
        width: 180,
      },
      {
        dataIndex: 'readTotal',
        title: t('system.announcementManagement.stats.read', '已读'),
        width: 100,
      },
      {
        dataIndex: 'operatorName',
        title: t('system.announcementManagement.column.operator', '操作人'),
        width: 130,
      },
      {
        dataIndex: 'publishedAt',
        key: 'publish_at',
        render: (_, record) => record.publishedAt ?? record.scheduledAt ?? '-',
        sorter: true,
        title: t('system.announcementManagement.column.publishedAt', '发布时间'),
        width: 180,
      },
    ],
    [levelText, statusText, t, targetTypeText],
  );

  const openCreate = () => {
    setEditing(undefined);
    form.resetFields();
    form.setFieldsValue(getInitialAnnouncementValues());
    setOpen(true);
  };

  const openEdit = (record: AdminAnnouncement) => {
    setEditing(record);
    form.setFieldsValue({
      attachments: record.attachments ?? [],
      content: record.content,
      expireAt: record.expireAt ? dayjs(record.expireAt) : null,
      level: record.level,
      pinned: record.pinned ?? false,
      scheduledAt: record.scheduledAt ? dayjs(record.scheduledAt) : null,
      targetRoleIds: record.targetRoleIds ?? [],
      targetType: record.targetType,
      title: record.title,
    });
    setOpen(true);
  };

  const submit = async (mode: AnnouncementSubmitMode = 'publish') => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      expireAt: toMinuteDateTime(values.expireAt),
      publishMode: editing ? undefined : mode,
      scheduledAt: toMinuteDateTime(values.scheduledAt),
    } as AdminAnnouncementUpdatePayload;

    if (editing) {
      await adminNotificationManagementApi.updateAnnouncement(editing.id, payload).send();
      message.success(t('system.announcementManagement.success.updateAnnouncement', '公告已保存'));
    } else {
      await adminNotificationManagementApi.createAnnouncement(payload).send();
      message.success(
        mode === 'draft'
          ? t('system.announcementManagement.success.saveDraft', '草稿已保存')
          : t('system.announcementManagement.success.createAnnouncement', '公告已创建'),
      );
    }

    setOpen(false);
    setEditing(undefined);
    form.resetFields();
    setRefreshSeed((seed) => seed + 1);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(undefined);
    form.resetFields();
  };

  return (
    <>
      <TrueAdminCrudPage<
        AdminAnnouncement,
        Partial<AdminAnnouncement>,
        Partial<AdminAnnouncement>,
        AdminAnnouncementListMeta
      >
        title={t('system.announcementManagement.title', '公告管理')}
        description={t(
          'system.announcementManagement.description',
          '管理后台公告、定时发布、置顶和可见范围。',
        )}
        resource="system.announcementManagement"
        rowKey="id"
        columns={columns}
        service={service}
        quickSearch={{
          placeholder: t(
            'system.announcementManagement.keyword.placeholder',
            '搜索标题 / 内容 / 操作人',
          ),
        }}
        filters={filters}
        extraQuery={useMemo<CrudExtraQuerySchema[]>(
          () => [
            {
              name: 'status',
              transform: ({ value }) => ({ filter: { status: value }, op: { status: '=' } }),
            },
          ],
          [],
        )}
        extra={
          <Button type="primary" icon={<CloudUploadOutlined />} onClick={openCreate}>
            {t('system.announcementManagement.action.createAnnouncement', '发布公告')}
          </Button>
        }
        rowActions={{
          width: 190,
          render: ({ record, action }) => (
            <Space size={4} wrap>
              <Button
                size="small"
                type="link"
                onClick={() => {
                  setDetail(record);
                  setDetailOpen(true);
                }}
              >
                {t('system.announcementManagement.action.detail', '详情')}
              </Button>
              {['draft', 'scheduled', 'active', 'expired'].includes(record.status) ? (
                <Button size="small" type="link" onClick={() => openEdit(record)}>
                  {t('system.announcementManagement.action.edit', '编辑')}
                </Button>
              ) : null}
              {record.status === 'draft' || record.status === 'scheduled' ? (
                <TrueAdminConfirmAction
                  size="small"
                  type="link"
                  confirm={t('system.announcementManagement.confirm.publish', '确认发布该公告吗？')}
                  successMessage={t('system.announcementManagement.success.publish', '公告已发布')}
                  action={async () => {
                    await adminNotificationManagementApi.publishAnnouncement(record.id).send();
                    action.reload();
                  }}
                >
                  {t('system.announcementManagement.action.publish', '发布')}
                </TrueAdminConfirmAction>
              ) : null}
              {record.status === 'scheduled' ? (
                <TrueAdminConfirmAction
                  danger
                  size="small"
                  type="link"
                  confirm={t(
                    'system.announcementManagement.confirm.cancelScheduled',
                    '取消后会退回草稿状态。',
                  )}
                  successMessage={t(
                    'system.announcementManagement.success.cancelScheduled',
                    '定时发布已取消',
                  )}
                  action={async () => {
                    await adminNotificationManagementApi
                      .cancelScheduledAnnouncement(record.id)
                      .send();
                    action.reload();
                  }}
                >
                  {t('system.announcementManagement.action.cancelScheduled', '取消')}
                </TrueAdminConfirmAction>
              ) : null}
              {record.status === 'draft' ? (
                <TrueAdminConfirmAction
                  danger
                  size="small"
                  type="link"
                  confirm={t(
                    'system.announcementManagement.confirm.deleteDraft',
                    '删除后不可恢复。',
                  )}
                  successMessage={t(
                    'system.announcementManagement.success.deleteDraft',
                    '草稿已删除',
                  )}
                  action={async () => {
                    await adminNotificationManagementApi.deleteDraftAnnouncement(record.id).send();
                    action.reload();
                  }}
                >
                  {t('system.announcementManagement.action.delete', '删除')}
                </TrueAdminConfirmAction>
              ) : null}
              {record.status === 'active' ? (
                <TrueAdminConfirmAction
                  danger
                  size="small"
                  type="link"
                  confirm={t('system.announcementManagement.confirm.offline', '确认下线该公告吗？')}
                  successMessage={t('system.announcementManagement.success.offline', '公告已下线')}
                  action={async () => {
                    await adminNotificationManagementApi.offlineAnnouncement(record.id).send();
                    action.reload();
                  }}
                >
                  {t('system.announcementManagement.action.offline', '下线')}
                </TrueAdminConfirmAction>
              ) : null}
              {record.status === 'offline' || record.status === 'expired' ? (
                <TrueAdminConfirmAction
                  size="small"
                  type="link"
                  confirm={t('system.announcementManagement.confirm.restore', '确认恢复该公告吗？')}
                  successMessage={t('system.announcementManagement.success.restore', '公告已恢复')}
                  action={async () => {
                    await adminNotificationManagementApi.restoreAnnouncement(record.id).send();
                    action.reload();
                  }}
                >
                  {t('system.announcementManagement.action.restore', '恢复')}
                </TrueAdminConfirmAction>
              ) : null}
            </Space>
          ),
        }}
        toolbarRender={({ query, response }) => {
          const currentStatus =
            (query.values.status as AdminAnnouncementStatus | undefined) ?? 'all';
          const scheduledCount = response?.meta?.statusStats?.scheduled ?? 0;
          return (
            <TrueAdminQuickFilter<AdminAnnouncementStatus | 'all'>
              value={currentStatus}
              items={[
                { label: t('notification.tab.all', '全部'), value: 'all' },
                { label: statusText.draft, value: 'draft' },
                { count: scheduledCount, label: statusText.scheduled, value: 'scheduled' },
                { label: statusText.active, value: 'active' },
                { label: statusText.expired, value: 'expired' },
                { label: statusText.offline, value: 'offline' },
              ]}
              onChange={(nextStatus) =>
                query.setValue('status', nextStatus === 'all' ? undefined : nextStatus)
              }
            />
          );
        }}
        tableProps={{ size: 'middle' }}
        paginationProps={{ showQuickJumper: true }}
        tableScrollX={1180}
      />

      <AnnouncementFormModal
        editing={editing}
        form={form}
        levelText={levelText}
        metadataOnlyEdit={metadataOnlyEdit}
        open={open}
        roleOptions={roleOptions}
        roleOptionsLoading={roleOptionsLoading}
        t={t}
        targetTypeText={targetTypeText}
        onClose={closeModal}
        onSubmit={(mode) => void submit(mode)}
      />

      <AnnouncementDetailModal
        open={detailOpen}
        announcement={detail}
        statusText={statusText}
        levelText={levelText}
        targetTypeText={targetTypeText}
        onClose={() => setDetailOpen(false)}
        afterOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDetail(undefined);
          }
        }}
      />
    </>
  );
}
