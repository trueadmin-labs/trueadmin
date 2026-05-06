import { appConfig } from '@config/index';
import { Spin } from 'antd';
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/app/layout/AppLayout';
import { ModuleMissing } from '@/app/layout/ModuleMissing';
import { frontendRoutes } from '@/core/module/registry';

const LoginPage = lazy(() => import('@/app/pages/LoginPage'));

const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<Spin fullscreen description="正在进入页面" />}>{element}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(<LoginPage />),
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={appConfig.defaultHome} replace /> },
      ...frontendRoutes.map((route) => {
        const Component = route.component;
        return {
          path: route.path.replace(/^\//, ''),
          element: withSuspense(<Component />),
        };
      }),
      { path: '*', element: <ModuleMissing /> },
    ],
  },
]);
