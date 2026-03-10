"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

const variantMap = {
  pending: "outline" as const,
  accepted: "default" as const,
  rejected: "secondary" as const,
  revoked: "destructive" as const,
  withdraw_pending: "destructive" as const,
  revoke_pending: "destructive" as const,
};

export function AgreementStatusBadge({
  status,
}: {
  status: "pending" | "accepted" | "rejected" | "revoked" | "withdraw_pending" | "revoke_pending";
}) {
  const t = useTranslations("status");
  return <Badge variant={variantMap[status]}>{t(status)}</Badge>;
}
