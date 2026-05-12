import type { LayoutMode } from '@/core/store/layoutStore';

export const colorPresets = [
  { label: '商务蓝', value: '#2f54eb' },
  { label: '深海蓝', value: '#1d39c4' },
  { label: '典雅黑', value: '#334155' },
  { label: '湖泊青', value: '#08979c' },
  { label: '松石绿', value: '#237804' },
  { label: '冷杉绿', value: '#0f766e' },
  { label: '沉稳靛', value: '#4338ca' },
  { label: '石墨紫', value: '#531dab' },
];

export const layoutOptions: Array<{
  label: string;
  value: LayoutMode;
  disabled?: boolean;
}> = [
  { label: 'Classic', value: 'classic' },
  { label: 'Mixed', value: 'mixed' },
  { label: 'Columns', value: 'columns' },
];
