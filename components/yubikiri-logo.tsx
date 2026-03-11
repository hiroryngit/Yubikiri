import Link from "next/link";
import Image from "next/image";

export function YubikiriLogo({ size = "default" }: { size?: "default" | "small" }) {
  const iconSize = size === "small" ? 20 : 24;
  const textClass = size === "small" ? "text-sm" : "text-base";

  return (
    <Link href="/" className="flex items-center gap-1.5 font-semibold shrink-0 py-1">
      <Image
        src="/yubikiri-logo.svg"
        alt="Yubikiri"
        width={iconSize}
        height={iconSize}
        className="dark:invert"
      />
      <span className={textClass}>Yubikiri</span>
    </Link>
  );
}

export function YubikiriLogoText() {
  return (
    <span className="flex items-center gap-1.5">
      <Image
        src="/yubikiri-logo.svg"
        alt="Yubikiri"
        width={16}
        height={16}
        className="dark:invert"
      />
      <span>Yubikiri</span>
    </span>
  );
}
