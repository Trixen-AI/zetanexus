import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/martian-mono';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';
import './styles/zrail.css';
import './styles/zrail-layout.css';
import App from './App';
import { NotFound } from './NotFound';

function RouteLoading() {
  return <div className="route-loading" role="status" aria-label="Loading" />;
}

/**
 * Routes. The marketing site is the eager bundle; the dashboard (wallet, wagmi,
 * Reown AppKit) and the customer payment page are separate lazy chunks, so a
 * visitor reading the website never downloads wallet code.
 */
const page = (load: () => Promise<Record<string, React.ComponentType>>, name: string) => async () => ({
  Component: (await load())[name],
});

const router = createBrowserRouter([
  { path: '/', Component: App, HydrateFallback: RouteLoading },
  {
    path: '/app',
    HydrateFallback: RouteLoading,
    lazy: page(() => import('./dashboard/DashboardRoot'), 'DashboardRoot'),
    children: [
      { index: true, lazy: page(() => import('./dashboard/pages/Overview'), 'Overview') },
      { path: 'checkouts', lazy: page(() => import('./dashboard/pages/Checkouts'), 'Checkouts') },
      { path: 'checkouts/new', lazy: page(() => import('./dashboard/pages/NewCheckout'), 'NewCheckout') },
      { path: 'checkouts/:id', lazy: page(() => import('./dashboard/pages/CheckoutDetail'), 'CheckoutDetail') },
      { path: 'settlements', lazy: page(() => import('./dashboard/pages/Settlements'), 'Settlements') },
      { path: 'verify', lazy: page(() => import('./dashboard/pages/Verify'), 'Verify') },
      { path: 'developers', lazy: page(() => import('./dashboard/pages/Developers'), 'Developers') },
      { path: 'settings', lazy: page(() => import('./dashboard/pages/Settings'), 'Settings') },
      { path: 'market', lazy: page(() => import('./dashboard/pages/Market'), 'Market') },
      { path: 'earn', lazy: page(() => import('./dashboard/pages/Earn'), 'Earn') },
      { path: '*', Component: NotFound },
    ],
  },
  { path: '/pay/:token', HydrateFallback: RouteLoading, lazy: page(() => import('./dashboard/pay/PayPage'), 'PayPage') },
  { path: '*', Component: NotFound },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
