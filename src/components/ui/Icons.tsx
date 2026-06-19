import { SVGProps } from "react";

export function Svg({ children, className = "w-5 h-5" }: { children: React.ReactNode; className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">{children}</svg>;
}

export function BuildingIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M3 21h18M3 10h18M5 6l7-4 7 4M4 10v11m16-11v11M10 14v4m4-4v4"/></Svg>; }
export function PhoneIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></Svg>; }
export function BankIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M3 21h18M3 7v14M21 7v14M12 3l-9 4h18l-9-4zM8 11h2v5H8zm6 0h2v5h-2zm-3 0h2v5h-2z"/></Svg>; }
export function LightningIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></Svg>; }
export function StarIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></Svg>; }
export function HeartIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></Svg>; }
export function WriteIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>; }
export function LinkIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></Svg>; }
export function MicIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></Svg>; }
export function BrainIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M12 2a4 4 0 00-4 4c0 .5.08.98.24 1.44A3.5 3.5 0 005 10.5c0 .65.18 1.26.5 1.78A3.5 3.5 0 006 15.5 3.5 3.5 0 009.5 19h5a3.5 3.5 0 003.5-3.5 3.5 3.5 0 00.5-3.22A3.5 3.5 0 0019 10.5a3.5 3.5 0 00-3.24-3.06A4 4 0 0012 2z"/><path d="M9 9h6M9 13h6"/></Svg>; }
export function CloudIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></Svg>; }
export function HeadphonesIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M22 17a3 3 0 01-3 3h-1.5a1.5 1.5 0 01-1.5-1.5V12a8 8 0 00-16 0v6.5A1.5 1.5 0 001.5 20H3a3 3 0 003-3v-1a3 3 0 00-3-3H2a8 8 0 0116 0h-1a3 3 0 00-3 3v1a3 3 0 003 3h2.5a1.5 1.5 0 001.5-1.5V12a8 8 0 00-8-8 8 8 0 00-8 8"/></Svg>; }
export function EnvelopeIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></Svg>; }
export function PinIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></Svg>; }
export function ShieldIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>; }
export function BotIcon({ className }: { className?: string }) { return <Svg className={className}><circle cx="12" cy="10" r="3"/><path d="M12 2a3 3 0 00-3 3h6a3 3 0 00-3-3z"/><path d="M7 9l-4 2v3l4 2"/><path d="M17 9l4 2v3l-4 2"/><path d="M7 15l-2 5"/><path d="M17 15l2 5"/></Svg>; }
