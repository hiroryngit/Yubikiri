"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { popReturnUrl, hasReturnUrl } from "@/lib/return-stack";

/**
 * ログイン完了後にスタックからリターンURLを取り出してリダイレクトする。
 * スタックは明示的に pushReturnUrl した場合のみ積まれるので、
 * 認証チェックなしで即リダイレクトして問題ない。
 * /auth/* ページでは動作しない（ログインフロー中の干渉防止）。
 */
export function AuthReturnHandler() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // ログインフロー中は何もしない
    if (pathname.startsWith("/auth")) return;

    if (!hasReturnUrl()) return;

    const returnUrl = popReturnUrl();
    if (returnUrl && returnUrl !== pathname) {
      router.replace(returnUrl);
    }
  }, [pathname, router]);

  return null;
}
