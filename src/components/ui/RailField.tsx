import { useEffect, useRef } from 'react';

/**
 * The hero backdrop: ZKRail's own drawing, not a stock gradient.
 *
 * Reads left to right as the product does. The left third is the shielded side,
 * a violet field broken by dashed rails that never resolve into anything legible.
 * Crossing the middle, the rails become continuous and the field turns green:
 * the settled, public side. Payment nodes travel the rails and only become solid
 * dots once they pass the crossing point.
 *
 * Canvas 2D + rAF, DPR-aware, paused when offscreen or when the viewer asks for
 * reduced motion.
 */

type Node = { t: number; lane: number; speed: number };

const LANES = 7;

export function RailField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let t0 = performance.now();

    const nodes: Node[] = [];
    for (let lane = 0; lane < LANES; lane += 1) {
      const count = 2 + (lane % 3);
      for (let i = 0; i < count; i += 1) {
        nodes.push({
          t: (i / count + lane * 0.13) % 1,
          lane,
          speed: 0.028 + ((lane * 7 + i * 3) % 5) * 0.006,
        });
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Lane geometry: gently fanned rails, tighter at the shielded end.
    const laneY = (lane: number, x: number) => {
      const spread = 0.34 + 0.44 * (x / w);
      const centred = (lane - (LANES - 1) / 2) / ((LANES - 1) / 2);
      return h / 2 + centred * h * 0.5 * spread;
    };

    const CROSS = 0.46; // where shielded becomes settled

    const paint = (time: number) => {
      const t = (time - t0) / 1000;

      // field
      const field = ctx.createLinearGradient(0, 0, w, h * 0.7);
      field.addColorStop(0, '#0d1210');
      field.addColorStop(0.34, '#0c0d0d');
      field.addColorStop(0.58, '#0e0e0e');
      field.addColorStop(1, '#170f05');
      ctx.fillStyle = field;
      ctx.fillRect(0, 0, w, h);

      // two soft blooms, drifting slowly, one per side
      const bloom = (cx: number, cy: number, r: number, color: string, alpha: number) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, color);
        g.addColorStop(1, 'rgba(10, 10, 11, 0)');
        ctx.globalAlpha = alpha;
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      };
      bloom(
        w * (0.16 + Math.sin(t * 0.17) * 0.03),
        h * (0.34 + Math.cos(t * 0.13) * 0.05),
        Math.max(w, h) * 0.52,
        'rgba(113, 207, 163, 0.17)',
        1,
      );
      bloom(
        w * (0.86 + Math.cos(t * 0.11) * 0.03),
        h * (0.68 + Math.sin(t * 0.15) * 0.05),
        Math.max(w, h) * 0.5,
        'rgba(249, 133, 0, 0.21)',
        1,
      );

      // rails
      ctx.lineWidth = 1.6;
      for (let lane = 0; lane < LANES; lane += 1) {
        // shielded half: dashed, violet, never resolving
        ctx.beginPath();
        ctx.setLineDash([11, 9]);
        ctx.lineDashOffset = -t * 14 + lane * 5;
        ctx.strokeStyle = 'rgba(113, 207, 163, 0.55)';
        for (let x = 0; x <= w * CROSS; x += 8) {
          const y = laneY(lane, x);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // settled half: continuous, green
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        for (let x = w * CROSS; x <= w; x += 8) {
          const y = laneY(lane, x);
          if (x === w * CROSS) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // the crossing: a single vertical hairline, the moment privacy ends
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.moveTo(w * CROSS, h * 0.12);
      ctx.lineTo(w * CROSS, h * 0.88);
      ctx.stroke();

      // payment nodes
      for (const n of nodes) {
        const p = reduced ? n.t : (n.t + t * n.speed) % 1;
        const x = p * w;
        const y = laneY(n.lane, x);
        const settled = p > CROSS;
        ctx.beginPath();
        ctx.arc(x, y, settled ? 3.2 : 2.4, 0, Math.PI * 2);
        if (settled) {
          ctx.fillStyle = 'rgba(249, 133, 0, 0.95)';
          ctx.fill();
        } else {
          ctx.strokeStyle = 'rgba(113, 207, 163, 0.75)';
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }
    };

    const loop = (time: number) => {
      if (visible) paint(time);
      raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduced) {
      paint(performance.now());
    } else {
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) paint(performance.now());
    });
    ro.observe(canvas);

    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
