import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useConnection, useSwitchChain } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import type { Address } from 'viem';
import { wagmiAdapter, walletReady } from './wallet';
import { CHAIN_ID, CHAIN_NAME } from './config';
import { MerchantProvider } from './merchant';
import { shortAddr } from './lib/format';
import { formatUsd, useZecPrice } from '../lib/zecPrice';
import { Logo } from '../brand/Logo';
import { RailField } from '../components/ui/RailField';
import { ZcashMark, RobinhoodChainLogo } from '../components/ui/AssetMarks';
import { IconArrowRight, IconClose, IconMenu } from '../components/ui/Icons';
import '../styles/dashboard.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 2 } } });

export function DashboardRoot() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Gate />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function Gate() {
  const { address, isConnected, status } = useConnection();
  if (!walletReady) return <SetupScreen />;
  if (status === 'reconnecting' || status === 'connecting') return <Splash label="Restoring wallet session" />;
  if (!isConnected || !address) return <ConnectScreen />;
  return (
    <MerchantProvider wallet={address as Address}>
      <Shell />
    </MerchantProvider>
  );
}

/* --- gates ---------------------------------------------------------------- */

function GateFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash-gate">
      <header className="dash-gate-bar container">
        <Link to="/" className="nav-logo" aria-label="ZKRail website">
          <Logo />
        </Link>
        <Link to="/" className="btn btn--ghost btn--sm">
          Back to website
        </Link>
      </header>
      <main className="container">
        <div className="dash-gate-card">
          <RailField className="hero-field" />
          <div className="dash-gate-body">{children}</div>
        </div>
      </main>
    </div>
  );
}

function ConnectScreen() {
  const { open } = useAppKit();
  return (
    <GateFrame>
      <p className="eyebrow">Merchant dashboard</p>
      <h1 className="dash-gate-title">Connect the wallet that receives your payouts.</h1>
      <p className="lede">
        ZKRail pays merchants on {CHAIN_NAME}. Connect the address your settlements land on to create checkouts, watch
        payouts arrive and reconcile orders against the chain.
      </p>
      <div className="hero-actions">
        <button type="button" className="btn btn--ink" onClick={() => void open({ view: 'Connect' })}>
          Connect wallet
          <IconArrowRight size={15} />
        </button>
        <Link to="/#how-it-works" className="btn btn--ghost">
          How settlement works
        </Link>
      </div>
      <ul className="dash-gate-facts">
        <li>
          <RobinhoodChainLogo height={13} />
          <span>Chain ID {CHAIN_ID}</span>
        </li>
        <li>Read-only until you sign something. Connecting never moves funds.</li>
      </ul>
    </GateFrame>
  );
}

function SetupScreen() {
  return (
    <GateFrame>
      <p className="eyebrow">Setup required</p>
      <h1 className="dash-gate-title">Add a Reown project ID to enable wallets.</h1>
      <p className="lede">
        Set <code>VITE_REOWN_PROJECT_ID</code> in <code>.env</code> (create one at dashboard.reown.com), then restart the dev
        server.
      </p>
    </GateFrame>
  );
}

function Splash({ label }: { label: string }) {
  return (
    <div className="dash-splash" role="status">
      <span className="dash-spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

/* --- shell ---------------------------------------------------------------- */

const NAV = [
  { to: '/app', label: 'Overview', end: true },
  { to: '/app/checkouts', label: 'Checkouts', end: false },
  { to: '/app/settlements', label: 'Settlements', end: false },
  { to: '/app/verify', label: 'Verify transaction', end: false },
  { to: '/app/developers', label: 'Developers', end: false },
  { to: '/app/market', label: 'Market', end: false },
  { to: '/app/earn', label: 'Earn', end: false },
  { to: '/app/settings', label: 'Settings', end: false },
];

function Shell() {
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();

  // new page: close the mobile menu and start at the top
  useEffect(() => {
    setMenu(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="dash">
      <aside className={`dash-side${menu ? ' is-open' : ''}`}>
        <div className="dash-side-top">
          <Link to="/app" className="nav-logo" aria-label="ZKRail dashboard home">
            <Logo />
          </Link>
        </div>
        <nav className="dash-nav" aria-label="Dashboard">
          {NAV.map((item, i) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `dash-nav-link${isActive ? ' is-active' : ''}`}>
              <span className="nav-index">{String(i + 1).padStart(2, '0')}.</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="dash-side-foot">
          <Link to="/app/checkouts/new" className="btn btn--brand dash-side-cta">
            New checkout
          </Link>
          <Link to="/" className="dash-side-back">
            Back to website
          </Link>
        </div>
      </aside>

      <div className="dash-main">
        <TopBar menu={menu} onMenu={() => setMenu((v) => !v)} />
        <NetworkBanner />
        <main className="dash-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function TopBar({ menu, onMenu }: { menu: boolean; onMenu: () => void }) {
  const { address } = useConnection();
  const { open } = useAppKit();
  const price = useZecPrice();
  return (
    <header className="dash-top">
      <button type="button" className="dash-burger" onClick={onMenu} aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu}>
        {menu ? <IconClose /> : <IconMenu />}
      </button>
      <Link to="/app" className="nav-logo dash-top-logo" aria-label="ZKRail dashboard home">
        <Logo />
      </Link>
      <div className="dash-top-right">
        <span className="chip chip--asset dash-top-price" title={price.source ? `Live via ${price.source}` : 'Fetching price'}>
          <ZcashMark />
          <span className="num">{price.usd ? `$${formatUsd(price.usd)}` : '...'}</span>
          {price.status === 'live' ? <i className="dot dot--pulse chip-live-dot" /> : null}
        </span>
        <button type="button" className="dash-account" onClick={() => void open({ view: 'Account' })}>
          <i className="dash-account-dot" aria-hidden="true" />
          <span className="num">{shortAddr(address)}</span>
        </button>
      </div>
    </header>
  );
}

function NetworkBanner() {
  const { chainId } = useConnection();
  const { mutate: switchChain, isPending } = useSwitchChain();
  if (chainId === undefined || chainId === CHAIN_ID) return null;
  return (
    <div className="dash-banner" role="alert">
      <span>
        Your wallet is on chain {chainId}. Payouts and balances shown here are read from {CHAIN_NAME} either way; switch to sign
        on the right network.
      </span>
      <button type="button" className="btn btn--ink btn--sm" disabled={isPending} onClick={() => switchChain({ chainId: CHAIN_ID })}>
        {isPending ? 'Switching...' : `Switch to ${CHAIN_NAME}`}
      </button>
    </div>
  );
}
