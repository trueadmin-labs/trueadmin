import { EyeOutlined, FormOutlined } from '@ant-design/icons';
import { Input, Segmented, Space, Typography } from 'antd';
import { useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminMarkdown } from './TrueAdminMarkdown';
import type { TrueAdminMarkdownEditorProps } from './types';

type MarkdownEditorMode = 'edit' | 'preview';

export function TrueAdminMarkdownEditor({
  className,
  editorTitle,
  emptyText,
  onChange,
  previewTitle,
  size = 'middle',
  value,
  ...textAreaProps
}: TrueAdminMarkdownEditorProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<MarkdownEditorMode>('edit');
  const mergedEditorTitle = editorTitle ?? t('markdown.editor.edit', '编辑');
  const mergedPreviewTitle = previewTitle ?? t('markdown.editor.preview', '预览');

  return (
    <div
      className={['trueadmin-markdown-editor', `is-${size}`, className].filter(Boolean).join(' ')}
    >
      <div className="trueadmin-markdown-editor-toolbar">
        <Space size={8}>
          <Typography.Text strong>{mergedEditorTitle}</Typography.Text>
          <Typography.Text type="secondary">
            {t('markdown.editor.htmlDisabled', '不支持原始 HTML')}
          </Typography.Text>
        </Space>
        <Segmented<MarkdownEditorMode>
          size="small"
          value={mode}
          options={[
            { icon: <FormOutlined />, label: mergedEditorTitle, value: 'edit' },
            { icon: <EyeOutlined />, label: mergedPreviewTitle, value: 'preview' },
          ]}
          onChange={setMode}
        />
      </div>
      {mode === 'edit' ? (
        <Input.TextArea
          {...textAreaProps}
          className="trueadmin-markdown-editor-input"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        />
      ) : (
        <div className="trueadmin-markdown-editor-preview">
          <TrueAdminMarkdown emptyText={emptyText} size={size} value={value} />
        </div>
      )}
    </div>
  );
}
