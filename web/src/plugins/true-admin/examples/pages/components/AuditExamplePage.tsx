import { TrueAdminActionBar } from '@trueadmin/web-antd/action';
import { App, Space } from 'antd';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';
import { TrueAdminAuditPanel } from '@/core/timeline';

export default function AuditExamplePage() {
  const { message } = App.useApp();
  const { t } = useI18n();

  return (
    <TrueAdminPage
      title={t('examples.audit.title', '审计日志示例')}
      description={t('examples.audit.description', '展示审计时间线、状态和审批操作组合。')}
      contentAlign="center"
      contentWidth={920}
    >
      <Space orientation="vertical" size={12} className="trueadmin-example-stack">
        <TrueAdminAuditPanel
          title={t('examples.components.audit.title', '审计时间线')}
          description={t(
            'examples.components.audit.description',
            '展示审批、操作记录和当前流程状态。',
          )}
          status={{ label: t('examples.components.status.pending', '待确认'), color: 'processing' }}
          actions={
            <TrueAdminActionBar
              actions={[
                {
                  key: 'approve',
                  label: t('examples.components.audit.approve', '通过'),
                  type: 'primary',
                  onClick: () => message.success(t('examples.components.audit.approved', '已通过')),
                },
                {
                  key: 'reject',
                  label: t('examples.components.audit.reject', '驳回'),
                  danger: true,
                  onClick: () => message.warning(t('examples.components.audit.rejected', '已驳回')),
                },
              ]}
            />
          }
          items={[
            {
              color: 'green',
              title: t('examples.components.audit.created', '创建记录'),
              description: t('examples.components.audit.createdDesc', '系统创建了业务单据。'),
              operator: t('examples.components.audit.operator.admin', '系统管理员'),
              time: '2026-05-08 09:30',
            },
            {
              color: 'blue',
              title: t('examples.components.audit.updated', '更新状态'),
              description: t('examples.components.audit.updatedDesc', '状态变更为待确认。'),
              operator: t('examples.components.audit.operator.ops', '运营管理员'),
              time: '2026-05-08 10:15',
            },
          ]}
        />
      </Space>
    </TrueAdminPage>
  );
}
