import { describe, expect, it } from 'vitest';
import {
  batchStatusColor,
  deliveryStatusColor,
  levelColor,
  toPlainText,
} from './notificationManagementModel';

describe('notificationManagementModel', () => {
  it('keeps status color maps aligned with notification states', () => {
    expect(batchStatusColor).toEqual({
      completed: 'success',
      failed: 'error',
      partial_failed: 'warning',
      sending: 'processing',
    });

    expect(deliveryStatusColor).toEqual({
      failed: 'error',
      pending: 'processing',
      sent: 'success',
      skipped: 'default',
    });

    expect(levelColor.warning).toBe('warning');
  });

  it('converts markdown notification content to plain summary text', () => {
    expect(
      toPlainText(
        `# Title\n\n> quote\n\n**important** [link](https://example.com)\n\n\`\`\`ts\nignored()\n\`\`\``,
      ),
    ).toBe('Title quote important link https://example.com');
  });
});
