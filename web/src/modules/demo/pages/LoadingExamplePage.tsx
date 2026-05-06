import { ReloadOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { LoadingContainer } from '@/core/loading/LoadingContainer';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';

const { Paragraph, Text } = Typography;

type DemoProfile = {
  id: string;
  name: string;
  owner: string;
  status: string;
  updatedAt: string;
  scope: string;
  approval?: string;
  remark?: string;
};

const createProfile = (
  version: number,
  t: (key?: string, fallback?: string) => string,
): DemoProfile => ({
  id: `DEMO-${String(version).padStart(4, '0')}`,
  name: t('demo.loading.profile.name', '数据权限配置'),
  owner:
    version % 2 === 0
      ? t('demo.loading.profile.owner.system', '系统管理员')
      : t('demo.loading.profile.owner.business', '业务管理员'),
  status:
    version % 2 === 0
      ? t('demo.loading.profile.status.enabled', '已启用')
      : t('demo.loading.profile.status.review', '待复核'),
  updatedAt: `2026-05-06 14:${String(20 + version).padStart(2, '0')}`,
  scope:
    version % 2 === 0
      ? t('demo.loading.profile.scope.full', '全部组织')
      : t('demo.loading.profile.scope.partial', '华东区域'),
  approval: version % 2 === 0 ? t('demo.loading.profile.approval', '需要二次审批') : undefined,
  remark:
    version % 3 === 0
      ? t(
          'demo.loading.profile.remark',
          '本次刷新返回了更多字段，容器会从上一次确认的高度平滑调整到新的内容高度。',
        )
      : undefined,
});

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function ProfileDescriptions({
  profile,
  t,
}: {
  profile: DemoProfile;
  t: (key?: string, fallback?: string) => string;
}) {
  return (
    <Descriptions size="small" column={1} bordered>
      <Descriptions.Item label={t('demo.loading.profile.id', '编号')}>
        {profile.id}
      </Descriptions.Item>
      <Descriptions.Item label={t('demo.loading.profile.configName', '名称')}>
        {profile.name}
      </Descriptions.Item>
      <Descriptions.Item label={t('demo.loading.profile.owner', '负责人')}>
        {profile.owner}
      </Descriptions.Item>
      <Descriptions.Item label={t('demo.loading.profile.status', '状态')}>
        {profile.status}
      </Descriptions.Item>
      <Descriptions.Item label={t('demo.loading.profile.updatedAt', '更新时间')}>
        {profile.updatedAt}
      </Descriptions.Item>
      <Descriptions.Item label={t('demo.loading.profile.scope', '生效范围')}>
        {profile.scope}
      </Descriptions.Item>
      {profile.approval ? (
        <Descriptions.Item label={t('demo.loading.profile.approvalLabel', '审批策略')}>
          {profile.approval}
        </Descriptions.Item>
      ) : null}
      {profile.remark ? (
        <Descriptions.Item label={t('demo.loading.profile.remarkLabel', '备注')}>
          {profile.remark}
        </Descriptions.Item>
      ) : null}
    </Descriptions>
  );
}

function ModalProfileContent({
  profile,
  version,
  t,
}: {
  profile: DemoProfile;
  version: number;
  t: (key?: string, fallback?: string) => string;
}) {
  const recordCount = version % 2 === 0 ? 4 : 9;

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <ProfileDescriptions profile={profile} t={t} />
      <Descriptions size="small" column={1} bordered>
        {Array.from({ length: recordCount }).map((_, index) => (
          <Descriptions.Item
            key={index}
            label={`${t('demo.loading.modal.auditRecord', '处理记录')} ${index + 1}`}
          >
            {version % 2 === 0
              ? t('demo.loading.modal.auditShort', '已完成基础字段同步。')
              : t(
                  'demo.loading.modal.auditLong',
                  '本次返回了更长的处理记录，用来确认固定高度弹窗内的内容区域可以独立滚动。',
                )}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Space>
  );
}

export default function LoadingExamplePage() {
  const { t } = useI18n();
  const [version, setVersion] = useState(1);
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerProfile, setDrawerProfile] = useState<DemoProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalVersion, setModalVersion] = useState(2);
  const [modalProfile, setModalProfile] = useState<DemoProfile | null>(null);
  const [keepChildren, setKeepChildren] = useState(true);
  const [disableLoading, setDisableLoading] = useState(false);

  useEffect(() => {
    let disposed = false;

    setDetailLoading(true);
    wait(900).then(() => {
      if (!disposed) {
        setProfile(createProfile(1, t));
        setDetailLoading(false);
      }
    });

    return () => {
      disposed = true;
    };
  }, [t]);

  const reloadProfile = async () => {
    setRefreshing(true);
    await wait(900);
    const nextVersion = version + 1;
    setVersion(nextVersion);
    setProfile(createProfile(nextVersion, t));
    setRefreshing(false);
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerProfile(null);
    wait(800).then(() => {
      setDrawerProfile(createProfile(version + 10, t));
      setDrawerLoading(false);
    });
  };

  const loadModalProfile = async (nextVersion: number) => {
    setModalLoading(true);
    await wait(800);
    setModalVersion(nextVersion);
    setModalProfile(createProfile(nextVersion, t));
    setModalLoading(false);
  };

  const openModal = () => {
    setModalOpen(true);
    setModalProfile(null);
    void loadModalProfile(modalVersion);
  };

  const reloadModalProfile = () => {
    void loadModalProfile(modalVersion + 1);
  };

  const effectiveLoading = disableLoading ? false : detailLoading || refreshing;

  return (
    <TrueAdminPage title={t('demo.loading.title', '加载态示例')}>
      <Space direction="vertical" size={16} className="trueadmin-example-stack">
        <Card title={t('demo.loading.strategy.title', '容器级加载策略')} size="small">
          <Paragraph>
            {t(
              'demo.loading.strategy.beforeCode',
              '路由切换使用页面级加载；详情页、编辑页、抽屉和局部内容建议使用',
            )}{' '}
            <Text code>{'<LoadingContainer />'}</Text>
            {t(
              'demo.loading.strategy.afterCode',
              '。默认只绑定首次加载，后台刷新是否遮罩由业务显式决定。',
            )}
          </Paragraph>
          <Space wrap>
            <Switch
              checked={keepChildren}
              onChange={setKeepChildren}
              checkedChildren={t('demo.loading.keepChildren.on', '保留内容')}
              unCheckedChildren={t('demo.loading.keepChildren.off', '替换内容')}
            />
            <Switch
              checked={disableLoading}
              onChange={setDisableLoading}
              checkedChildren={t('demo.loading.disable.on', '禁用加载')}
              unCheckedChildren={t('demo.loading.disable.off', '启用加载')}
            />
            <Button icon={<ReloadOutlined />} onClick={reloadProfile}>
              {t('demo.loading.reload', '模拟刷新')}
            </Button>
          </Space>
        </Card>

        <Card title={t('demo.loading.detail.title', '详情容器加载')} size="small">
          <LoadingContainer
            loading={effectiveLoading}
            keepChildren={keepChildren}
            initialLoadingHeight={240}
            tip={t('demo.loading.detail.tip', '正在读取详情')}
          >
            {profile ? <ProfileDescriptions profile={profile} t={t} /> : null}
          </LoadingContainer>
        </Card>

        <Card
          title={t('demo.loading.drawer.title', '抽屉内加载')}
          size="small"
          extra={
            <Button type="primary" onClick={openDrawer}>
              {t('demo.loading.drawer.open', '打开抽屉')}
            </Button>
          }
        >
          <Paragraph>
            {t(
              'demo.loading.drawer.description',
              '抽屉打开后再请求详情时，只应该让抽屉内容区域进入加载态，不要阻塞页面其它区域。',
            )}
          </Paragraph>
        </Card>

        <Card
          title={t('demo.loading.modal.title', '弹窗内加载')}
          size="small"
          extra={
            <Button type="primary" onClick={openModal}>
              {t('demo.loading.modal.open', '打开弹窗')}
            </Button>
          }
        >
          <Paragraph>
            {t(
              'demo.loading.modal.description',
              '弹窗 body 固定高度，内容区域内部滚动；加载动画基于固定视窗居中展示。',
            )}
          </Paragraph>
        </Card>

        <Card title={t('demo.loading.form.title', '编辑表单加载')} size="small">
          <LoadingContainer loading={effectiveLoading} initialLoadingHeight={220}>
            <Form className="trueadmin-demo-loading-form" layout="vertical" disabled={!profile}>
              <Form.Item label={t('demo.loading.form.configName', '配置名称')}>
                <Input value={profile?.name ?? ''} readOnly />
              </Form.Item>
              <Form.Item label={t('demo.loading.form.owner', '负责人')}>
                <Input value={profile?.owner ?? ''} readOnly />
              </Form.Item>
            </Form>
          </LoadingContainer>
        </Card>
      </Space>

      <Modal
        title={t('demo.loading.modal.detailTitle', '弹窗详情')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={520}
        footer={[
          <Button
            key="reload"
            icon={<ReloadOutlined />}
            loading={modalLoading}
            onClick={reloadModalProfile}
          >
            {t('demo.loading.modal.reload', '刷新内容')}
          </Button>,
          <Button key="close" type="primary" onClick={() => setModalOpen(false)}>
            {t('demo.loading.modal.close', '关闭')}
          </Button>,
        ]}
      >
        <LoadingContainer
          loading={modalLoading}
          layout="viewport"
          viewportHeight={320}
          tip={t('demo.loading.modal.tip', '正在加载弹窗内容')}
        >
          <div className="trueadmin-demo-modal-loading-content">
            {modalProfile ? (
              <ModalProfileContent profile={modalProfile} version={modalVersion} t={t} />
            ) : null}
          </div>
        </LoadingContainer>
      </Modal>

      <Drawer
        title={t('demo.loading.drawer.detailTitle', '详情抽屉')}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
      >
        <LoadingContainer
          loading={drawerLoading}
          mode="spin"
          initialLoadingHeight={220}
          tip={t('demo.loading.drawer.tip', '正在加载抽屉数据')}
        >
          {drawerProfile ? <ProfileDescriptions profile={drawerProfile} t={t} /> : null}
        </LoadingContainer>
      </Drawer>
    </TrueAdminPage>
  );
}
