import { TrueAdminImportExport } from '@/core/import-export';
import type {
  CrudImportConfig,
  CrudImportExportConfig,
  CrudTableLocale,
  CrudTableRenderContext,
  CrudToolbarProps,
} from './types';

type TrueAdminToolbarImportExportProps = {
  context: CrudTableRenderContext<Record<string, unknown>, unknown, unknown, unknown>;
  config?: false | CrudImportExportConfig<Record<string, unknown>, unknown, unknown, unknown>;
  locale?: CrudTableLocale;
  selectedCount: number;
  toolbarProps?: CrudToolbarProps;
  t: (key?: string, fallback?: string) => string;
  onOpenImport: (
    config: CrudImportConfig<Record<string, unknown>, unknown, unknown, unknown>,
  ) => void;
};

export function TrueAdminToolbarImportExport({
  config,
  context,
  locale,
  selectedCount,
  toolbarProps,
  t,
  onOpenImport,
}: TrueAdminToolbarImportExportProps) {
  if (!config) {
    return null;
  }

  const importConfig = config.import === true ? {} : config.import;
  const exportConfig = config.export === true ? {} : config.export;
  const importText = locale?.importText ?? t('crud.action.import', '导入');
  const exportText = locale?.exportText ?? t('crud.action.export', '导出');

  return (
    <TrueAdminImportExport
      spaceProps={{
        className: toolbarProps?.classNames?.importExport,
        size: 8,
        style: toolbarProps?.styles?.importExport,
        wrap: false,
      }}
      importConfig={
        importConfig
          ? {
              disabled: importConfig.disabled || toolbarProps?.importButtonProps?.disabled,
              tooltip: importText,
              buttonProps: {
                ...toolbarProps?.importButtonProps,
                className: ['trueadmin-crud-icon-button', toolbarProps?.classNames?.importButton]
                  .filter(Boolean)
                  .join(' '),
                style: {
                  ...toolbarProps?.styles?.importButton,
                  ...toolbarProps?.importButtonProps?.style,
                },
              },
              onClick: () => onOpenImport(config.import ?? true),
            }
          : false
      }
      exportConfig={
        exportConfig
          ? {
              disabled: exportConfig.disabled,
              tooltip: exportText,
              options: exportConfig.options,
              selectedDisabled: selectedCount === 0,
              buttonProps: {
                ...toolbarProps?.exportButtonProps,
                className: ['trueadmin-crud-icon-button', toolbarProps?.classNames?.exportButton]
                  .filter(Boolean)
                  .join(' '),
                style: {
                  ...toolbarProps?.styles?.exportButton,
                  ...toolbarProps?.exportButtonProps?.style,
                },
              },
              onExport: (type) => exportConfig.onExport?.(type, context),
            }
          : false
      }
    />
  );
}
