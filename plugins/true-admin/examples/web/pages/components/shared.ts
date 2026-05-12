import type { TrueAdminAttachmentValue } from '@/core/upload';

export const initialExampleFiles: TrueAdminAttachmentValue[] = [
  {
    id: 'preview-contract',
    name: '销售合同示例',
    url: '/mock/attachments/sales-contract.pdf',
    extension: 'pdf',
    size: 245760,
    mimeType: 'application/pdf',
  },
  {
    id: 'preview-image',
    name: '产品截图示例',
    url: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22960%22%20height%3D%22540%22%20viewBox%3D%220%200%20960%20540%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20x2%3D%221%22%20y1%3D%220%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%231677ff%22/%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2322a06b%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width%3D%22960%22%20height%3D%22540%22%20rx%3D%2224%22%20fill%3D%22url%28%23g%29%22/%3E%3Crect%20x%3D%2272%22%20y%3D%2280%22%20width%3D%22816%22%20height%3D%22380%22%20rx%3D%2218%22%20fill%3D%22white%22%20fill-opacity%3D%220.92%22/%3E%3Crect%20x%3D%22112%22%20y%3D%22124%22%20width%3D%22280%22%20height%3D%2228%22%20rx%3D%2214%22%20fill%3D%22%231677ff%22%20fill-opacity%3D%220.18%22/%3E%3Crect%20x%3D%22112%22%20y%3D%22186%22%20width%3D%22736%22%20height%3D%2222%22%20rx%3D%2211%22%20fill%3D%22%23000000%22%20fill-opacity%3D%220.12%22/%3E%3Crect%20x%3D%22112%22%20y%3D%22236%22%20width%3D%22580%22%20height%3D%2222%22%20rx%3D%2211%22%20fill%3D%22%23000000%22%20fill-opacity%3D%220.10%22/%3E%3Crect%20x%3D%22112%22%20y%3D%22296%22%20width%3D%22196%22%20height%3D%2288%22%20rx%3D%2216%22%20fill%3D%22%231677ff%22%20fill-opacity%3D%220.12%22/%3E%3Crect%20x%3D%22348%22%20y%3D%22296%22%20width%3D%22196%22%20height%3D%2288%22%20rx%3D%2216%22%20fill%3D%22%2322a06b%22%20fill-opacity%3D%220.14%22/%3E%3Crect%20x%3D%22584%22%20y%3D%22296%22%20width%3D%22196%22%20height%3D%2288%22%20rx%3D%2216%22%20fill%3D%22%23faad14%22%20fill-opacity%3D%220.18%22/%3E%3Ctext%20x%3D%22480%22%20y%3D%22422%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2228%22%20font-weight%3D%22700%22%20fill%3D%22%231d1d1f%22%3ETrueAdmin%20Preview%3C/text%3E%3C/svg%3E',
    extension: 'svg',
    size: 184320,
    mimeType: 'image/svg+xml',
  },
];

export const createStatusOptions = (t: (key?: string, fallback?: string) => string) => [
  {
    label: t('examples.components.status.enabled', '已启用'),
    value: 'enabled',
    color: 'success',
  },
  {
    label: t('examples.components.status.disabled', '已禁用'),
    value: 'disabled',
    color: 'default',
  },
  {
    label: t('examples.components.status.pending', '待确认'),
    value: 'pending',
    color: 'processing',
  },
];
