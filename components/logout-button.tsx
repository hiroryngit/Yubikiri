"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const t = useTranslations();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/?logged_out=true");
  };

  return <Button onClick={logout}><LogOut className="h-4 w-4 mr-2" />{t("common.logout")}</Button>;
}
