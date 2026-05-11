import { CloudUploadOutlined } from '@ant-design/icons';
import { App, Button, Form } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud';
import type { CrudExtraQuerySchema, CrudFilterSchema, CrudService } from '@/core/crud/types';
import { errorCenter } from '@/core/error/errorCenter';
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
import { AnnouncementRowActions } from './AnnouncementRowActions';
import { AnnouncementStatusFilter } from './AnnouncementStatusFilter';
import { createAnnouncementColumns } from './AnnouncementTableColumns';
import {
  type AnnouncementFormValues,
  type AnnouncementSubmitMode,
  getInitialAnnouncementValues,
  toMinuteDateTime,
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

  const extraQuery = useMemo<CrudExtraQuerySchema[]>(
    () => [
      {
        name: 'status',
        transform: ({ value }) => ({ filter: { status: value }, op: { status: '=' } }),
      },
    ],
    [],
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

  const columns = useMemo(
    () => createAnnouncementColumns({ levelText, statusText, targetTypeText, t }),
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
        extraQuery={extraQuery}
        extra={
          <Button type="primary" icon={<CloudUploadOutlined />} onClick={openCreate}>
            {t('system.announcementManagement.action.createAnnouncement', '发布公告')}
          </Button>
        }
        rowActions={{
          width: 190,
          render: ({ record, action }) => (
            <AnnouncementRowActions
              action={action}
              record={record}
              t={t}
              onDetail={(nextRecord) => {
                setDetail(nextRecord);
                setDetailOpen(true);
              }}
              onEdit={openEdit}
            />
          ),
        }}
        toolbarRender={({ query, response }) => (
          <AnnouncementStatusFilter
            query={query}
            response={response}
            statusText={statusText}
            t={t}
          />
        )}
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
