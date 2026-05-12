import { appConfig } from '@config/index';
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/app/layout/AppLayout';
import { ModuleMissing } from '@/app/layout/ModuleMissing';
import { frontendRoutes } from '@/core/module/registry';
import { TrueAdminPageLoading } from '@/core/page';

const LoginPage = lazy(() => import('@/app/pages/LoginPage'));
const ForbiddenPage = lazy(() => import('@/app/pages/ForbiddenPage'));

const withSuspense = (element: React.ReactNode, fullscreen = false) => (
  <Suspense fallback={<TrueAdminPageLoading fullscreen={fullscreen} />}>{element}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(<LoginPage />, true),
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={appConfig.defaultHome} replace /> },
      { path: '403', element: withSuspense(<ForbiddenPage />) },
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
