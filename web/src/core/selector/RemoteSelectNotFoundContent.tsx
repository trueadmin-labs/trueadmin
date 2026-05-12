import { Spin } from 'antd';
import type { ReactNode } from 'react';

export function RemoteSelectNotFoundContent({
  emptyText,
  loading,
  loadingText,
}: {
  emptyText?: ReactNode;
  loading: boolean;
  loadingText?: ReactNode;
}) {
  if (!loading) {
    return emptyText;
  }

  return (
    <div className="trueadmin-remote-select-loading">
      <Spin size="small" />
      {loadingText ? <span>{loadingText}</span> : null}
    </div>
  );
}
