import { DeleteOutlined, PlusOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPageModal } from '@/core/modal/TrueAdminPageModal';
import { TrueAdminFormPage } from '@/core/page/TrueAdminFormPage';
import { TrueAdminAttachmentUpload } from '@/core/upload';

type SalesItem = {
  key: string;
  product: string;
  spec: string;
  unit: string;
  quantity: number;
  price: number;
  taxRate: number;
  deliveryDate: string;
  remark?: string;
};

type OtherFee = {
  key: string;
  name: string;
  amount: number;
  remark?: string;
};

type SalesOrderFormBodyProps = {
  variant?: 'page' | 'modal';
};

const salesItems: SalesItem[] = [
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

const otherFees: OtherFee[] = [
  { key: '1', name: '安装服务费', amount: 3200 },
  { key: '2', name: '加急处理费', amount: 1800 },
];

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  currency: 'CNY',
  maximumFractionDigits: 2,
  style: 'currency',
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

function SalesOrderFormBody({ variant = 'page' }: SalesOrderFormBodyProps) {
  const { t } = useI18n();
  const [form] = Form.useForm();
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

  const salesColumns = useMemo<ColumnsType<SalesItem>>(
    () => [
      { title: t('examples.complexForm.detail.product', '商品'), dataIndex: 'product', width: 180 },
      { title: t('examples.complexForm.detail.spec', '规格'), dataIndex: 'spec', width: 180 },
      { title: t('examples.complexForm.detail.unit', '单位'), dataIndex: 'unit', width: 70 },
      {
        title: t('examples.complexForm.detail.quantity', '数量'),
        dataIndex: 'quantity',
        align: 'right',
        width: 90,
      },
      {
        title: t('examples.complexForm.detail.price', '单价'),
        dataIndex: 'price',
        align: 'right',
        width: 120,
        render: (value) => formatCurrency(Number(value)),
      },
      {
        title: t('examples.complexForm.detail.taxRate', '税率'),
        dataIndex: 'taxRate',
        align: 'right',
        width: 90,
        render: (value) => `${String(value)}%`,
      },
      {
        title: t('examples.complexForm.detail.amount', '金额'),
        key: 'amount',
        align: 'right',
        width: 130,
        render: (_, record) => formatCurrency(record.quantity * record.price),
      },
      {
        title: t('examples.complexForm.detail.deliveryDate', '交付日期'),
        dataIndex: 'deliveryDate',
        width: 120,
      },
      {
        title: t('examples.complexForm.detail.action', '操作'),
        key: 'action',
        fixed: 'right',
        width: 90,
        render: () => (
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            {t('examples.complexForm.action.delete', '删除')}
          </Button>
        ),
      },
    ],
    [t],
  );

  const feeColumns = useMemo<ColumnsType<OtherFee>>(
    () => [
      { title: t('examples.complexForm.fee.name', '费用名称'), dataIndex: 'name', width: 180 },
      {
        title: t('examples.complexForm.fee.amount', '金额'),
        dataIndex: 'amount',
        align: 'right',
        width: 140,
        render: (value) => formatCurrency(Number(value)),
      },
      { title: t('examples.complexForm.fee.remark', '备注'), dataIndex: 'remark' },
      {
        title: t('examples.complexForm.detail.action', '操作'),
        key: 'action',
        width: 90,
        render: () => (
          <Button type="link" size="small" danger>
            {t('examples.complexForm.action.delete', '删除')}
          </Button>
        ),
      },
    ],
    [t],
  );

  return (
    <Form
      form={form}
      className={isModal ? 'trueadmin-complex-form is-modal' : 'trueadmin-complex-form'}
      layout="vertical"
      initialValues={{
        customer: '杭州云栖科技有限公司',
        salesperson: '陈销售',
        orderType: 'standard',
        contact: '李经理',
        contactPhone: '13800008888',
        receiver: '王主管',
        receiverPhone: '13900009999',
        address: '浙江省杭州市西湖区文三路 188 号 A 座 12 层',
        logisticsCompany: '顺丰速运',
        logisticsNo: 'SF2026050700123',
        logisticsFee,
        discount,
        prepaidAmount,
        attachments: [
          {
            id: 'demo-contract-1',
            name: '销售合同-客户已盖章',
            url: '/mock/attachments/sales-contract.pdf',
            extension: 'pdf',
            size: 245760,
            mimeType: 'application/pdf',
          },
          {
            id: 'demo-quote-1',
            name: '报价单-最终版',
            url: '/mock/attachments/quotation.xlsx',
            extension: 'xlsx',
            size: 98304,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ],
      }}
    >
      <Row gutter={[12, 12]} align="top">
        <Col xs={24} xl={mainSpan}>
          <Space className="trueadmin-complex-form-stack" orientation="vertical" size={12}>
            <Card size="small" title={t('examples.complexForm.basic.title', '基础信息')}>
              <Row gutter={12}>
                <Col xs={24} md={12} xl={isModal ? 12 : 8}>
                  <Form.Item
                    label={t('examples.complexForm.basic.customer', '客户')}
                    name="customer"
                    rules={[{ required: true }]}
                  >
                    <Select
                      showSearch
                      options={[
                        { label: '杭州云栖科技有限公司', value: '杭州云栖科技有限公司' },
                        { label: '上海数智制造集团', value: '上海数智制造集团' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={isModal ? 12 : 8}>
                  <Form.Item
                    label={t('examples.complexForm.basic.salesperson', '销售员')}
                    name="salesperson"
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={[
                        { label: '陈销售', value: '陈销售' },
                        { label: '周销售', value: '周销售' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={isModal ? 12 : 8}>
                  <Form.Item
                    label={t('examples.complexForm.basic.orderType', '订单类型')}
                    name="orderType"
                  >
                    <Select
                      options={[
                        {
                          label: t('examples.complexForm.orderType.standard', '标准订单'),
                          value: 'standard',
                        },
                        {
                          label: t('examples.complexForm.orderType.custom', '定制订单'),
                          value: 'custom',
                        },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={isModal ? 12 : 8}>
                  <Form.Item
                    label={t('examples.complexForm.basic.orderDate', '下单日期')}
                    name="orderDate"
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={isModal ? 12 : 8}>
                  <Form.Item
                    label={t('examples.complexForm.basic.expectedDeliveryDate', '期望交货日期')}
                    name="expectedDeliveryDate"
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={isModal ? 12 : 8}>
                  <Form.Item
                    label={t('examples.complexForm.basic.contact', '联系人')}
                    name="contact"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={isModal ? 12 : 8}>
                  <Form.Item
                    label={t('examples.complexForm.basic.contactPhone', '联系电话')}
                    name="contactPhone"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card size="small" title={t('examples.complexForm.shipping.title', '收货信息')}>
              <Row gutter={12}>
                <Col xs={24} lg={12}>
                  <Form.Item
                    label={t('examples.complexForm.shipping.address', '收货地址')}
                    name="address"
                    rules={[{ required: true }]}
                  >
                    <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} lg={6}>
                  <Form.Item
                    label={t('examples.complexForm.shipping.receiver', '联系人')}
                    name="receiver"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} lg={6}>
                  <Form.Item
                    label={t('examples.complexForm.shipping.receiverPhone', '联系电话')}
                    name="receiverPhone"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card size="small" title={t('examples.complexForm.logistics.title', '物流信息')}>
              <Row gutter={12}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('examples.complexForm.logistics.company', '物流公司')}
                    name="logisticsCompany"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('examples.complexForm.logistics.no', '物流单号')}
                    name="logisticsNo"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('examples.complexForm.logistics.fee', '物流费用')}
                    name="logisticsFee"
                  >
                    <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              title={t('examples.complexForm.detail.title', '销售明细')}
              extra={
                <Button size="small" icon={<PlusOutlined />}>
                  {t('examples.complexForm.action.addDetail', '添加明细')}
                </Button>
              }
            >
              <Table<SalesItem>
                rowKey="key"
                size="small"
                columns={salesColumns}
                dataSource={salesItems}
                pagination={false}
                scroll={{ x: 1180 }}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={6}>
                      <Typography.Text strong>
                        {t('examples.complexForm.detail.subtotal', '明细小计')}
                      </Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      <Typography.Text strong>{formatCurrency(detailTotal)}</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} colSpan={2} />
                  </Table.Summary.Row>
                )}
              />
            </Card>

            <Card
              size="small"
              title={t('examples.complexForm.fee.title', '费用信息')}
              extra={
                <Button size="small" icon={<PlusOutlined />}>
                  {t('examples.complexForm.action.addFee', '添加费用')}
                </Button>
              }
            >
              <Row gutter={[12, 12]}>
                <Col xs={24} md={8}>
                  <Form.Item label={t('examples.complexForm.fee.discount', '折扣')} name="discount">
                    <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={16}>
                  <Form.Item label={t('examples.complexForm.fee.remark', '备注')} name="feeRemark">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Table<OtherFee>
                rowKey="key"
                size="small"
                columns={feeColumns}
                dataSource={otherFees}
                pagination={false}
              />
            </Card>

            <Card size="small" title={t('examples.complexForm.other.title', '其他信息')}>
              <Row gutter={12}>
                <Col xs={24} lg={12}>
                  <Form.Item label={t('examples.complexForm.other.remark', '备注')} name="remark">
                    <Input.TextArea
                      autoSize={{ minRows: 4, maxRows: 8 }}
                      placeholder={t(
                        'examples.complexForm.other.remarkPlaceholder',
                        '填写订单特殊约定、开票要求或内部备注',
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} lg={12}>
                  <Form.Item
                    label={t('examples.complexForm.other.attachment', '附件')}
                    name="attachments"
                  >
                    <TrueAdminAttachmentUpload
                      multiple
                      maxCount={5}
                      title={t(
                        'examples.complexForm.other.uploadTitle',
                        '拖拽合同、报价单或附件到这里',
                      )}
                      hint={t(
                        'examples.complexForm.other.uploadHint',
                        '支持多文件上传，提交前不会真实上传。',
                      )}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Space>
        </Col>

        <Col xs={24} xl={sideSpan}>
          <div className="trueadmin-complex-form-side">
            <Card size="small" title={t('examples.complexForm.amount.title', '金额统计')}>
              <div className="trueadmin-complex-form-amount-row">
                <span>{t('examples.complexForm.amount.detailTotal', '商品金额')}</span>
                <Typography.Text>{formatCurrency(detailTotal)}</Typography.Text>
              </div>
              <div className="trueadmin-complex-form-amount-row">
                <span>{t('examples.complexForm.amount.otherFees', '其他费用')}</span>
                <Typography.Text>{formatCurrency(feeTotal)}</Typography.Text>
              </div>
              <div className="trueadmin-complex-form-amount-row">
                <span>{t('examples.complexForm.amount.logisticsFee', '物流费用')}</span>
                <Typography.Text>{formatCurrency(logisticsFee)}</Typography.Text>
              </div>
              <div className="trueadmin-complex-form-amount-row is-negative">
                <span>{t('examples.complexForm.amount.discount', '折扣')}</span>
                <Typography.Text>-{formatCurrency(discount)}</Typography.Text>
              </div>
              <Divider />
              <div className="trueadmin-complex-form-amount-row is-total">
                <span>{t('examples.complexForm.amount.receivable', '应收金额')}</span>
                <Typography.Text>{formatCurrency(receivableAmount)}</Typography.Text>
              </div>
            </Card>

            <Card size="small" title={t('examples.complexForm.prepay.title', '预付款信息')}>
              <Form.Item
                label={t('examples.complexForm.prepay.method', '付款方式')}
                name="prepayMethod"
              >
                <Select
                  options={[
                    {
                      label: t('examples.complexForm.prepay.method.bank', '银行转账'),
                      value: 'bank',
                    },
                    { label: t('examples.complexForm.prepay.method.cash', '现金'), value: 'cash' },
                  ]}
                />
              </Form.Item>
              <Form.Item
                label={t('examples.complexForm.prepay.amount', '预付款金额')}
                name="prepaidAmount"
              >
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                label={t('examples.complexForm.prepay.date', '预付款日期')}
                name="prepayDate"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <div className="trueadmin-complex-form-amount-row is-balance">
                <span>{t('examples.complexForm.amount.balance', '待收余额')}</span>
                <Typography.Text>{formatCurrency(balanceAmount)}</Typography.Text>
              </div>
            </Card>

            <Card size="small" title={t('examples.complexForm.process.title', '订单状态')}>
              <Space wrap size={6}>
                <Tag color="processing">{t('examples.complexForm.process.draft', '草稿')}</Tag>
                <Tag>{t('examples.complexForm.process.audit', '待审核')}</Tag>
                <Tag>{t('examples.complexForm.process.delivery', '待交付')}</Tag>
              </Space>
            </Card>
          </div>
        </Col>
      </Row>
    </Form>
  );
}

export default function ComplexFormExamplePage() {
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);

  const headerExtra = (
    <Space size={8} wrap>
      <Button onClick={() => setModalOpen(true)}>
        {t('examples.complexForm.action.openModal', '弹窗承接')}
      </Button>
      <Button>{t('examples.complexForm.action.cancel', '取消')}</Button>
      <Button icon={<SaveOutlined />}>
        {t('examples.complexForm.action.saveDraft', '保存草稿')}
      </Button>
      <Button type="primary" icon={<SendOutlined />}>
        {t('examples.complexForm.action.submit', '提交订单')}
      </Button>
    </Space>
  );

  return (
    <>
      <TrueAdminFormPage
        showHeader
        title={t('examples.complexForm.title', '复杂表单示例')}
        description={t(
          'examples.complexForm.description',
          '销售订单表单，覆盖分块录入、明细表格、费用与金额统计。',
        )}
        extra={headerExtra}
      >
        <SalesOrderFormBody />
      </TrueAdminFormPage>
      <TrueAdminPageModal
        title={t('examples.complexForm.modal.title', '销售订单')}
        open={modalOpen}
        className="trueadmin-complex-form-modal"
        scrollClassName="trueadmin-complex-form-modal-shadow"
        scrollContentClassName="trueadmin-complex-form-modal-body"
        footer={
          <Space size={8} wrap>
            <Button onClick={() => setModalOpen(false)}>
              {t('examples.complexForm.action.cancel', '取消')}
            </Button>
            <Button icon={<SaveOutlined />}>
              {t('examples.complexForm.action.saveDraft', '保存草稿')}
            </Button>
            <Button type="primary" icon={<SendOutlined />}>
              {t('examples.complexForm.action.submit', '提交订单')}
            </Button>
          </Space>
        }
        onCancel={() => setModalOpen(false)}
      >
        <SalesOrderFormBody variant="modal" />
      </TrueAdminPageModal>
    </>
  );
}
