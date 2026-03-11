import Link from "next/link";

function PinkyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* 左の手（下から上）: 小指を立てている */}
      <path
        d="M5 21 L5 15 C5 13 6 11.5 8 11 C9.5 10.5 11 11 12 12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 右の手（上から下）: 小指を立てている */}
      <path
        d="M19 3 L19 9 C19 11 18 12.5 16 13 C14.5 13.5 13 13 12 11.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 赤い糸（指の絡む部分） */}
      <path
        d="M10.5 11 Q12 12 13.5 13"
        stroke="#e11d48"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="1" fill="#e11d48" />
    </svg>
  );
}

export function YubikiriLogo({ size = "default" }: { size?: "default" | "small" }) {
  const iconClass = size === "small" ? "h-5 w-5" : "h-6 w-6";

  return (
    <Link href="/" className="flex items-center gap-1.5 font-semibold shrink-0">
      <PinkyIcon className={iconClass} />
      <span>Yubikiri</span>
    </Link>
  );
}

export function YubikiriLogoText() {
  return (
    <span className="flex items-center gap-1.5">
      <PinkyIcon className="h-4 w-4" />
      <span>Yubikiri</span>
    </span>
  );
}
