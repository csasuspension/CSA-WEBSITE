import type { SVGProps } from "react";

export function ShockAbsorberIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="3" r="2" />
      <circle cx="12" cy="21" r="2" />
      <path d="M12 5v2M12 17v2" />
      <path d="M8.2 7h7.6M8.2 17h7.6" />
      <path d="M9 7.8l6 1.4-6 1.4 6 1.4-6 1.4 6 1.4-6 1.4" />
      <path d="M7.5 9.2v5.6M16.5 9.2v5.6" />
    </svg>
  );
}
