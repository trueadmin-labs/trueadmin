import { CloudUploadOutlined, SaveOutlined } from '@ant-design/icons';
import { App, Button, Collapse, DatePicker, Descriptions, Form, Input, Select, Space, Switch, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { TrueAdminConfirmAction } from '@/core/action';
import { TrueAdminCrudPage } from '@/core/crud';
import type { CrudColumns, CrudExtraQuerySchema, CrudFilterSchema, CrudService } from '@/core/crud/types';
import { TrueAdminQuickFilter } from '@/core/filter/TrueAdminQuickFilter';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminMarkdown, TrueAdminMarkdownEditor } from '@/core/markdown';
import { TrueAdminModal } from '@/core/modal';
import {
  type AdminMessageLevel,
  type AdminAnnouncement,
  type AdminAnnouncementCreatePayload,
  type AdminAnnouncementListMeta,
  type AdminAnnouncementStatus,
  type AdminAnnouncementUpdatePayload,
  type AdminAnnouncementTargetType,
  adminNotificationManagementApi,
  getAdminMessageSourceConfig,
  getRegisteredAdminMessageSources,
  resolveAdminMessageLabel,
} from '@/core/notification';
import { TrueAdminAuditTimeline, type TrueAdminAuditTimelineItem } from '@/core/timeline';
import { TrueAdminAttachmentUpload } from '@/core/upload';
import { adminUserApi } from '../../services/admin-user.api';

const levelColor: Record<AdminMessageLevel, string> = {
  error: 'error',
  info: 'processing',
  success: 'success',
  warning: 'warning',
};

const announcementStatusColor: Record<AdminAnnouncementStatus, string> = {
  active: 'success',
  draft: 'default',
  expired: 'default',
  offline: 'default',
  scheduled: 'processing',
};

const toPlainText = (value?: string) =>
  value
    ?.replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`\-[\]|()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

type AnnouncementFormValues = Partial<AdminAnnouncementCreatePayload>;

type AnnouncementSubmitMode = 'draft' | 'publish';

const getInitialAnnouncementValues = (): AnnouncementFormValues => ({
  attachments: [],
  content: undefined,
  expireAt: null,
  level: 'info',
  pinned: false,
  scheduledAt: null,
  targetRoleIds: undefined,
  targetType: 'all',
  title: undefined,
});

const toMinuteDateTime = (value: AnnouncementFormValues['scheduledAt']) => {
  if (!value) {
    return null;
  }

  return typeof value === 'string' ? value : value.format('YYYY-MM-DD HH:mm');
};

export default function AdminAnnouncementManagementPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAnnouncement>();
  const [detail, setDetail] = useState<AdminAnnouncement>();
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [roleOptions, setRoleOptions] = useState<Array<{ label: string; value: number }>>([]);
  const [roleOptionsLoading, setRoleOptionsLoading] = useState(false);
  const [form] = Form.useForm<AnnouncementFormValues>();
  const targetType = Form.useWatch('targetType', form);
  const metadataOnlyEdit = editing ? editing.status === 'active' || editing.status === 'expired' : false;

  useEffect(() => {
    let mounted = true;
    setRoleOptionsLoading(true);
    adminUserApi
      .roleOptions()
      .then((roles) => {
        if (mounted) {
          setRoleOptions(roles.map((role) => ({ label: role.name, value: role.id })));
        }
      })
      .catch(() => {
        if (mounted) {
          message.error(t('system.announcementManagement.roleOptions.loadFailed', '角色选项加载失败'));
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

  const service = useMemo<CrudService<AdminAnnouncement, Partial<AdminAnnouncement>, Partial<AdminAnnouncement>, AdminAnnouncementListMeta>>(
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
                  {record.pinned ? <Tag color="gold">{t('notification.pinned', '置顶')}</Tag> : null}
                </Space>
                {summary ? <Typography.Text type="secondary" ellipsis>{summary}</Typography.Text> : null}
              </Space>
            </div>
          );
        },
        title: t('system.messages.column.title', '消息'),
        width: 560,
      },
      {
        dataIndex: 'status',
        render: (_, record) => <Tag color={announcementStatusColor[record.status]}>{statusText[record.status]}</Tag>,
        title: t('system.announcementManagement.column.status', '状态'),
        width: 120,
      },
      {
        dataIndex: 'level',
        render: (_, record) => <Tag color={levelColor[record.level]}>{levelText[record.level]}</Tag>,
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
      message.success(mode === 'draft' ? t('system.announcementManagement.success.saveDraft', '草稿已保存') : t('system.announcementManagement.success.createAnnouncement', '公告已创建'));
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
      <TrueAdminCrudPage<AdminAnnouncement, Partial<AdminAnnouncement>, Partial<AdminAnnouncement>, AdminAnnouncementListMeta>
        title={t('system.announcementManagement.title', '公告管理')}
        description={t('system.announcementManagement.description', '管理后台公告、定时发布、置顶和可见范围。')}
        resource="system.announcementManagement"
        rowKey="id"
        columns={columns}
        service={service}
        quickSearch={{ placeholder: t('system.announcementManagement.keyword.placeholder', '搜索标题 / 内容 / 操作人') }}
        filters={filters}
        extraQuery={useMemo<CrudExtraQuerySchema[]>(() => [{ name: 'status' }], [])}
        extra={<Button type="primary" icon={<CloudUploadOutlined />} onClick={openCreate}>{t('system.announcementManagement.action.createAnnouncement', '发布公告')}</Button>}
        rowActions={{
          width: 190,
          render: ({ record, action }) => (
            <Space size={4} wrap>
              <Button size="small" type="link" onClick={() => setDetail(record)}>{t('system.announcementManagement.action.detail', '详情')}</Button>
              {['draft', 'scheduled', 'active', 'expired'].includes(record.status) ? (
                <Button size="small" type="link" onClick={() => openEdit(record)}>{t('system.announcementManagement.action.edit', '编辑')}</Button>
              ) : null}
              {record.status === 'draft' || record.status === 'scheduled' ? (
                <TrueAdminConfirmAction size="small" type="link" confirm={t('system.announcementManagement.confirm.publish', '确认发布该公告吗？')} successMessage={t('system.announcementManagement.success.publish', '公告已发布')} action={async () => { await adminNotificationManagementApi.publishAnnouncement(record.id).send(); action.reload(); }}>
                  {t('system.announcementManagement.action.publish', '发布')}
                </TrueAdminConfirmAction>
              ) : null}
              {record.status === 'scheduled' ? (
                <TrueAdminConfirmAction danger size="small" type="link" confirm={t('system.announcementManagement.confirm.cancelScheduled', '取消后会退回草稿状态。')} successMessage={t('system.announcementManagement.success.cancelScheduled', '定时发布已取消')} action={async () => { await adminNotificationManagementApi.cancelScheduledAnnouncement(record.id).send(); action.reload(); }}>
                  {t('system.announcementManagement.action.cancelScheduled', '取消')}
                </TrueAdminConfirmAction>
              ) : null}
              {record.status === 'draft' ? (
                <TrueAdminConfirmAction danger size="small" type="link" confirm={t('system.announcementManagement.confirm.deleteDraft', '删除后不可恢复。')} successMessage={t('system.announcementManagement.success.deleteDraft', '草稿已删除')} action={async () => { await adminNotificationManagementApi.deleteDraftAnnouncement(record.id).send(); action.reload(); }}>
                  {t('system.announcementManagement.action.delete', '删除')}
                </TrueAdminConfirmAction>
              ) : null}
              {record.status === 'active' ? (
                <TrueAdminConfirmAction danger size="small" type="link" confirm={t('system.announcementManagement.confirm.offline', '确认下线该公告吗？')} successMessage={t('system.announcementManagement.success.offline', '公告已下线')} action={async () => { await adminNotificationManagementApi.offlineAnnouncement(record.id).send(); action.reload(); }}>
                  {t('system.announcementManagement.action.offline', '下线')}
                </TrueAdminConfirmAction>
              ) : null}
              {record.status === 'offline' || record.status === 'expired' ? (
                <TrueAdminConfirmAction size="small" type="link" confirm={t('system.announcementManagement.confirm.restore', '确认恢复该公告吗？')} successMessage={t('system.announcementManagement.success.restore', '公告已恢复')} action={async () => { await adminNotificationManagementApi.restoreAnnouncement(record.id).send(); action.reload(); }}>
                  {t('system.announcementManagement.action.restore', '恢复')}
                </TrueAdminConfirmAction>
              ) : null}
            </Space>
          ),
        }}
        toolbarRender={({ query, response }) => {
          const currentStatus = (query.values.status as AdminAnnouncementStatus | undefined) ?? 'all';
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
              onChange={(nextStatus) => query.setValue('status', nextStatus === 'all' ? undefined : nextStatus)}
            />
          );
        }}
        tableProps={{ size: 'middle' }}
        paginationProps={{ showQuickJumper: true }}
        tableScrollX={1180}
      />

      <TrueAdminModal destroyOnHidden open={open} title={editing ? t('system.announcementManagement.modal.editAnnouncement', '编辑公告') : t('system.announcementManagement.modal.createAnnouncement', '发布公告')} width={760} footer={<Space><Button onClick={closeModal}>{t('modal.action.close', '关闭')}</Button>{!editing ? <Button icon={<SaveOutlined />} onClick={() => void submit('draft')}>{t('system.announcementManagement.action.saveDraft', '保存草稿')}</Button> : null}<Button type="primary" icon={editing ? <SaveOutlined /> : <CloudUploadOutlined />} onClick={() => void submit('publish')}>{editing ? t('system.announcementManagement.action.save', '保存') : t('system.announcementManagement.action.createAnnouncement', '发布公告')}</Button></Space>} onCancel={closeModal}>
        <Form<AnnouncementFormValues> form={form} layout="vertical" initialValues={getInitialAnnouncementValues()}>
          <Form.Item label={t('system.announcementManagement.form.title', '公告标题')} name="title" rules={[{ required: true }]}><Input disabled={metadataOnlyEdit} /></Form.Item>
          <Form.Item label={t('system.announcementManagement.form.content', '公告正文')} name="content" rules={[{ required: true }]}><TrueAdminMarkdownEditor disabled={metadataOnlyEdit} rows={8} placeholder={t('system.announcementManagement.form.content.placeholder', '请输入 Markdown 公告正文')} /></Form.Item>
          <Form.Item label={t('system.announcementManagement.form.attachments', '附件')} name="attachments"><TrueAdminAttachmentUpload disabled={metadataOnlyEdit} readonly={metadataOnlyEdit} multiple maxCount={8} title={t('system.announcementManagement.form.attachments.uploadTitle', '拖拽公告附件到这里，或点击选择')} hint={t('system.announcementManagement.form.attachments.uploadHint', '附件会随公告一起展示，支持编辑展示名称。')} /></Form.Item>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item label={t('system.announcementManagement.form.level', '公告等级')} name="level"><Select disabled={metadataOnlyEdit} style={{ width: 160 }} options={Object.entries(levelText).map(([value, label]) => ({ label, value }))} /></Form.Item>
            <Form.Item label={t('system.announcementManagement.form.targetType', '接收范围')} name="targetType"><Select disabled={metadataOnlyEdit} style={{ width: 180 }} options={[{ label: targetTypeText.all, value: 'all' }, { label: targetTypeText.role, value: 'role' }]} /></Form.Item>
          </Space>
          {targetType === 'role' ? <Form.Item label={t('system.announcementManagement.form.targetRoleIds', '目标角色')} name="targetRoleIds" rules={[{ required: true }]}><Select disabled={metadataOnlyEdit} mode="multiple" loading={roleOptionsLoading} options={roleOptions} /></Form.Item> : null}
          <Form.Item label={t('system.announcementManagement.form.pinned', '置顶公告')} name="pinned" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item label={t('system.announcementManagement.form.scheduledAt', '定时发布时间')} name="scheduledAt"><DatePicker disabled={metadataOnlyEdit} format="YYYY-MM-DD HH:mm" showTime={{ format: 'HH:mm' }} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label={t('system.announcementManagement.form.expireAt', '过期时间')} name="expireAt"><DatePicker format="YYYY-MM-DD HH:mm" showTime={{ format: 'HH:mm' }} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </TrueAdminModal>

      <AnnouncementDetailModal announcement={detail} statusText={statusText} levelText={levelText} targetTypeText={targetTypeText} onClose={() => setDetail(undefined)} />
    </>
  );
}

type AnnouncementDetailModalProps = {
  announcement?: AdminAnnouncement;
  statusText: Record<AdminAnnouncementStatus, string>;
  levelText: Record<AdminMessageLevel, string>;
  targetTypeText: Record<AdminAnnouncementTargetType, string>;
  onClose: () => void;
};

function AnnouncementDetailModal({ announcement, statusText, levelText, targetTypeText, onClose }: AnnouncementDetailModalProps) {
  const { t } = useI18n();
  const auditItems = useMemo<TrueAdminAuditTimelineItem[]>(() => {
    if (!announcement) {
      return [];
    }

    return [
      { color: 'blue', description: t('system.announcementManagement.audit.created.description', '公告已创建'), operator: announcement.operatorName, time: announcement.createdAt, title: t('system.announcementManagement.audit.created', '创建') },
      announcement.publishedAt ? { color: 'green', description: t('system.announcementManagement.audit.published.description', '公告已发布'), operator: announcement.operatorName, time: announcement.publishedAt, title: t('system.announcementManagement.audit.published', '发布') } : undefined,
      announcement.offlineAt ? { color: 'gray', description: t('system.announcementManagement.audit.offline.description', '公告已下线'), operator: announcement.operatorName, time: announcement.offlineAt, title: t('system.announcementManagement.audit.offline', '下线') } : undefined,
    ].filter(Boolean) as TrueAdminAuditTimelineItem[];
  }, [announcement, t]);

  if (!announcement) {
    return null;
  }

  return (
    <TrueAdminModal destroyOnHidden open={Boolean(announcement)} title={announcement.title} width={920} footer={<Button onClick={onClose}>{t('modal.action.close', '关闭')}</Button>} onCancel={onClose}>
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Space size={8} wrap>
          <Tag color={announcementStatusColor[announcement.status]}>{statusText[announcement.status]}</Tag>
          <Tag color="purple">{t('notification.type.announcement', '公告')}</Tag>
          <Tag color={levelColor[announcement.level]}>{levelText[announcement.level]}</Tag>
          {announcement.pinned ? <Tag color="gold">{t('notification.pinned', '置顶')}</Tag> : null}
        </Space>
        <Descriptions size="small" column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label={t('notification.detail.source', '来源')}>{resolveAdminMessageLabel(getAdminMessageSourceConfig(announcement.source)?.label, t, announcement.source)}</Descriptions.Item>
          <Descriptions.Item label={t('system.announcementManagement.column.target', '可见范围')}>{announcement.targetSummary} · {targetTypeText[announcement.targetType]}</Descriptions.Item>
          <Descriptions.Item label={t('system.announcementManagement.column.operator', '操作人')}>{announcement.operatorName ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('system.announcementManagement.form.scheduledAt', '定时发布时间')}>{announcement.scheduledAt ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('system.announcementManagement.column.publishedAt', '发布时间')}>{announcement.publishedAt ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('system.announcementManagement.form.expireAt', '过期时间')}>{announcement.expireAt ?? '-'}</Descriptions.Item>
        </Descriptions>
        <div className="trueadmin-message-detail-content"><TrueAdminMarkdown value={announcement.content} /></div>
        {announcement.attachments?.length ? <TrueAdminAttachmentUpload readonly value={announcement.attachments} /> : null}
        {announcement.payload && Object.keys(announcement.payload).length > 0 ? (
          <Collapse
            className="trueadmin-message-detail-payload"
            ghost
            items={[
              {
                key: 'payload',
                label: t('notification.detail.payload', '扩展数据'),
                children: (
                  <Typography.Paragraph code className="trueadmin-message-detail-payload-code" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(announcement.payload, null, 2)}
                  </Typography.Paragraph>
                ),
              },
            ]}
            size="small"
          />
        ) : null}
        <div className="trueadmin-notification-management-audit">
          <Typography.Text strong>{t('system.announcementManagement.audit.title', '操作记录')}</Typography.Text>
          <TrueAdminAuditTimeline items={auditItems} />
        </div>
      </Space>
    </TrueAdminModal>
  );
}
