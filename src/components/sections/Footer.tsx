import { Link } from 'react-router';
import { Logo, LogoWatermark } from '../../brand/Logo';
import { AssetChip } from '../ui/AssetMarks';
import { IconArrowUpRight } from '../ui/Icons';
import { BRAND, FOOTER } from '../../data/site';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <hr className="rule" />

        <div className="footer-grid" data-reveal-group>
          {FOOTER.columns.map((column) => (
            <nav className="footer-col reveal" key={column.title} aria-label={column.title}>
              <h2 className="footer-title">{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/app') ? <Link to={link.href}>{link.label}</Link> : <a href={link.href}>{link.label}</a>}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav className="footer-col reveal" aria-label={FOOTER.community.title}>
            <h2 className="footer-title">{FOOTER.community.title}</h2>
            <ul>
              {FOOTER.community.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                    <IconArrowUpRight size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer-col reveal" aria-label={FOOTER.company.title}>
            <h2 className="footer-title">{FOOTER.company.title}</h2>
            <ul>
              {FOOTER.company.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="footer-meta">
          <div className="footer-brand">
            <Logo className="footer-logo" />
            <p className="footer-tagline">{BRAND.tagline}</p>
          </div>
          <ul className="footer-assets" aria-label="Assets and networks a payment touches">
            <li>
              <AssetChip symbol="ZEC" />
            </li>
            <li>
              <AssetChip symbol="RHC" />
            </li>
            <li>
              <AssetChip symbol="USDC" />
            </li>
          </ul>
        </div>

        <p className="footer-copy num">
          &copy; {year} {BRAND.name}
        </p>
      </div>

      <div className="footer-watermark" aria-hidden="true">
        <LogoWatermark />
      </div>
    </footer>
  );
}
