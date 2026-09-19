import { useState, type FormEvent } from 'react';
import { IconArrowRight, IconCheck } from '../ui/Icons';
import { ACCESS } from '../../data/site';

export function Access() {
  const [sent, setSent] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Static build: there is no backend to post to, so the form confirms locally.
    setSent(true);
  };

  return (
    <section className="section pt-md pb-lg" id="access">
      <div className="container">
        <div className="access reveal">
          <div className="access-copy">
            <p className="eyebrow">{ACCESS.eyebrow}</p>
            <h2 className="access-title">{ACCESS.heading}</h2>
            <p className="lede">{ACCESS.lede}</p>
          </div>

          {sent ? (
            <div className="access-done" role="status">
              <span className="access-done-mark">
                <IconCheck size={18} />
              </span>
              <p>{ACCESS.confirmation}</p>
            </div>
          ) : (
            <form className="access-form" onSubmit={submit} noValidate={false}>
              {ACCESS.fields.map((field) => (
                <label className="access-field" key={field.name}>
                  <span className="access-label">
                    {field.label}
                    <i aria-hidden="true">*</i>
                  </span>
                  <input
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    required
                    autoComplete="off"
                  />
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
