import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Logo } from '../brand/Logo';
import { IconArrowUpRight, IconChevronDown, IconClose, IconMenu } from './ui/Icons';
import { NAV } from '../data/site';

export function Navigation() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(null);
        setMobile(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobile ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobile]);

  return (
    <header className="nav" ref={barRef}>
      <div className="container nav-inner">
        <a className="nav-logo" href="#top" aria-label="ZetaNexus home">
          <Logo />
        </a>

        <nav className="nav-groups" aria-label="Primary">
          {NAV.map((group) => {
            const isOpen = open === group.label;
            return (
              <div
                key={group.label}
                className="nav-group"
                onMouseEnter={() => setOpen(group.label)}
                onMouseLeave={() => setOpen(null)}
              >
                <button
                  type="button"
                  className="nav-trigger"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : group.label)}
                >
                  <span className="nav-index">{group.index}.</span>
                  <span className="nav-label">{group.label}</span>
                  <IconChevronDown className={`nav-chevron${isOpen ? ' is-open' : ''}`} />
                </button>

                <div className={`nav-panel${isOpen ? ' is-open' : ''}`}>
                  <ul className="nav-panel-list">
                    {group.items.map((item) => (
                      <li key={item.label}>
                        <a href={item.href} onClick={() => setOpen(null)}>
                          <span className="nav-panel-label">{item.label}</span>
                          <span className="nav-panel-blurb">{item.blurb}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="nav-actions">
          <a className="btn btn--ghost btn--sm" href="#integration">
            View docs
          </a>
          <Link className="btn btn--brand btn--sm" to="/app">
            Launch app
            <IconArrowUpRight size={13} />
          </Link>
          <button
            type="button"
            className="nav-burger"
            aria-label={mobile ? 'Close menu' : 'Open menu'}
            aria-expanded={mobile}
            onClick={() => setMobile((v) => !v)}
          >
            {mobile ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      <div className={`nav-mobile${mobile ? ' is-open' : ''}`}>
        <div className="container nav-mobile-inner">
          {NAV.map((group) => (
            <section key={group.label} className="nav-mobile-group">
              <p className="eyebrow">
                {group.index}. {group.label}
              </p>
              <ul>
                {group.items.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} onClick={() => setMobile(false)}>
                      {item.label}
                      <span className="nav-panel-blurb">{item.blurb}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div className="nav-mobile-actions">
            <a className="btn btn--ghost" href="#integration" onClick={() => setMobile(false)}>
              View docs
            </a>
            <Link className="btn btn--brand" to="/app" onClick={() => setMobile(false)}>
              Launch app
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
