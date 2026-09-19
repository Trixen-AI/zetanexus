import { useEffect } from 'react';

/**
 * Scroll reveal for anything carrying `.reveal`, matching the source layout's
 * behaviour: elements enter once, staggered by their order inside a group, and
 * never animate back out. Honours prefers-reduced-motion by revealing instantly.
 */
export function useReveal(rootSelector = '[data-reveal-root]') {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(`${rootSelector} .reveal`));
    if (!nodes.length) return;

    if (reduced) {
      nodes.forEach((n) => n.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const group = el.closest('[data-reveal-group]');
          const peers = group ? Array.from(group.querySelectorAll('.reveal')) : [];
          const index = Math.max(0, peers.indexOf(el));
          el.style.transitionDelay = `${Math.min(index, 6) * 70}ms`;
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [rootSelector]);
}
