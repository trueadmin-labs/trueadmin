import { describe, expect, it, vi } from 'vitest';
import {
  formatFileSize,
  getAttachmentDisplayName,
  getFileTypeLabel,
  isImageAttachment,
  normalizeAttachmentResult,
  splitName,
} from './attachmentUploadUtils';

describe('attachmentUploadUtils', () => {
  it('splits filenames only when they have a usable extension', () => {
    expect(splitName('report.PDF')).toEqual({ name: 'report', extension: 'pdf' });
    expect(splitName('.env')).toEqual({ name: '.env', extension: undefined });
    expect(splitName('README')).toEqual({ name: 'README', extension: undefined });
  });

  it('normalizes backend upload result variants', () => {
    const file = new File(['hello'], 'fallback.txt', { type: 'text/plain' });

    expect(
      normalizeAttachmentResult(
        {
          id: 10,
          origin_name: 'contract.DOCX',
          suffix: 'docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          url: '/uploads/contract.docx',
        },
        file,
      ),
    ).toEqual({
      id: 10,
      name: 'contract',
      url: '/uploads/contract.docx',
      extension: 'docx',
      size: 5,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  });

  it('falls back to object urls when backend url is absent', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local');
    const file = new File(['image'], 'avatar.PNG', { type: 'image/png' });

    expect(normalizeAttachmentResult(undefined, file)).toMatchObject({
      name: 'avatar',
      url: 'blob:local',
      extension: 'png',
      size: 5,
      mimeType: 'image/png',
    });
    expect(createObjectURL).toHaveBeenCalledWith(file);

    createObjectURL.mockRestore();
  });

  it('formats display metadata consistently', () => {
    expect(
      getAttachmentDisplayName({ id: 1, name: 'manual', extension: 'pdf', url: '/m.pdf' }),
    ).toBe('manual.pdf');
    expect(
      getFileTypeLabel({ id: 1, name: 'archive', extension: 'tar.gz', url: '/a.tar.gz' }),
    ).toBe('TAR.');
    expect(formatFileSize()).toBe('');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB');
  });

  it('detects image attachments by extension', () => {
    expect(isImageAttachment({ id: 1, name: 'cover', extension: 'WEBP', url: '/cover.webp' })).toBe(
      true,
    );
    expect(isImageAttachment({ id: 2, name: 'contract', extension: 'pdf', url: '/c.pdf' })).toBe(
      false,
    );
  });
});
