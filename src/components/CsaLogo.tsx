type CsaLogoProps = {
  className?: string;
  label?: string;
};

export function CsaLogo({
  className = "h-11",
  label = "CSA High Performance Suspension",
}: CsaLogoProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`relative inline-block shrink-0 overflow-hidden ${className}`}
      style={{ aspectRatio: "921 / 342" }}
    >
      <img
        src="/csa-logo-original.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute max-w-none select-none"
        style={{ width: "128.77%", left: "-13.79%", top: "-140.64%" }}
      />
    </span>
  );
}
