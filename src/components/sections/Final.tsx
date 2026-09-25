import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ACCESS, CLOSING } from '../../data/site';
import { ContractRow } from '../ui/ContractRow';
import { IconArrowRight, IconCheck } from '../ui/Icons';

/** Closing line for everyone, and the access form for merchants, side by side. */
export function Final() {
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Static build: no backend to post to, so the form confirms locally.
    setSent(true);
  };

  return (
    <section className="section closing" id="access" aria-labelledby="closing-line">
      <div className="container final-grid">
        <div className="closing-inner">
          <h2 id="closing-line" className="closing-line reveal" aria-label={CLOSING.line}>
            {CLOSING.line.split('').map((ch, i) => (
              <span key={i} aria-hidden="true" style={{ animationDelay: `${i * 28}ms` }}>
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </h2>
          <p className="lede closing-lede">{CLOSING.lede}</p>
          <div className="hero-actions">
            <Link to="/app" className="btn btn--brand">
              Open the app
              <IconArrowRight size={15} />
            </Link>
            <Link to="/app/market" className="btn btn--ghost">
              Open the market
            </Link>
          </div>
          <ContractRow />
        </div>

        <div className="final-form ticket">
          <p className="eyebrow">{ACCESS.eyebrow}</p>
          <h3 className="final-form-title">{ACCESS.heading}</h3>
          <p className="body-copy">{ACCESS.lede}</p>
          {sent ? (
            <div className="access-done" role="status">
              <span className="access-done-mark">
                <IconCheck size={18} />
              </span>
              <p>{ACCESS.confirmation}</p>
            </div>
          ) : (
            <form className="access-form" onSubmit={submit}>
              {ACCESS.fields.map((f) => (
                <label className="access-field" key={f.name}>
                  <span className="access-label">
                    {f.label}
                    <i aria-hidden="true">*</i>
                  </span>
                  <input name={f.name} type={f.type} placeholder={f.placeholder} required autoComplete="off" />
                </label>
              ))}
              <button type="submit" className="btn btn--ink access-submit">
                {ACCESS.submit}
                <IconArrowRight size={15} />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
