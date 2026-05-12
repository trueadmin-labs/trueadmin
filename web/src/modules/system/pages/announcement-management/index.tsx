import { CloudUploadOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { TrueAdminCrudPage } from '@/core/crud';
import type { AdminAnnouncement, AdminAnnouncementListMeta } from '@/core/notification';
import { AnnouncementDetailModal } from './AnnouncementDetailModal';
import { AnnouncementFormModal } from './AnnouncementFormModal';
import { AnnouncementRowActions } from './AnnouncementRowActions';
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
          width: 190,
          render: ({ record, action }) => (
            <AnnouncementRowActions
              action={action}
              record={record}
              t={page.t}
              onDetail={page.openDetail}
              onEdit={page.openEdit}
            />
          ),
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
        statusText={page.statusText}
        levelText={page.levelText}
        targetTypeText={page.targetTypeText}
        onClose={() => page.setDetailOpen(false)}
        afterOpenChange={page.closeDetail}
      />
    </>
  );
}
