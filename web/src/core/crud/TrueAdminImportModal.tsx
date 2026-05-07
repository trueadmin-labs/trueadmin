import { DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import { Alert, Button, Modal, Space, Typography, Upload } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import { useState } from 'react';
import type { CrudImportConfig, CrudTableRenderContext } from './types';

type TrueAdminImportModalProps = {
  config?: CrudImportConfig<Record<string, unknown>, unknown, unknown, unknown>;
  context: CrudTableRenderContext<Record<string, unknown>, unknown, unknown, unknown>;
  open: boolean;
  t: (key?: string, fallback?: string) => string;
  onClose: () => void;
};

type NormalizedImportConfig = Exclude<
  CrudImportConfig<Record<string, unknown>, unknown, unknown, unknown>,
  boolean
>;

const toImportConfig = (
  config?: CrudImportConfig<Record<string, unknown>, unknown, unknown, unknown>,
): NormalizedImportConfig | undefined => {
  if (!config) {
    return undefined;
  }
  return config === true ? {} : config;
};

export function TrueAdminImportModal({
  config,
  context,
  open,
  t,
  onClose,
}: TrueAdminImportModalProps) {
  const mergedConfig = toImportConfig(config);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const selectedFile = fileList[0]?.originFileObj;

  const closeModal = () => {
    if (submitting) {
      return;
    }
    setFileList([]);
    onClose();
  };

  const handleConfirm = async () => {
    if (!selectedFile || !mergedConfig?.onConfirm) {
      return;
    }

    setSubmitting(true);
    try {
      await mergedConfig.onConfirm(selectedFile, context);
      context.action.reload();
      setFileList([]);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={mergedConfig?.title ?? t('crud.import.title', '导入数据')}
      open={open}
      width={520}
      okText={t('crud.import.confirm', '确认导入')}
      cancelText={t('crud.import.cancel', '取消')}
      confirmLoading={submitting}
      okButtonProps={{ disabled: !selectedFile || !mergedConfig?.onConfirm }}
      onCancel={closeModal}
      onOk={handleConfirm}
      destroyOnHidden
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div className="trueadmin-crud-import-modal-header">
          {mergedConfig?.description ? (
            <Typography.Text type="secondary">{mergedConfig.description}</Typography.Text>
          ) : null}
          {mergedConfig?.template ? (
            <Button
              type="link"
              icon={<DownloadOutlined />}
              disabled={mergedConfig.template.disabled}
              onClick={() => mergedConfig.template?.onDownload?.(context)}
            >
              {mergedConfig.template.label ?? t('crud.import.downloadTemplate', '下载导入模板')}
            </Button>
          ) : null}
        </div>
        <Upload.Dragger
          accept={mergedConfig?.accept}
          beforeUpload={(file) => {
            setFileList([
              {
                uid: file.uid,
                name: file.name,
                size: file.size,
                type: file.type,
                originFileObj: file as RcFile,
              },
            ]);
            return false;
          }}
          fileList={fileList}
          maxCount={1}
          onRemove={() => setFileList([])}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {t('crud.import.dragTitle', '拖拽文件到这里，或点击选择文件')}
          </p>
          <p className="ant-upload-hint">
            {mergedConfig?.accept
              ? t('crud.import.acceptHint', '支持文件类型：{{accept}}').replace(
                  '{{accept}}',
                  mergedConfig.accept,
                )
              : t('crud.import.defaultHint', '请选择要导入的数据文件。')}
          </p>
        </Upload.Dragger>
        {!mergedConfig?.onConfirm ? (
          <Alert
            type="info"
            showIcon
            message={t('crud.import.noConfirmHandler', '当前页面尚未配置确认导入处理。')}
          />
        ) : null}
      </Space>
    </Modal>
  );
}
