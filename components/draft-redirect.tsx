"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const DRAFT_KEY = "yubikiri_draft";

/**
 * sessionStorage に下書きが残っている場合、/agreements/new へリダイレクトする。
 * Google OAuth 後にトップページに着地しても、下書きがあれば自動で戻す。
 */
export function DraftRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // /agreements/new にいる場合は AgreementForm 側が処理するので何もしない
    if (pathname === "/agreements/new") return;

    try {
      const draft = sessionStorage.getItem(DRAFT_KEY);
      if (draft) {
        router.replace("/agreements/new");
      }
    } catch {
      // sessionStorage にアクセスできない環境では無視
    }
  }, [pathname, router]);

  return null;
}
