import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toAgreement } from "@/lib/agreements";
import { decryptAgreement } from "@/lib/encryption";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardContent } from "@/components/dashboard-content";
import { Suspense } from "react";
import type { AgreementRow } from "@/types/database";

async function AgreementList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: logRows } = await supabase
    .from("agreement_logs")
    .select("agreement_id")
    .eq("actor_id", user.id);

  const actedIds = (logRows ?? []).map((r) => r.agreement_id);

  let query = supabase
    .from("agreements")
    .select("*")
    .order("created_at", { ascending: false });

  if (actedIds.length > 0) {
    query = query.or(
      `creator_id.eq.${user.id},target_email.eq.${user.email},id.in.(${actedIds.join(",")})`,
    );
  } else {
    query = query.or(`creator_id.eq.${user.id},target_email.eq.${user.email}`);
  }

  const { data: rows } = await query.returns<AgreementRow[]>();

  const agreements = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { title, content } = await decryptAgreement(
        row.creator_id,
        row.creator_email,
        row,
      );
      return toAgreement({ ...row, title, content });
    }),
  );

  return <DashboardContent agreements={agreements} />;
}

export default function DashboardPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <DashboardHeader />
      <Suspense fallback={<p className="text-muted-foreground">...</p>}>
        <AgreementList />
      </Suspense>
    </div>
  );
}
