import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import type { CSSProperties } from 'react';
import type { TrueAdminImageId, TrueAdminImageValue } from './imageUploadUtils';

type TrueAdminImageUploadItemProps = {
  file: TrueAdminImageValue;
  readonly: boolean;
  sizeStyle?: CSSProperties;
  t: (key: string, fallback?: string) => string;
  onPreview: (file: TrueAdminImageValue) => void;
  onRemove: (id: TrueAdminImageId) => void;
};

export function TrueAdminImageUploadItem({
  file,
  readonly,
  sizeStyle,
  t,
  onPreview,
  onRemove,
}: TrueAdminImageUploadItemProps) {
  return (
    <div className="trueadmin-image-upload-item" style={sizeStyle}>
      <img src={file.url} alt={file.name} />
      <div className="trueadmin-image-upload-mask">
        <Tooltip title={t('upload.image.preview', '预览')}>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onPreview(file)} />
        </Tooltip>
        {!readonly ? (
          <Tooltip title={t('upload.image.remove', '移除')}>
            <Button
              danger
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onRemove(file.id)}
            />
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}
