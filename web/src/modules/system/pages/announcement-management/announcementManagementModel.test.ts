import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import {
  getInitialAnnouncementValues,
  toMinuteDateTime,
  toPlainText,
} from './announcementManagementModel';

describe('announcementManagementModel', () => {
  it('creates stable initial form values', () => {
    expect(getInitialAnnouncementValues()).toEqual({
      attachments: [],
      content: undefined,
      expireAt: null,
      level: 'info',
      pinned: false,
      scheduledAt: null,
      targetRoleIds: undefined,
      targetType: 'all',
      title: undefined,
    });
  });

  it('converts rich markdown content to plain summary text', () => {
    expect(
      toPlainText(
        `# Title\n\n> quote\n\n**important** [link](https://example.com)\n\n\`\`\`ts\nignored()\n\`\`\``,
      ),
    ).toBe('Title quote important link https://example.com');
  });

  it('formats date values to minute precision', () => {
    expect(toMinuteDateTime(null)).toBeNull();
    expect(toMinuteDateTime(undefined)).toBeNull();
    expect(toMinuteDateTime('2026-05-12 10:30')).toBe('2026-05-12 10:30');
    expect(toMinuteDateTime(dayjs('2026-05-12 10:30:59'))).toBe('2026-05-12 10:30');
  });
});
