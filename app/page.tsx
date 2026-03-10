import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Yubikiri</Link>
            </div>
            {hasEnvVars && (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-2xl px-5 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            口約束からの脱却
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            Yubikiri
            は、個人間の合意をデータベースに記録し、証拠として残すサービスです。
            タイムスタンプとメタデータで合意の証跡を保全します。
          </p>
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href="/agreements/new">同意書を作成する</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/protected">ダッシュボード</Link>
            </Button>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>Yubikiri - 口約束からの脱却</p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
