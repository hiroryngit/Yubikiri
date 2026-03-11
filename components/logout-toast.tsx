"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function LogoutToast() {
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("logged_out") === "true") {
      setVisible(true);
      window.history.replaceState(null, "", "/");
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="bg-foreground text-background px-4 py-2 rounded-md shadow-lg text-sm">
        {t("common.loggedOut")}
      </div>
    </div>
  );
}
