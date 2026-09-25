import { LOOP } from '../../data/site';

/** How spending, settling and earning feed each other: four steps, closed into a loop. */
export function Loop() {
  return (
    <section className="section pb-lg" id="loop">
      <div className="container">
        <p className="section-index reveal">
          <b>02</b> / {LOOP.eyebrow}
        </p>
        <h2 className="loop-title reveal">{LOOP.heading}</h2>
        <ol className="loop" data-reveal-group>
          {LOOP.steps.map((s, i) => (
            <li className={`loop-step ticket reveal loop-step--${s.tone}`} key={s.n}>
              <span className="loop-n num">{s.n}</span>
              <h3 className="loop-step-title">{s.title}</h3>
              <p className="body-copy">{s.body}</p>
              <span className="loop-arrow" aria-hidden="true">
                {i === LOOP.steps.length - 1 ? '↺' : '→'}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
