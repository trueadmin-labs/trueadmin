import { TrueAdminImageUpload } from '@/core/upload';
import { systemUploadApi } from '../../services/upload.api';

type MenuIconImageInputProps = {
  value?: string;
  onChange?: (value?: string) => void;
};

export function MenuIconImageInput({ value, onChange }: MenuIconImageInputProps) {
  const imageValue = value
    ? {
        id: value,
        name: 'menu-icon',
        url: value,
      }
    : null;

  return (
    <TrueAdminImageUpload
      value={imageValue}
      onChange={(nextValue) => {
        const image = Array.isArray(nextValue) ? nextValue[0] : nextValue;
        onChange?.(image?.url ?? '');
      }}
      upload={systemUploadApi.image}
      previewSize={64}
    />
  );
}
