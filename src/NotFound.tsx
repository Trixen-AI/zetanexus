import { Link, useLocation } from 'react-router';

export function NotFound() {
  const { pathname } = useLocation();
  const inApp = pathname.startsWith('/app');
  return (
    <div className="dash-notfound container">
      <p className="eyebrow">404</p>
      <h1 className="dash-gate-title">Nothing at {pathname}</h1>
      <div className="hero-actions">
        <Link to={inApp ? '/app' : '/'} className="btn btn--ink">
          {inApp ? 'Back to dashboard' : 'Back to website'}
        </Link>
      </div>
    </div>
  );
}
