import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import type { ButtonProps, SpaceProps } from 'antd';
import { Button, Dropdown, Space, Tooltip } from 'antd';
import type { ReactNode } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';

export type TrueAdminExportType = 'page' | 'selected' | 'all';

export type TrueAdminImportExportProps = {
  importConfig?:
    | false
    | {
        disabled?: boolean;
        tooltip?: ReactNode;
        buttonProps?: Omit<ButtonProps, 'icon' | 'onClick'>;
        onClick?: () => void;
      };
  exportConfig?:
    | false
    | {
        disabled?: boolean;
        tooltip?: ReactNode;
        options?: TrueAdminExportType[];
        selectedDisabled?: boolean;
        buttonProps?: Omit<ButtonProps, 'icon'>;
        onExport?: (type: TrueAdminExportType) => void;
      };
  spaceProps?: Omit<SpaceProps, 'children'>;
};

const DEFAULT_EXPORT_OPTIONS: TrueAdminExportType[] = ['page', 'selected', 'all'];

export function TrueAdminImportExport({
  importConfig,
  exportConfig,
  spaceProps,
}: TrueAdminImportExportProps) {
  const { t } = useI18n();
  const mergedImportConfig = importConfig || undefined;
  const mergedExportConfig = exportConfig || undefined;
  const importText = mergedImportConfig?.tooltip ?? t('crud.action.import', '导入');
  const exportText = mergedExportConfig?.tooltip ?? t('crud.action.export', '导出');
  const exportOptions = mergedExportConfig?.options ?? DEFAULT_EXPORT_OPTIONS;

  return (
    <Space {...spaceProps} size={spaceProps?.size ?? 8} wrap={spaceProps?.wrap ?? false}>
      {mergedImportConfig ? (
        <Tooltip title={importText}>
          <Button
            {...mergedImportConfig.buttonProps}
            aria-label={String(importText)}
            disabled={mergedImportConfig.disabled || mergedImportConfig.buttonProps?.disabled}
            icon={<UploadOutlined />}
            onClick={mergedImportConfig.onClick}
          />
        </Tooltip>
      ) : null}
      {mergedExportConfig ? (
        <Dropdown
          disabled={mergedExportConfig.disabled}
          menu={{
            items: exportOptions.map((type) => ({
              disabled: type === 'selected' && mergedExportConfig.selectedDisabled,
              key: type,
              label:
                type === 'page'
                  ? t('crud.export.currentPage', '导出当页')
                  : type === 'selected'
                    ? t('crud.export.selected', '导出选中')
                    : t('crud.export.filteredAll', '导出全部结果'),
            })),
            onClick: ({ key }) => mergedExportConfig.onExport?.(key as TrueAdminExportType),
          }}
        >
          <Tooltip title={exportText}>
            <Button
              {...mergedExportConfig.buttonProps}
              aria-label={String(exportText)}
              icon={<DownloadOutlined />}
            />
          </Tooltip>
        </Dropdown>
      ) : null}
    </Space>
  );
}
