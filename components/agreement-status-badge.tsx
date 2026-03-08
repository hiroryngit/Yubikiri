import { Badge } from "@/components/ui/badge";

const statusConfig = {
  pending: { label: "承認待ち", variant: "outline" as const },
  accepted: { label: "合意済み", variant: "default" as const },
  rejected: { label: "拒否済み", variant: "secondary" as const },
  revoked: { label: "解除済み", variant: "destructive" as const },
};

export function AgreementStatusBadge({
  status,
}: {
  status: "pending" | "accepted" | "rejected" | "revoked";
}) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
