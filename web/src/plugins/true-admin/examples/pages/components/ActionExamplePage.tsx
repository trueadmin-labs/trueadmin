import { DeleteOutlined, EyeOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { TrueAdminActionBar, TrueAdminConfirmAction } from '@core/action';
import { TrueAdminPermissionButton } from '@core/auth';
import { App, Card, Space } from 'antd';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminImportExport } from '@/core/import-export';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';

export default function ActionExamplePage() {
  const { message } = App.useApp();
  const { t } = useI18n();

  return (
    <TrueAdminPage
      title={t('examples.actions.title', '操作反馈示例')}
      description={t('examples.actions.description', '展示操作栏、权限按钮、确认操作和导入导出。')}
      contentAlign="center"
      contentWidth={920}
    >
      <Space orientation="vertical" size={12} className="trueadmin-example-stack">
        <Card size="small" title={t('examples.components.actions.title', '页面操作')}>
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <TrueAdminActionBar
              max={3}
              moreText={t('examples.components.actions.more', '更多')}
              actions={[
                {
                  key: 'submit',
                  label: t('examples.components.actions.submit', '提交'),
                  type: 'primary',
                  icon: <SendOutlined />,
                  onClick: () => message.success(t('examples.components.actions.submit', '已提交')),
                },
                {
                  key: 'draft',
                  label: t('examples.components.actions.saveDraft', '保存草稿'),
                  icon: <SaveOutlined />,
                  onClick: () => message.info(t('examples.components.actions.saved', '已保存')),
                },
                {
                  key: 'view',
                  label: t('examples.components.actions.preview', '预览'),
                  icon: <EyeOutlined />,
                  onClick: () => message.info(t('examples.components.actions.previewed', '已预览')),
                },
                {
                  key: 'delete',
                  label: t('examples.components.actions.delete', '删除'),
                  danger: true,
                  icon: <DeleteOutlined />,
                  onClick: () =>
                    message.warning(t('examples.components.actions.deleted', '已删除')),
                },
              ]}
            />
            <Space size={8} wrap>
              <TrueAdminPermissionButton
                permission="system.user.create"
                type="primary"
                deniedMode="disable"
                deniedTooltip={t('examples.components.permission.denied', '没有操作权限')}
                confirm={t('examples.components.permission.confirm', '确认执行该操作？')}
                onClick={() =>
                  message.success(t('examples.components.permission.done', '权限按钮已执行'))
                }
              >
                {t('examples.components.permission.button', '权限按钮')}
              </TrueAdminPermissionButton>
              <TrueAdminPermissionButton
                permission="not.exists.permission"
                deniedMode="disable"
                deniedTooltip={t('examples.components.permission.denied', '没有操作权限')}
              >
                {t('examples.components.permission.disabledButton', '无权限禁用')}
              </TrueAdminPermissionButton>
              <TrueAdminConfirmAction
                danger
                icon={<DeleteOutlined />}
                confirm={{
                  title: t('examples.components.confirm.title', '确认删除这条记录吗？'),
                  description: t(
                    'examples.components.confirm.description',
                    '删除后数据将无法恢复，请谨慎操作。',
                  ),
                  okText: t('examples.components.confirm.ok', '确认删除'),
                  cancelText: t('examples.components.confirm.cancel', '取消'),
                }}
                successMessage={t('examples.components.confirm.success', '记录已删除')}
                action={async () => {
                  await new Promise((resolve) => window.setTimeout(resolve, 600));
                }}
              >
                {t('examples.components.confirm.button', '确认操作')}
              </TrueAdminConfirmAction>
            </Space>
          </Space>
        </Card>

        <Card size="small" title={t('examples.components.importExport.title', '导入导出')}>
          <TrueAdminImportExport
            importConfig={{
              onClick: () =>
                message.info(t('examples.components.importExport.import', '已触发导入')),
            }}
            exportConfig={{
              selectedDisabled: true,
              onExport: (type) =>
                message.info(
                  t('examples.components.importExport.export', '已触发导出：{{type}}').replace(
                    '{{type}}',
                    type,
                  ),
                ),
            }}
          />
        </Card>
      </Space>
    </TrueAdminPage>
  );
}
