"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/**
 * Supabase の認証状態変化を検知し、サーバーコンポーネントを再レンダリングする。
 * OAuth ログイン後にレイアウトのキャッシュを破棄して AuthButton を更新するために必要。
 */
export function AuthStateListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // ログイン/ログアウト/トークンリフレッシュ時にサーバーコンポーネントを再取得
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED"
      ) {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
