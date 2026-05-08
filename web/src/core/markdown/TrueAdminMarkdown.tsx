import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TrueAdminMarkdownProps } from './types';

export function TrueAdminMarkdown({
  className,
  emptyText = '-',
  size = 'middle',
  value,
}: TrueAdminMarkdownProps) {
  const content = value?.trim();

  if (!content) {
    return (
      <div
        className={['trueadmin-markdown', `is-${size}`, 'is-empty', className]
          .filter(Boolean)
          .join(' ')}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div className={['trueadmin-markdown', `is-${size}`, className].filter(Boolean).join(' ')}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
        {content}
      </ReactMarkdown>
    </div>
  );
}
