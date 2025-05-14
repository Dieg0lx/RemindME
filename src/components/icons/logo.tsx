import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="120"
      height="30"
      aria-label="BudgetView Logo"
      {...props}
    >
      <rect width="100%" height="100%" rx="5" fill="hsl(var(--logo-background-sidebar))" />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="var(--font-geist-sans, Arial), sans-serif"
        fontSize="28"
        fontWeight="bold"
        fill="hsl(var(--logo-foreground-sidebar))"
      >
        BudgetView
      </text>
    </svg>
  );
}
