import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', 'aria-hidden': true } as const;

export const MenuIcon = (p: P) => (
  <svg {...base} {...p}><path d="M3 7h18M3 12h18M3 17h12" /></svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const ChevronLeft = (p: P) => (
  <svg {...base} {...p}><path d="M15 5l-7 7 7 7" /></svg>
);
export const ChevronRight = (p: P) => (
  <svg {...base} {...p}><path d="M9 5l7 7-7 7" /></svg>
);
export const PhoneIcon = (p: P) => (
  <svg {...base} {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" /></svg>
);
export const MailIcon = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M3 7l9 6 9-6" /></svg>
);
export const PinIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const ClockIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const NeedleIcon = (p: P) => (
  <svg {...base} {...p}><path d="M4 20L18 6M15 3l6 6-3 1-4-4 1-3z" /><path d="M4 20c2-4 5-5 8-4" /></svg>
);
export const SparkIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" /></svg>
);
export const ChatIcon = (p: P) => (
  <svg {...base} {...p}><path d="M4 5h16v11H9l-5 4V5z" /><path d="M8 10h8M8 13h5" /></svg>
);

export const WhatsAppIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.5c-1.7 0-3.4-.5-4.8-1.3l-.3-.2-3.6.9 1-3.5-.2-.4A9.5 9.5 0 1112 21.5zm0-20.9A11.4 11.4 0 002.2 17.8L.6 23.4l5.8-1.5A11.4 11.4 0 1012 .6z" />
  </svg>
);
export const InstagramIcon = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" /></svg>
);
export const FacebookIcon = (p: P) => (
  <svg {...base} {...p}><path d="M14 8h3V4h-3a4 4 0 00-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" /></svg>
);
export const TiktokIcon = (p: P) => (
  <svg {...base} {...p}><path d="M14 3v11.5a3.5 3.5 0 11-3.5-3.5M14 3c.5 3 2.5 4.5 5 4.5" /></svg>
);
export const BagIcon = (p: P) => (
  <svg {...base} {...p}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 10V6a3 3 0 016 0v4" /></svg>
);
export const MinusIcon = (p: P) => (
  <svg {...base} {...p}><path d="M6 12h12" /></svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 6v12M6 12h12" /></svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
