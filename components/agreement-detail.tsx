import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { AgreementStatusBadge } from "@/components/agreement-status-badge";
import { AcceptButton } from "@/components/accept-button";
import { RevokeButton } from "@/components/revoke-button";
import type { Agreement, AgreementLog } from "@/types/database";

type Props = {
  agreement: Agreement;
  logs: AgreementLog[];
  currentUserEmail: string | null;
  currentUserId: string | null;
  isAuthenticated: boolean;
};

export function AgreementDetail({
  agreement,
  logs,
  currentUserEmail,
  currentUserId,
  isAuthenticated,
}: Props) {
  const isCreator = currentUserId === agreement.creatorId;
  const isTarget =
    agreement.targetEmail !== null &&
    currentUserEmail === agreement.targetEmail;
  // accept 可能: target_email 指定ならそのユーザーのみ、null なら creator 以外の誰でも
  const canAccept =
    isAuthenticated &&
    agreement.status === "pending" &&
    (agreement.targetEmail !== null ? isTarget : !isCreator);
  // revoke 可能: 当事者（creator, target, または accept した人）
  const isAcceptor = logs.some(
    (log) => log.actionType === "accept" && log.actorId === currentUserId,
  );
  const canRevoke =
    isAuthenticated &&
    agreement.status === "accepted" &&
    (isCreator || isTarget || isAcceptor);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{agreement.title}</CardTitle>
            <AgreementStatusBadge status={agreement.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              内容
            </h3>
            <p className="whitespace-pre-wrap">{agreement.content}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">対象者: </span>
              {agreement.targetEmail ?? "未指定（URLで共有）"}
            </div>
            <div>
              <span className="text-muted-foreground">作成日: </span>
              {new Date(agreement.createdAt).toLocaleString("ja-JP")}
            </div>
            <div>
              <span className="text-muted-foreground">更新日: </span>
              {new Date(agreement.updatedAt).toLocaleString("ja-JP")}
            </div>
          </div>
        </CardContent>
        {(canAccept || canRevoke) && (
          <CardFooter className="gap-2">
            {canAccept && <AcceptButton agreementId={agreement.id} />}
            {canRevoke && <RevokeButton agreementId={agreement.id} />}
          </CardFooter>
        )}
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">操作履歴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center text-sm border-b pb-2 last:border-0"
                >
                  <div>
                    <span className="font-medium">
                      {log.actionType === "accept" ? "合意" : "解除"}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(log.recordedAt).toLocaleString("ja-JP")}
                    </span>
                  </div>
                  {log.userAgent && (
                    <span className="text-xs text-muted-foreground max-w-xs truncate">
                      {log.userAgent}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
