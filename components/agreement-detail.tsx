"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AgreementStatusBadge } from "@/components/agreement-status-badge";
import { AcceptButton } from "@/components/accept-button";
import { RejectButton } from "@/components/reject-button";
import { RevokeButton } from "@/components/revoke-button";
import { WithdrawButton } from "@/components/withdraw-button";
import { RerequestButton } from "@/components/rerequest-button";
import { LoginRequiredButton } from "@/components/login-required-button";
import { AgreementEditForm } from "@/components/agreement-edit-form";
import type { Agreement, AgreementLog } from "@/types/database";
import { parseUserAgent } from "@/lib/parse-user-agent";

type Props = {
  agreement: Agreement;
  logs: AgreementLog[];
  currentUserEmail: string | null;
  currentUserId: string | null;
  isAuthenticated: boolean;
  origin: string;
};

const ACTION_LABELS: Record<string, string> = {
  accept: "合意",
  reject: "拒否",
  rerequest: "再申請",
  edit: "編集（再申請）",
  revoke: "解除",
};

export function AgreementDetail({
  agreement,
  logs,
  currentUserEmail,
  currentUserId,
  isAuthenticated,
  origin,
}: Props) {
  const [editing, setEditing] = useState(false);

  const isCreator = currentUserId === agreement.creatorId;
  const isTarget =
    agreement.targetEmail !== null &&
    currentUserEmail === agreement.targetEmail;
  const canAccept =
    isAuthenticated &&
    agreement.status === "pending" &&
    (agreement.targetEmail !== null ? isTarget : !isCreator);
  const isAcceptor = logs.some(
    (log) => log.actionType === "accept" && log.actorId === currentUserId,
  );
  const canRevoke =
    isAuthenticated &&
    !isCreator &&
    agreement.status === "accepted" &&
    (isTarget || isAcceptor);

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
          {editing ? (
            <AgreementEditForm
              agreementId={agreement.id}
              initialTitle={agreement.title}
              initialContent={agreement.content}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  内容
                </h3>
                <p className="whitespace-pre-wrap">{agreement.content}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">作成者: </span>
                  {agreement.creatorEmail}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">承認URL: </span>
                  <code className="text-xs break-all">{`${origin}/agreements/${agreement.id}`}</code>
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
            </>
          )}
        </CardContent>
        {!editing && (
          <CardFooter className="gap-2">
            {agreement.status === "pending" && !isCreator && (
              isAuthenticated ? (
                <>
                  <AcceptButton agreementId={agreement.id} />
                  <RejectButton agreementId={agreement.id} />
                </>
              ) : (
                <>
                  <LoginRequiredButton agreementId={agreement.id}>
                    同意する
                  </LoginRequiredButton>
                  <LoginRequiredButton agreementId={agreement.id} variant="outline">
                    拒否する
                  </LoginRequiredButton>
                </>
              )
            )}
            {canRevoke && <RevokeButton agreementId={agreement.id} />}
            {isCreator && agreement.status === "rejected" && (
              <RerequestButton agreementId={agreement.id} />
            )}
            {isCreator && (
              <>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  編集する
                </Button>
                <WithdrawButton agreementId={agreement.id} />
              </>
            )}
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
              {logs.map((log) => {
                const device = log.userAgent
                  ? parseUserAgent(log.userAgent)
                  : null;
                return (
                  <div
                    key={log.id}
                    className="text-sm border-b pb-2 last:border-0 space-y-1"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {ACTION_LABELS[log.actionType] ?? log.actionType}
                      </span>
                      {log.actorEmail && (
                        <span className="text-muted-foreground">
                          by {log.actorEmail}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {new Date(log.recordedAt).toLocaleString("ja-JP")}
                      </span>
                      {device && (
                        <span>
                          {device.browser} / {device.os}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
