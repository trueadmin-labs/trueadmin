import type { TextAreaProps } from 'antd/es/input';
import type { ReactNode } from 'react';

export type TrueAdminMarkdownSize = 'small' | 'middle';

export type TrueAdminMarkdownProps = {
  value?: string;
  emptyText?: ReactNode;
  className?: string;
  size?: TrueAdminMarkdownSize;
};

export type TrueAdminMarkdownEditorProps = Omit<TextAreaProps, 'onChange' | 'value'> & {
  value?: string;
  onChange?: (value: string) => void;
  emptyText?: ReactNode;
  editorTitle?: ReactNode;
  previewTitle?: ReactNode;
  size?: TrueAdminMarkdownSize;
};
