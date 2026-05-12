import { errorCenter } from '@trueadmin/web-core/error';
import { App, Form } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useCrudRecordDetail } from '@/core/crud';
import type { CrudExtraQuerySchema, CrudFilterSchema, CrudService } from '@/core/crud/types';
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
import { createAnnouncementColumns } from './AnnouncementTableColumns';
import {
  type AnnouncementFormValues,
  type AnnouncementSubmitMode,
  getInitialAnnouncementValues,
  toMinuteDateTime,
} from './announcementManagementModel';

export function useAnnouncementManagementPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [roleOptions, setRoleOptions] = useState<Array<{ label: string; value: number }>>([]);
  const [roleOptionsLoading, setRoleOptionsLoading] = useState(false);
  const [form] = Form.useForm<AnnouncementFormValues>();
  const editRecord = useCrudRecordDetail<AdminAnnouncement>({
    load: (id) => adminNotificationManagementApi.detailAnnouncement(Number(id)).send(),
  });
  const detailRecord = useCrudRecordDetail<AdminAnnouncement>({
    load: (id) => adminNotificationManagementApi.detailAnnouncement(Number(id)).send(),
  });
  const editing = createOpen ? undefined : editRecord.record;
  const open = createOpen || editRecord.open;
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
  }, []);

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
        requestMode: 'filter',
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

  useEffect(() => {
    if (!editRecord.open || !editing) {
      return;
    }

    form.setFieldsValue({
      attachments: editing.attachments ?? [],
      content: editing.content,
      expireAt: editing.expireAt ? dayjs(editing.expireAt) : null,
      level: editing.level,
      pinned: editing.pinned ?? false,
      scheduledAt: editing.scheduledAt ? dayjs(editing.scheduledAt) : null,
      targetRoleIds: editing.targetRoleIds ?? [],
      targetType: editing.targetType,
      title: editing.title,
    });
  }, [editRecord.open, editing, form]);

  const openCreate = () => {
    editRecord.close();
    setCreateOpen(true);
    form.resetFields();
    form.setFieldsValue(getInitialAnnouncementValues());
  };

  const openEdit = (record: AdminAnnouncement) => {
    setCreateOpen(false);
    form.resetFields();
    void editRecord.openRecord(record.id, { initialRecord: record });
  };

  const openDetail = (record: AdminAnnouncement) => {
    void detailRecord.openRecord(record.id, { initialRecord: record });
  };

  const closeDetail = () => detailRecord.close();

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

    setCreateOpen(false);
    editRecord.close();
    form.resetFields();
    setRefreshSeed((seed) => seed + 1);
  };

  const closeModal = () => {
    setCreateOpen(false);
    editRecord.close();
    form.resetFields();
  };

  return {
    closeDetail,
    closeModal,
    columns,
    detail: detailRecord.record,
    detailLoading: detailRecord.loading,
    detailOpen: detailRecord.open,
    editing,
    editLoading: editRecord.loading,
    extraQuery,
    filters,
    form,
    levelText,
    metadataOnlyEdit,
    open,
    openCreate,
    openDetail,
    openEdit,
    roleOptions,
    roleOptionsLoading,
    service,
    statusText,
    submit,
    t,
    targetTypeText,
  };
}
