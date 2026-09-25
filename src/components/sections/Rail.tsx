import { useEffect, useRef, useState } from 'react';
import { Swiper, Autoplay, FreeMode } from 'swiper';
import 'swiper/css';
import { RAIL } from '../../data/site';

/** Highlights from all three sides on one draggable, auto-scrolling rail. */
export function RailStrip() {
  const el = useRef<HTMLDivElement>(null);
  const sw = useRef<Swiper | null>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!el.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sw.current = new Swiper(el.current, {
      modules: [Autoplay, FreeMode],
      slidesPerView: 'auto',
      spaceBetween: 16,
      loop: true,
      speed: 5200,
      freeMode: { enabled: true, momentum: true },
      autoplay: reduced ? false : { delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true },
      grabCursor: true,
    });
    if (reduced) setPlaying(false);
    return () => {
      sw.current?.destroy(true, true);
      sw.current = null;
    };
  }, []);

  const toggle = () => {
    const s = sw.current;
    if (!s?.autoplay) return;
    if (playing) s.autoplay.stop();
    else s.autoplay.start();
    setPlaying((v) => !v);
  };

  return (
    <div className="mkt-rail-wrap rail-strip">
      <div className="mkt-rail-bar">
        <span className="mkt-rail-hint num">{RAIL.hint}</span>
        <button type="button" className="mkt-rail-toggle" onClick={toggle} aria-pressed={!playing}>
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>
      <div className="swiper mkt-rail" ref={el}>
        <div className="swiper-wrapper">
          {RAIL.items.map((r) => (
            <article className={`swiper-slide mkt-rail-card ticket rail-${r.tag.toLowerCase()}`} key={r.n}>
              <p className="mkt-rail-n num">#{r.n}</p>
              <p className="mkt-rail-tag">{r.tag}</p>
              <p className="mkt-rail-title">{r.title}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
