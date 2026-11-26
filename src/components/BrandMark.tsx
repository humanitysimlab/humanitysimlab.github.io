export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 800 800"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="400" cy="400" r="400" fill="#151A26" />
      <circle cx="242" cy="242" r="48" fill="#ECE6DA" />
      <circle cx="400" cy="242" r="48" fill="#ECE6DA" />
      <circle cx="242" cy="400" r="48" fill="#ECE6DA" />
      <circle cx="400" cy="400" r="48" fill="#ECE6DA" />
      <circle cx="558" cy="400" r="48" fill="#ECE6DA" />
      <circle cx="242" cy="558" r="48" fill="#ECE6DA" />
      <circle cx="400" cy="558" r="48" fill="#ECE6DA" />
      <circle cx="558" cy="558" r="48" fill="#ECE6DA" />
      <circle
        cx="570"
        cy="230"
        r="88"
        fill="none"
        stroke="#4FBF8F"
        strokeWidth="22"
      />
      <circle cx="570" cy="230" r="62" fill="#E8453A" />
    </svg>
  );
}
