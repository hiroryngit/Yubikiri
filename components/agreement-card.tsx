import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AgreementStatusBadge } from "@/components/agreement-status-badge";
import type { Agreement } from "@/types/database";

export function AgreementCard({ agreement }: { agreement: Agreement }) {
  return (
    <Link href={`/agreements/${agreement.id}`}>
      <Card className="hover:bg-accent/50 transition-colors">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{agreement.title}</CardTitle>
            <AgreementStatusBadge status={agreement.status} />
          </div>
          <CardDescription className="font-mono text-xs truncate">
            {`/agreements/${agreement.id}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {agreement.content}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            作成日: {new Date(agreement.createdAt).toLocaleDateString("ja-JP")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
