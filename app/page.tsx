import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoutToast } from "@/components/logout-toast";
import { YubikiriLogo, YubikiriLogoText } from "@/components/yubikiri-logo";
import { hasEnvVars } from "@/lib/utils";
import { Suspense } from "react";
import { HomeContent } from "@/components/home-content";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <LogoutToast />
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 sm:h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-4 sm:px-5 text-sm">
            <div className="flex gap-3 sm:gap-5 items-center text-sm">
              <YubikiriLogo />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <LocaleSwitcher />
              {hasEnvVars && (
                <Suspense>
                  <AuthButton />
                </Suspense>
              )}
            </div>
          </div>
        </nav>

        <HomeContent />

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-4 sm:gap-8 py-6 sm:py-12">
          <YubikiriLogoText />
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
