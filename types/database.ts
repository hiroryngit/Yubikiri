// DB Row 型 (snake_case) - Supabase から返却される形式
export type AgreementRow = {
  id: string;
  title: string;
  content: string;
  status: "pending" | "accepted" | "rejected" | "revoked" | "withdraw_pending" | "revoke_pending";
  content_hash: string;
  creator_id: string;
  creator_email: string;
  target_email: string | null;
  previous_status: string | null;
  created_at: string;
  updated_at: string;
};

export type AgreementLogRow = {
  id: string;
  agreement_id: string;
  action_type: "accept" | "reject" | "revoke" | "rerequest" | "edit" | "withdraw_request" | "withdraw_approve" | "withdraw_reject" | "revoke_request" | "revoke_approve" | "revoke_reject";
  recorded_at: string;
  user_agent: string | null;
  actor_id: string;
  actor_email: string | null;
  ip_address: string | null;
  ip_country: string | null;
  ip_region: string | null;
};

// アプリケーション型 (camelCase)
export type Agreement = {
  id: string;
  title: string;
  content: string;
  status: "pending" | "accepted" | "rejected" | "revoked" | "withdraw_pending" | "revoke_pending";
  contentHash: string;
  creatorId: string;
  creatorEmail: string;
  targetEmail: string | null;
  previousStatus: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgreementLog = {
  id: string;
  agreementId: string;
  actionType: "accept" | "reject" | "revoke" | "rerequest" | "edit" | "withdraw_request" | "withdraw_approve" | "withdraw_reject" | "revoke_request" | "revoke_approve" | "revoke_reject";
  recordedAt: string;
  userAgent: string | null;
  actorId: string;
  actorEmail: string | null;
  ipAddress: string | null;
  ipCountry: string | null;
  ipRegion: string | null;
};
