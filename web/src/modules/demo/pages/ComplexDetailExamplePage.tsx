import { FileTextOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';
import { TrueAdminScrollShadow } from '@/core/scroll/TrueAdminScrollShadow';

type SalesDetailItem = {
  key: string;
  product: string;
  spec: string;
  unit: string;
  quantity: number;
  price: number;
  taxRate: number;
  deliveryDate: string;
};

type SalesDetailFee = {
  key: string;
  name: string;
  amount: number;
  remark?: string;
};

type SalesOrderDetailBodyProps = {
  variant?: 'page' | 'modal';
};

const salesItems: SalesDetailItem[] = [
  {
    key: '1',
    product: 'TA-Server 标准版',
    spec: '16C / 64G / 2TB SSD',
    unit: '台',
    quantity: 2,
    price: 42800,
    taxRate: 13,
    deliveryDate: '2026-05-28',
  },
  {
    key: '2',
    product: 'TrueAdmin 企业授权',
    spec: '100 用户 / 1 年',
    unit: '套',
    quantity: 1,
    price: 68000,
    taxRate: 6,
    deliveryDate: '2026-05-20',
  },
  {
    key: '3',
    product: '实施服务',
    spec: '远程实施 + 数据初始化',
    unit: '项',
    quantity: 1,
    price: 18000,
    taxRate: 6,
    deliveryDate: '2026-06-05',
  },
];

const otherFees: SalesDetailFee[] = [
  { key: '1', name: '安装服务费', amount: 3200, remark: '现场部署' },
  { key: '2', name: '加急处理费', amount: 1800, remark: '优先排期' },
];

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  currency: 'CNY',
  maximumFractionDigits: 2,
  style: 'currency',
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

function SalesOrderDetailBody({ variant = 'page' }: SalesOrderDetailBodyProps) {
  const { t } = useI18n();
  const isModal = variant === 'modal';
  const mainSpan = 18;
  const sideSpan = 6;
  const detailTotal = salesItems.reduce((total, item) => total + item.quantity * item.price, 0);
  const feeTotal = otherFees.reduce((total, fee) => total + fee.amount, 0);
  const discount = 5000;
  const logisticsFee = 680;
  const prepaidAmount = 30000;
  const receivableAmount = detailTotal + feeTotal + logisticsFee - discount;
  const balanceAmount = receivableAmount - prepaidAmount;

  const salesColumns = useMemo<ColumnsType<SalesDetailItem>>(
    () => [
      { title: t('demo.complexForm.detail.product', '商品'), dataIndex: 'product', width: 180 },
      { title: t('demo.complexForm.detail.spec', '规格'), dataIndex: 'spec', width: 180 },
      { title: t('demo.complexForm.detail.unit', '单位'), dataIndex: 'unit', width: 70 },
      {
        title: t('demo.complexForm.detail.quantity', '数量'),
        dataIndex: 'quantity',
        align: 'right',
        width: 90,
      },
      {
        title: t('demo.complexForm.detail.price', '单价'),
        dataIndex: 'price',
        align: 'right',
        width: 120,
        render: (value) => formatCurrency(Number(value)),
      },
      {
        title: t('demo.complexForm.detail.taxRate', '税率'),
        dataIndex: 'taxRate',
        align: 'right',
        width: 90,
        render: (value) => `${String(value)}%`,
      },
      {
        title: t('demo.complexForm.detail.amount', '金额'),
        key: 'amount',
        align: 'right',
        width: 130,
        render: (_, record) => formatCurrency(record.quantity * record.price),
      },
      {
        title: t('demo.complexForm.detail.deliveryDate', '交付日期'),
        dataIndex: 'deliveryDate',
        width: 120,
      },
    ],
    [t],
  );

  const feeColumns = useMemo<ColumnsType<SalesDetailFee>>(
    () => [
      { title: t('demo.complexForm.fee.name', '费用名称'), dataIndex: 'name', width: 180 },
      {
        title: t('demo.complexForm.fee.amount', '金额'),
        dataIndex: 'amount',
        align: 'right',
        width: 140,
        render: (value) => formatCurrency(Number(value)),
      },
      { title: t('demo.complexForm.fee.remark', '备注'), dataIndex: 'remark' },
    ],
    [t],
  );

  return (
    <div className={isModal ? 'trueadmin-complex-detail is-modal' : 'trueadmin-complex-detail'}>
      <Row gutter={[12, 12]} align="top">
        <Col xs={24} xl={mainSpan}>
          <Space className="trueadmin-complex-form-stack" direction="vertical" size={12}>
            <Card size="small" title={t('demo.complexDetail.overview.title', '订单概览')}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Space size={8} wrap>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    SO-202605070001
                  </Typography.Title>
                  <Tag color="processing">
                    {t('demo.complexDetail.status.pendingAudit', '待审核')}
                  </Tag>
                  <Tag color="blue">{t('demo.complexForm.orderType.standard', '标准订单')}</Tag>
                </Space>
                <Descriptions column={{ xs: 1, sm: 2, xl: isModal ? 3 : 4 }} size="small">
                  <Descriptions.Item label={t('demo.complexForm.basic.customer', '客户')}>
                    杭州云栖科技有限公司
                  </Descriptions.Item>
                  <Descriptions.Item label={t('demo.complexForm.basic.salesperson', '销售员')}>
                    陈销售
                  </Descriptions.Item>
                  <Descriptions.Item label={t('demo.complexForm.basic.orderDate', '下单日期')}>
                    2026-05-07
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={t('demo.complexForm.basic.expectedDeliveryDate', '期望交货日期')}
                  >
                    2026-06-05
                  </Descriptions.Item>
                  <Descriptions.Item label={t('demo.complexForm.basic.contact', '联系人')}>
                    李经理
                  </Descriptions.Item>
                  <Descriptions.Item label={t('demo.complexForm.basic.contactPhone', '联系电话')}>
                    13800008888
                  </Descriptions.Item>
                  <Descriptions.Item label={t('demo.complexDetail.createdBy', '创建人')}>
                    系统管理员
                  </Descriptions.Item>
                  <Descriptions.Item label={t('demo.complexDetail.createdAt', '创建时间')}>
                    2026-05-07 14:32
                  </Descriptions.Item>
                </Descriptions>
              </Space>
            </Card>

            <Card size="small" title={t('demo.complexForm.shipping.title', '收货信息')}>
              <Descriptions column={{ xs: 1, md: 2 }} size="small">
                <Descriptions.Item
                  label={t('demo.complexForm.shipping.address', '收货地址')}
                  span={2}
                >
                  浙江省杭州市西湖区文三路 188 号 A 座 12 层
                </Descriptions.Item>
                <Descriptions.Item label={t('demo.complexForm.shipping.receiver', '联系人')}>
                  王主管
                </Descriptions.Item>
                <Descriptions.Item label={t('demo.complexForm.shipping.receiverPhone', '联系电话')}>
                  13900009999
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title={t('demo.complexForm.logistics.title', '物流信息')}>
              <Descriptions column={{ xs: 1, md: 3 }} size="small">
                <Descriptions.Item label={t('demo.complexForm.logistics.company', '物流公司')}>
                  顺丰速运
                </Descriptions.Item>
                <Descriptions.Item label={t('demo.complexForm.logistics.no', '物流单号')}>
                  SF2026050700123
                </Descriptions.Item>
                <Descriptions.Item label={t('demo.complexForm.logistics.fee', '物流费用')}>
                  {formatCurrency(logisticsFee)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title={t('demo.complexForm.detail.title', '销售明细')}>
              <Table<SalesDetailItem>
                rowKey="key"
                size="small"
                columns={salesColumns}
                dataSource={salesItems}
                pagination={false}
                scroll={{ x: 1090 }}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={6}>
                      <Typography.Text strong>
                        {t('demo.complexForm.detail.subtotal', '明细小计')}
                      </Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      <Typography.Text strong>{formatCurrency(detailTotal)}</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} />
                  </Table.Summary.Row>
                )}
              />
            </Card>

            <Card size="small" title={t('demo.complexForm.fee.title', '费用信息')}>
              <Table<SalesDetailFee>
                rowKey="key"
                size="small"
                columns={feeColumns}
                dataSource={otherFees}
                pagination={false}
              />
            </Card>

            <Card size="small" title={t('demo.complexForm.other.title', '其他信息')}>
              <Descriptions column={{ xs: 1, md: 2 }} size="small">
                <Descriptions.Item label={t('demo.complexForm.other.remark', '备注')} span={2}>
                  客户要求分两批交付，第一批硬件先行，软件授权在验收前完成开通。
                </Descriptions.Item>
                <Descriptions.Item label={t('demo.complexForm.other.attachment', '附件')}>
                  <Space size={8} wrap>
                    <Tag icon={<FileTextOutlined />}>销售合同.pdf</Tag>
                    <Tag icon={<FileTextOutlined />}>报价单.xlsx</Tag>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Space>
        </Col>

        <Col xs={24} xl={sideSpan}>
          <div className="trueadmin-complex-form-side">
            <Card size="small" title={t('demo.complexForm.amount.title', '金额统计')}>
              <div className="trueadmin-complex-form-amount-row">
                <span>{t('demo.complexForm.amount.detailTotal', '商品金额')}</span>
                <Typography.Text>{formatCurrency(detailTotal)}</Typography.Text>
              </div>
              <div className="trueadmin-complex-form-amount-row">
                <span>{t('demo.complexForm.amount.otherFees', '其他费用')}</span>
                <Typography.Text>{formatCurrency(feeTotal)}</Typography.Text>
              </div>
              <div className="trueadmin-complex-form-amount-row">
                <span>{t('demo.complexForm.amount.logisticsFee', '物流费用')}</span>
                <Typography.Text>{formatCurrency(logisticsFee)}</Typography.Text>
              </div>
              <div className="trueadmin-complex-form-amount-row is-negative">
                <span>{t('demo.complexForm.amount.discount', '折扣')}</span>
                <Typography.Text>-{formatCurrency(discount)}</Typography.Text>
              </div>
              <Divider />
              <div className="trueadmin-complex-form-amount-row is-total">
                <span>{t('demo.complexForm.amount.receivable', '应收金额')}</span>
                <Typography.Text>{formatCurrency(receivableAmount)}</Typography.Text>
              </div>
            </Card>

            <Card size="small" title={t('demo.complexForm.prepay.title', '预付款信息')}>
              <div className="trueadmin-complex-form-amount-row">
                <span>{t('demo.complexForm.prepay.method', '付款方式')}</span>
                <Typography.Text>
                  {t('demo.complexForm.prepay.method.bank', '银行转账')}
                </Typography.Text>
              </div>
              <div className="trueadmin-complex-form-amount-row">
                <span>{t('demo.complexForm.prepay.amount', '预付款金额')}</span>
                <Typography.Text>{formatCurrency(prepaidAmount)}</Typography.Text>
              </div>
              <div className="trueadmin-complex-form-amount-row">
                <span>{t('demo.complexForm.prepay.date', '预付款日期')}</span>
                <Typography.Text>2026-05-10</Typography.Text>
              </div>
              <Divider />
              <div className="trueadmin-complex-form-amount-row is-balance">
                <span>{t('demo.complexForm.amount.balance', '待收余额')}</span>
                <Typography.Text>{formatCurrency(balanceAmount)}</Typography.Text>
              </div>
            </Card>

            <Card size="small" title={t('demo.complexForm.process.title', '订单状态')}>
              <Space wrap size={6}>
                <Tag color="success">{t('demo.complexDetail.status.created', '已创建')}</Tag>
                <Tag color="processing">
                  {t('demo.complexDetail.status.pendingAudit', '待审核')}
                </Tag>
                <Tag>{t('demo.complexForm.process.delivery', '待交付')}</Tag>
              </Space>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default function ComplexDetailExamplePage() {
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);

  const actions = (
    <Space size={8} wrap>
      <Button onClick={() => setModalOpen(true)}>
        {t('demo.complexDetail.action.openModal', '弹窗承接')}
      </Button>
      <Button type="primary">{t('demo.complexDetail.action.audit', '审核订单')}</Button>
    </Space>
  );

  return (
    <>
      <TrueAdminPage
        showHeader
        title={t('demo.complexDetail.title', '复杂详情示例')}
        description={t(
          'demo.complexDetail.description',
          '销售订单详情，展示基础信息、明细、费用、附件和金额统计。',
        )}
        extra={actions}
      >
        <SalesOrderDetailBody />
      </TrueAdminPage>
      <Modal
        centered
        title={t('demo.complexDetail.modal.title', '销售订单详情')}
        open={modalOpen}
        width="min(1440px, calc(100vw - 48px))"
        className="trueadmin-page-modal trueadmin-complex-form-modal"
        style={
          {
            '--trueadmin-modal-content-bg': 'var(--trueadmin-shell-bg)',
            '--trueadmin-modal-content-padding-block': '20px',
            '--trueadmin-modal-content-padding-inline': '24px',
          } as CSSProperties
        }
        styles={{ body: { overflow: 'hidden', padding: 0 } }}
        footer={
          <Space size={8} wrap>
            <Button onClick={() => setModalOpen(false)}>
              {t('demo.complexForm.action.cancel', '取消')}
            </Button>
            <Button type="primary">{t('demo.complexDetail.action.audit', '审核订单')}</Button>
          </Space>
        }
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <TrueAdminScrollShadow
          className="trueadmin-complex-form-modal-shadow"
          contentClassName="trueadmin-complex-form-modal-body"
        >
          <SalesOrderDetailBody variant="modal" />
        </TrueAdminScrollShadow>
      </Modal>
    </>
  );
}
