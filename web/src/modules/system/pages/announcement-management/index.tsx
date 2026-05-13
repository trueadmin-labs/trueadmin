import { CloudUploadOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { TrueAdminCrudPage } from '@/core/crud';
import {
  type AdminAnnouncement,
  type AdminAnnouncementListMeta,
  adminNotificationManagementApi,
} from '@/core/notification';
import { AnnouncementDetailModal } from './AnnouncementDetailModal';
import { AnnouncementFormModal } from './AnnouncementFormModal';
import { AnnouncementStatusFilter } from './AnnouncementStatusFilter';
import { useAnnouncementManagementPage } from './useAnnouncementManagementPage';

export default function AdminAnnouncementManagementPage() {
  const page = useAnnouncementManagementPage();

  return (
    <>
      <TrueAdminCrudPage<
        AdminAnnouncement,
        Partial<AdminAnnouncement>,
        Partial<AdminAnnouncement>,
        AdminAnnouncementListMeta
      >
        title={page.t('system.announcementManagement.title', '公告管理')}
        description={page.t(
          'system.announcementManagement.description',
          '管理后台公告、定时发布、置顶和可见范围。',
        )}
        resource="system.announcementManagement"
        rowKey="id"
        columns={page.columns}
        service={page.service}
        quickSearch={{
          placeholder: page.t(
            'system.announcementManagement.keyword.placeholder',
            '搜索标题 / 内容 / 操作人',
          ),
        }}
        filters={page.filters}
        extraQuery={page.extraQuery}
        extra={
          <Button type="primary" icon={<CloudUploadOutlined />} onClick={page.openCreate}>
            {page.t('system.announcementManagement.action.createAnnouncement', '发布公告')}
          </Button>
        }
        rowActions={{
          maxInline: 2,
          order: [
            'detail',
            'edit',
            'publish',
            'cancelScheduled',
            'deleteDraft',
            'offline',
            'restore',
          ],
          presets: false,
          width: 190,
          items: [
            {
              key: 'detail',
              label: page.t('system.announcementManagement.action.detail', '详情'),
              onClick: ({ record }) => page.openDetail(record),
              permission: 'system:announcement:detail',
              size: 'small',
              type: 'link',
            },
            {
              key: 'edit',
              label: page.t('system.announcementManagement.action.edit', '编辑'),
              onClick: ({ record }) => page.openEdit(record),
              permission: 'system:announcement:update',
              size: 'small',
              type: 'link',
              visible: ({ record }) =>
                ['draft', 'scheduled', 'active', 'expired'].includes(record.status),
            },
            {
              key: 'publish',
              confirm: page.t(
                'system.announcementManagement.confirm.publish',
                '确认发布该公告吗？',
              ),
              label: page.t('system.announcementManagement.action.publish', '发布'),
              onClick: async ({ action, record }) => {
                await adminNotificationManagementApi.publishAnnouncement(record.id).send();
                action.reload();
              },
              permission: 'system:announcement:publish',
              size: 'small',
              successMessage: page.t('system.announcementManagement.success.publish', '公告已发布'),
              type: 'link',
              visible: ({ record }) => record.status === 'draft' || record.status === 'scheduled',
            },
            {
              key: 'cancelScheduled',
              confirm: page.t(
                'system.announcementManagement.confirm.cancelScheduled',
                '取消后会退回草稿状态。',
              ),
              danger: true,
              label: page.t('system.announcementManagement.action.cancelScheduled', '取消'),
              onClick: async ({ action, record }) => {
                await adminNotificationManagementApi.cancelScheduledAnnouncement(record.id).send();
                action.reload();
              },
              permission: 'system:announcement:update',
              size: 'small',
              successMessage: page.t(
                'system.announcementManagement.success.cancelScheduled',
                '定时发布已取消',
              ),
              type: 'link',
              visible: ({ record }) => record.status === 'scheduled',
            },
            {
              key: 'deleteDraft',
              confirm: page.t(
                'system.announcementManagement.confirm.deleteDraft',
                '删除后不可恢复。',
              ),
              danger: true,
              label: page.t('system.announcementManagement.action.delete', '删除'),
              onClick: async ({ action, record }) => {
                await adminNotificationManagementApi.deleteDraftAnnouncement(record.id).send();
                action.reload();
              },
              permission: 'system:announcement:delete',
              size: 'small',
              successMessage: page.t(
                'system.announcementManagement.success.deleteDraft',
                '草稿已删除',
              ),
              type: 'link',
              visible: ({ record }) => record.status === 'draft',
            },
            {
              key: 'offline',
              confirm: page.t(
                'system.announcementManagement.confirm.offline',
                '确认下线该公告吗？',
              ),
              danger: true,
              label: page.t('system.announcementManagement.action.offline', '下线'),
              onClick: async ({ action, record }) => {
                await adminNotificationManagementApi.offlineAnnouncement(record.id).send();
                action.reload();
              },
              permission: 'system:announcement:offline',
              size: 'small',
              successMessage: page.t('system.announcementManagement.success.offline', '公告已下线'),
              type: 'link',
              visible: ({ record }) => record.status === 'active',
            },
            {
              key: 'restore',
              confirm: page.t(
                'system.announcementManagement.confirm.restore',
                '确认恢复该公告吗？',
              ),
              label: page.t('system.announcementManagement.action.restore', '恢复'),
              onClick: async ({ action, record }) => {
                await adminNotificationManagementApi.restoreAnnouncement(record.id).send();
                action.reload();
              },
              permission: 'system:announcement:update',
              size: 'small',
              successMessage: page.t('system.announcementManagement.success.restore', '公告已恢复'),
              type: 'link',
              visible: ({ record }) => record.status === 'offline' || record.status === 'expired',
            },
          ],
        }}
        toolbarRender={({ query, response }) => (
          <AnnouncementStatusFilter
            query={query}
            response={response}
            statusText={page.statusText}
            t={page.t}
          />
        )}
        tableProps={{ size: 'middle' }}
        paginationProps={{ showQuickJumper: true }}
        tableScrollX={1180}
      />

      <AnnouncementFormModal
        editing={page.editing}
        form={page.form}
        levelText={page.levelText}
        loading={page.editLoading}
        metadataOnlyEdit={page.metadataOnlyEdit}
        open={page.open}
        roleOptions={page.roleOptions}
        roleOptionsLoading={page.roleOptionsLoading}
        t={page.t}
        targetTypeText={page.targetTypeText}
        onClose={page.closeModal}
        onSubmit={(mode) => void page.submit(mode)}
      />

      <AnnouncementDetailModal
        open={page.detailOpen}
        announcement={page.detail}
        loading={page.detailLoading}
        statusText={page.statusText}
        levelText={page.levelText}
        targetTypeText={page.targetTypeText}
        onClose={page.closeDetail}
      />
    </>
  );
}
