import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LocaleSwitcher } from "@/components/locale-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-8 sm:gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 sm:h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-4 sm:px-5 text-sm">
            <div className="flex gap-3 sm:gap-5 items-center font-semibold">
              <Link href={"/"}>Yubikiri</Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <LocaleSwitcher />
              <Suspense>
                <AuthButton />
              </Suspense>
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-8 sm:gap-20 w-full max-w-5xl px-4 sm:p-5">
          {children}
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-4 sm:gap-8 py-8 sm:py-16">
          <p>Yubikiri</p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
