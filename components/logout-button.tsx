"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const t = useTranslations();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/?logged_out=true";
  };

  return <Button onClick={logout}><LogOut className="h-4 w-4 mr-2" />{t("common.logout")}</Button>;
}
