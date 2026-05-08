import { Card, Space } from 'antd';
import { useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';
import { TrueAdminAttachmentUpload, type TrueAdminAttachmentValue } from '@/core/upload';
import { initialExampleFiles } from './shared';

export default function AttachmentExamplePage() {
  const { t } = useI18n();
  const [files, setFiles] = useState<TrueAdminAttachmentValue[]>(initialExampleFiles);

  return (
    <TrueAdminPage
      title={t('examples.attachment.title', '附件上传示例')}
      description={t('examples.attachment.description', '展示附件列表、预览、下载和只读展示。')}
      contentAlign="center"
      contentWidth={920}
    >
      <Space orientation="vertical" size={12} className="trueadmin-example-stack">
        <Card size="small" title={t('examples.components.upload.title', '附件上传')}>
          <TrueAdminAttachmentUpload
            multiple
            value={files}
            title={t('examples.components.upload.dragTitle', '拖拽附件到这里，或点击选择')}
            hint={t('examples.components.upload.hint', '示例不会真实上传文件，适合表单附件场景。')}
            onChangeValue={setFiles}
          />
        </Card>
        <Card size="small" title={t('examples.attachment.readonly', '只读附件')}>
          <TrueAdminAttachmentUpload readonly value={files} />
        </Card>
      </Space>
    </TrueAdminPage>
  );
}
