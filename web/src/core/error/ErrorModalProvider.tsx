import { type ApiError, errorCenter } from '@trueadmin/web-core/error';
import { App } from 'antd';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { isAuthUnauthorizedCode } from '@/core/auth/session';
import { ApiErrorModal } from './ApiErrorModal';

export function ErrorModalProvider({ children }: { children: ReactNode }) {
  const { message } = App.useApp();
  const [currentError, setCurrentError] = useState<ApiError | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(
    () =>
      errorCenter.subscribe(({ error, policy }) => {
        if (isAuthUnauthorizedCode(error.code)) {
          return;
        }
        if (policy?.mode === 'silent' || policy?.mode === 'form' || policy?.mode === 'page') {
          return;
        }

        if (policy?.mode === 'message') {
          message.error(error.message);
          return;
        }

        setCurrentError(error);
        setOpen(true);
      }),
    [message],
  );

  return (
    <>
      {children}
      <ApiErrorModal
        error={currentError}
        open={open}
        onClose={() => setOpen(false)}
        afterOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setCurrentError(null);
          }
        }}
      />
    </>
  );
}
