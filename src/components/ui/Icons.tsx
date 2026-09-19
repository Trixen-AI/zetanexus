/**
 * ZetaNexus's own icon set. Drawn on a 24 grid with a 1.6 stroke, square-ish joins
 * and no rounded flourishes, so they sit in the same shape language as the UI.
 */

type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
});

/** Shielded address: an envelope whose contents are a dashed rail. */
export function IconShieldedAddress({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="2.75" y="5.25" width="18.5" height="13.5" rx="2" />
      <path d="M6 10h5" strokeDasharray="2.2 2" />
      <path d="M6 14h9" strokeDasharray="2.2 2" />
      <circle cx="18" cy="14" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Fixed quote: a price tag with a clock hand. */
export function IconQuote({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3 2" />
      <path d="M12 3.25v1.5M12 19.25v1.5M3.25 12h1.5M19.25 12h1.5" />
    </svg>
  );
}

/** Webhook: a signed packet leaving on a wire. */
export function IconWebhook({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="2.75" y="4.75" width="11.5" height="9.5" rx="1.5" />
      <path d="M5.75 8h5.5M5.75 11h3.5" />
      <path d="M14.25 17.5h5" />
      <path d="M17 15l2.5 2.5L17 20" />
      <path d="M8.5 14.25v3.25h4" />
    </svg>
  );
}

/** Reconciliation: branching states off a single spine. */
export function IconStates({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 6h7.5" />
      <path d="M4 12h12.5" />
      <path d="M4 18h7.5" />
      <circle cx="19" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M13.5 6h2.5M13.5 18h2.5" strokeDasharray="2 2" />
    </svg>
  );
}

export function IconArrowUpRight({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M7 17L17 7" />
      <path d="M8.5 7H17v8.5" />
    </svg>
  );
}

export function IconArrowRight({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 12h15" />
      <path d="M13.5 6.5L19 12l-5.5 5.5" />
    </svg>
  );
}

export function IconArrowLeft({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M20 12H5" />
      <path d="M10.5 6.5L5 12l5.5 5.5" />
    </svg>
  );
}

export function IconChevronDown({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5.5 9L12 15.5L18.5 9" />
    </svg>
  );
}

export function IconCopy({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="9" y="9" width="11" height="11" rx="1.6" />
      <path d="M15 5.5A1.5 1.5 0 0 0 13.5 4H5.5A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15" />
    </svg>
  );
}

export function IconCheck({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.5 12.5L9.5 17.5L19.5 6.5" />
    </svg>
  );
}

export function IconLock({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4.75" y="10.25" width="14.5" height="9.5" rx="1.6" />
      <path d="M8.25 10.25V7.5a3.75 3.75 0 0 1 7.5 0v2.75" />
    </svg>
  );
}

export function IconMenu({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
    </svg>
  );
}

export function IconClose({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />
    </svg>
  );
}
