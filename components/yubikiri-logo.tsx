import Link from "next/link";

function PinkyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* 左の小指: 下から上へ伸びてフックする */}
      <path d="M6 28 L6 16 Q6 10 12 10 Q15 10 16 13" />
      {/* 右の小指: 上から下へ伸びてフックする */}
      <path d="M26 4 L26 16 Q26 22 20 22 Q17 22 16 19" />
    </svg>
  );
}

export function YubikiriLogo({ size = "default" }: { size?: "default" | "small" }) {
  const iconClass = size === "small" ? "h-4 w-4" : "h-[18px] w-[18px]";

  return (
    <Link href="/" className="flex items-center gap-1.5 font-semibold shrink-0">
      <PinkyIcon className={iconClass} />
      <span>Yubikiri</span>
    </Link>
  );
}

export function YubikiriLogoText() {
  return (
    <span className="flex items-center gap-1">
      <PinkyIcon className="h-3.5 w-3.5" />
      <span>Yubikiri</span>
    </span>
  );
}
