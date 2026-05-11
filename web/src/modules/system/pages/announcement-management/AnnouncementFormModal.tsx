import { CloudUploadOutlined, SaveOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, DatePicker, Form, Input, Select, Space, Switch } from 'antd';
import { TrueAdminMarkdownEditor } from '@/core/markdown';
import { TrueAdminModal } from '@/core/modal';
import type {
  AdminAnnouncement,
  AdminAnnouncementTargetType,
  AdminMessageLevel,
} from '@/core/notification';
import { TrueAdminAttachmentUpload, uploadTrueAdminFile } from '@/core/upload';
import {
  type AnnouncementFormValues,
  type AnnouncementSubmitMode,
  getInitialAnnouncementValues,
} from './announcementManagementModel';

type AnnouncementFormModalProps = {
  editing?: AdminAnnouncement;
  form: FormInstance<AnnouncementFormValues>;
  levelText: Record<AdminMessageLevel, string>;
  metadataOnlyEdit: boolean;
  open: boolean;
  roleOptions: Array<{ label: string; value: number }>;
  roleOptionsLoading: boolean;
  t: (key: string, fallback?: string) => string;
  targetTypeText: Record<AdminAnnouncementTargetType, string>;
  onClose: () => void;
  onSubmit: (mode: AnnouncementSubmitMode) => void;
};

export function AnnouncementFormModal({
  editing,
  form,
  levelText,
  metadataOnlyEdit,
  open,
  roleOptions,
  roleOptionsLoading,
  t,
  targetTypeText,
  onClose,
  onSubmit,
}: AnnouncementFormModalProps) {
  const targetType = Form.useWatch('targetType', form);

  return (
    <TrueAdminModal
      destroyOnHidden
      open={open}
      title={
        editing
          ? t('system.announcementManagement.modal.editAnnouncement', '编辑公告')
          : t('system.announcementManagement.modal.createAnnouncement', '发布公告')
      }
      width={760}
      footer={
        <Space>
          <Button onClick={onClose}>{t('modal.action.close', '关闭')}</Button>
          {!editing ? (
            <Button icon={<SaveOutlined />} onClick={() => onSubmit('draft')}>
              {t('system.announcementManagement.action.saveDraft', '保存草稿')}
            </Button>
          ) : null}
          <Button
            type="primary"
            icon={editing ? <SaveOutlined /> : <CloudUploadOutlined />}
            onClick={() => onSubmit('publish')}
          >
            {editing
              ? t('system.announcementManagement.action.save', '保存')
              : t('system.announcementManagement.action.createAnnouncement', '发布公告')}
          </Button>
        </Space>
      }
      onCancel={onClose}
    >
      <Form<AnnouncementFormValues>
        form={form}
        layout="vertical"
        initialValues={getInitialAnnouncementValues()}
      >
        <Form.Item
          label={t('system.announcementManagement.form.title', '公告标题')}
          name="title"
          rules={[{ required: true }]}
        >
          <Input disabled={metadataOnlyEdit} />
        </Form.Item>
        <Form.Item
          label={t('system.announcementManagement.form.content', '公告正文')}
          name="content"
          rules={[{ required: true }]}
        >
          <TrueAdminMarkdownEditor
            disabled={metadataOnlyEdit}
            rows={8}
            placeholder={t(
              'system.announcementManagement.form.content.placeholder',
              '请输入 Markdown 公告正文',
            )}
          />
        </Form.Item>
        <Form.Item
          label={t('system.announcementManagement.form.attachments', '附件')}
          name="attachments"
        >
          <TrueAdminAttachmentUpload
            disabled={metadataOnlyEdit}
            readonly={metadataOnlyEdit}
            multiple
            maxCount={8}
            upload={(file) =>
              uploadTrueAdminFile(file, { category: 'announcement', visibility: 'public' })
            }
            title={t(
              'system.announcementManagement.form.attachments.uploadTitle',
              '拖拽公告附件到这里，或点击选择',
            )}
            hint={t(
              'system.announcementManagement.form.attachments.uploadHint',
              '附件会随公告一起展示，支持编辑展示名称。',
            )}
          />
        </Form.Item>
        <Space size={12} style={{ width: '100%' }} align="start">
          <Form.Item label={t('system.announcementManagement.form.level', '公告等级')} name="level">
            <Select
              disabled={metadataOnlyEdit}
              style={{ width: 160 }}
              options={Object.entries(levelText).map(([value, label]) => ({ label, value }))}
            />
          </Form.Item>
          <Form.Item
            label={t('system.announcementManagement.form.targetType', '接收范围')}
            name="targetType"
          >
            <Select
              disabled={metadataOnlyEdit}
              style={{ width: 180 }}
              options={[
                { label: targetTypeText.all, value: 'all' },
                { label: targetTypeText.role, value: 'role' },
              ]}
            />
          </Form.Item>
        </Space>
        {targetType === 'role' ? (
          <Form.Item
            label={t('system.announcementManagement.form.targetRoleIds', '目标角色')}
            name="targetRoleIds"
            rules={[{ required: true }]}
          >
            <Select
              disabled={metadataOnlyEdit}
              mode="multiple"
              loading={roleOptionsLoading}
              options={roleOptions}
            />
          </Form.Item>
        ) : null}
        <Form.Item
          label={t('system.announcementManagement.form.pinned', '置顶公告')}
          name="pinned"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          label={t('system.announcementManagement.form.scheduledAt', '定时发布时间')}
          name="scheduledAt"
        >
          <DatePicker
            disabled={metadataOnlyEdit}
            format="YYYY-MM-DD HH:mm"
            showTime={{ format: 'HH:mm' }}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item
          label={t('system.announcementManagement.form.expireAt', '过期时间')}
          name="expireAt"
        >
          <DatePicker
            format="YYYY-MM-DD HH:mm"
            showTime={{ format: 'HH:mm' }}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </TrueAdminModal>
  );
}
