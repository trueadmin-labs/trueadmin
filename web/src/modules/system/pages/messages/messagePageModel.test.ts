import { describe, expect, it } from 'vitest';
import { splitRange, toMessageRowKey, toPlainText } from './messagePageModel';

describe('messagePageModel', () => {
  it('splits comma separated range values', () => {
    expect(splitRange('2026-05-12,2026-05-13')).toEqual(['2026-05-12', '2026-05-13']);
    expect(splitRange('')).toEqual([]);
    expect(splitRange(undefined)).toEqual([]);
  });

  it('creates stable row keys from message kind and id', () => {
    expect(toMessageRowKey({ id: 12, kind: 'notification' })).toBe('notification:12');
    expect(toMessageRowKey({ id: 7, kind: 'announcement' })).toBe('announcement:7');
  });

  it('converts markdown message content to plain summary text', () => {
    expect(
      toPlainText(
        `# Title\n\n> quote\n\n**important** [link](https://example.com)\n\n\`\`\`ts\nignored()\n\`\`\``,
      ),
    ).toBe('Title quote important link https://example.com');
  });
});
