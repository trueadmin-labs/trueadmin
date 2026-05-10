import { http } from '@/core/http/client';
import type { TrueAdminImageUploadResult } from '@/core/upload';

export const systemUploadApi = {
  image: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return http
      .Post<TrueAdminImageUploadResult>('/admin/system-config/uploads/image', formData)
      .send();
  },
};
