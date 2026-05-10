import { type TrueAdminImageUploadResult, uploadTrueAdminFile } from '@/core/upload';

export const systemUploadApi = {
  image: async (file: File): Promise<TrueAdminImageUploadResult> =>
    uploadTrueAdminFile(file, { category: 'menu-icon', visibility: 'public' }),
};
