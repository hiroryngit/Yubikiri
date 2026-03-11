import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { YubikiriLogo } from "@/components/yubikiri-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 text-sm">
        <YubikiriLogo size="small" />
      </div>
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeSwitcher />
      </div>
      {children}
    </div>
  );
}
