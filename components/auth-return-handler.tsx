"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { popReturnUrl, hasReturnUrl } from "@/lib/return-stack";

/**
 * ログイン完了後にスタックからリターンURLを取り出してリダイレクトする。
 * 認証済みかつスタックにURLがある場合のみ動作。
 * /auth/* ページでは動作しない（ログインフロー中の干渉防止）。
 */
export function AuthReturnHandler() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // ログインフロー中は何もしない
    if (pathname.startsWith("/auth")) return;

    // スタックが空なら何もしない（高速パス）
    if (!hasReturnUrl()) return;

    async function checkAndRedirect() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const returnUrl = popReturnUrl();
        if (returnUrl && returnUrl !== pathname) {
          router.replace(returnUrl);
        }
      }
    }

    checkAndRedirect();
  }, [pathname, router]);

  return null;
}
