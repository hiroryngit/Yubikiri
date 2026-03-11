"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export function LogoutToast() {
  const t = useTranslations();
  const [phase, setPhase] = useState<"hidden" | "entering" | "visible" | "leaving">("hidden");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("logged_out") !== "true") return;
    handled.current = true;

    window.history.replaceState(null, "", "/");

    // スライドイン
    requestAnimationFrame(() => {
      setPhase("entering");
      requestAnimationFrame(() => setPhase("visible"));
    });

    // 3秒後にスライドアウト
    const timer = setTimeout(() => setPhase("leaving"), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out"
      style={{
        top: phase === "visible" ? "1rem" : "-3rem",
        opacity: phase === "visible" ? 1 : 0,
      }}
      onTransitionEnd={() => {
        if (phase === "leaving") setPhase("hidden");
      }}
    >
      <div className="bg-foreground text-background px-4 py-2 rounded-md shadow-lg text-sm whitespace-nowrap">
        {t("common.loggedOut")}
      </div>
    </div>
  );
}
