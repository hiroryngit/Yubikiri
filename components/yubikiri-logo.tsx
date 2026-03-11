import Link from "next/link";

function PinkyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* 二本の小指が絡み合うモチーフ */}
      {/* 左の指 */}
      <path d="M4 17c0-2 1.5-3 3-3.5 1-.3 2.2-.2 3 .5 1 .8 1.5 2 1.5 3.5" />
      <path d="M4 17c0 1.5.8 3 2.5 3s2.5-1 3-2" />
      {/* 右の指 */}
      <path d="M20 7c0 2-1.5 3-3 3.5-1 .3-2.2.2-3-.5-1-.8-1.5-2-1.5-3.5" />
      <path d="M20 7c0-1.5-.8-3-2.5-3S15 5 14.5 6" />
      {/* 結び目 */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YubikiriLogo({ size = "default" }: { size?: "default" | "small" }) {
  const iconClass = size === "small" ? "h-4 w-4" : "h-5 w-5";

  return (
    <Link href="/" className="flex items-center gap-1.5 font-semibold">
      <PinkyIcon className={iconClass} />
      <span>Yubikiri</span>
    </Link>
  );
}

export function YubikiriLogoText({ size = "default" }: { size?: "default" | "small" }) {
  const iconClass = size === "small" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span className="flex items-center gap-1">
      <PinkyIcon className={iconClass} />
      <span>Yubikiri</span>
    </span>
  );
}
