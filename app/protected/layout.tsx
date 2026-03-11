import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { YubikiriLogo, YubikiriLogoText } from "@/components/yubikiri-logo";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 sm:h-16">
          <div className="w-full max-w-5xl flex justify-between items-center px-4 sm:px-5 text-sm">
            <YubikiriLogo />
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
              <LocaleSwitcher />
              <Suspense>
                <AuthButton />
              </Suspense>
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-6 sm:gap-12 w-full max-w-5xl px-5 sm:px-8 py-6 sm:py-10">
          {children}
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-4 sm:gap-8 py-6 sm:py-12">
          <YubikiriLogoText />
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
