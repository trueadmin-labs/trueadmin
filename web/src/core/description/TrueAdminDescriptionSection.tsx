import type { DescriptionsProps } from 'antd';
import { Descriptions } from 'antd';
import type { ReactNode } from 'react';
import {
  TrueAdminPageSection,
  type TrueAdminPageSectionProps,
} from '@/core/page/TrueAdminPageSection';

export type TrueAdminDescriptionItem = {
  key?: React.Key;
  label: ReactNode;
  children?: ReactNode;
  span?: number;
};

export type TrueAdminDescriptionSectionProps = Omit<TrueAdminPageSectionProps, 'children'> & {
  items: TrueAdminDescriptionItem[];
  column?: DescriptionsProps['column'];
  bordered?: boolean;
  size?: DescriptionsProps['size'];
  emptyText?: ReactNode;
  descriptionsProps?: Omit<DescriptionsProps, 'children' | 'items'>;
};

export function TrueAdminDescriptionSection({
  items,
  column = { xs: 1, md: 2, xl: 3 },
  bordered = false,
  size = 'small',
  emptyText = '-',
  descriptionsProps,
  ...sectionProps
}: TrueAdminDescriptionSectionProps) {
  return (
    <TrueAdminPageSection {...sectionProps}>
      <Descriptions
        {...descriptionsProps}
        bordered={bordered}
        column={column}
        size={size}
        items={items.map((item) => ({
          key: item.key ?? String(item.label),
          label: item.label,
          children: item.children ?? emptyText,
          span: item.span,
        }))}
      />
    </TrueAdminPageSection>
  );
}
