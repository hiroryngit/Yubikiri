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
import { WithdrawApproveButton } from "@/components/withdraw-approve-button";
import { WithdrawRejectButton } from "@/components/withdraw-reject-button";
import { RevokeApproveButton } from "@/components/revoke-approve-button";
import { RevokeRejectButton } from "@/components/revoke-reject-button";
import { RerequestButton } from "@/components/rerequest-button";
import { LoginRequiredButton } from "@/components/login-required-button";
import { AgreementEditForm } from "@/components/agreement-edit-form";
import { CopyButton } from "@/components/copy-button";
import type { Agreement, AgreementLog } from "@/types/database";
import { parseUserAgent } from "@/lib/parse-user-agent";
import { formatGeoLocation } from "@/lib/geo";
import { useTranslations, useLocale } from "next-intl";

type Props = {
  agreement: Agreement;
  logs: AgreementLog[];
  currentUserEmail: string | null;
  currentUserId: string | null;
  isAuthenticated: boolean;
  origin: string;
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
  const t = useTranslations();
  const locale = useLocale();

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
                  {t("agreement.content")}
                </h3>
                <p className="whitespace-pre-wrap">{agreement.content}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("agreement.creator")}: </span>
                  {agreement.creatorEmail}
                </div>
                <div className="col-span-2 flex items-center gap-2 flex-wrap">
                  <span className="text-muted-foreground">{t("agreement.approvalUrl")}: </span>
                  <code className="text-xs break-all">{`${origin}/agreements/${agreement.id}`}</code>
                  <CopyButton text={`${origin}/agreements/${agreement.id}`} size="sm" />
                </div>
                <div>
                  <span className="text-muted-foreground">{t("agreement.createdAt")}: </span>
                  {new Date(agreement.createdAt).toLocaleString(locale)}
                </div>
                <div>
                  <span className="text-muted-foreground">{t("agreement.updatedAt")}: </span>
                  {new Date(agreement.updatedAt).toLocaleString(locale)}
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
                    {t("action.accept")}
                  </LoginRequiredButton>
                  <LoginRequiredButton agreementId={agreement.id} variant="outline">
                    {t("action.reject")}
                  </LoginRequiredButton>
                </>
              )
            )}
            {canRevoke && <RevokeButton agreementId={agreement.id} />}
            {isCreator && agreement.status === "rejected" && (
              <RerequestButton agreementId={agreement.id} />
            )}
            {agreement.status === "withdraw_pending" && !isCreator && isAuthenticated && (
              <>
                <WithdrawApproveButton agreementId={agreement.id} />
                <WithdrawRejectButton agreementId={agreement.id} />
              </>
            )}
            {agreement.status === "withdraw_pending" && isCreator && (
              <p className="text-sm text-muted-foreground">{t("agreement.waitingWithdrawApproval")}</p>
            )}
            {agreement.status === "revoke_pending" && isCreator && isAuthenticated && (
              <>
                <RevokeApproveButton agreementId={agreement.id} />
                <RevokeRejectButton agreementId={agreement.id} />
              </>
            )}
            {agreement.status === "revoke_pending" && !isCreator && isAuthenticated && (
              <p className="text-sm text-muted-foreground">{t("agreement.waitingRevokeApproval")}</p>
            )}
            {isCreator && !["withdraw_pending", "revoke_pending"].includes(agreement.status) && (
              <>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  {t("common.edit")}
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
            <CardTitle className="text-lg">{t("agreement.history")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs.map((log) => {
                const device = log.userAgent
                  ? parseUserAgent(log.userAgent)
                  : null;
                const geo = formatGeoLocation(log.ipCountry, log.ipRegion);
                return (
                  <div
                    key={log.id}
                    className="text-sm border-b pb-2 last:border-0 space-y-1"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {t(`actionLog.${log.actionType}`)}
                      </span>
                      {log.actorEmail && (
                        <span className="text-muted-foreground">
                          by {log.actorEmail}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>
                        {new Date(log.recordedAt).toLocaleString(locale)}
                      </span>
                      {device && (
                        <span>
                          {device.browser} / {device.os}
                        </span>
                      )}
                      {log.ipAddress && (
                        <span>
                          IP: {log.ipAddress}
                          {geo ? ` (${geo})` : ""}
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
