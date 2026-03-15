// DB Row 型 (snake_case) - Supabase から返却される形式
export type AgreementRow = {
  id: string;
  title: string;
  content: string;
  status: "pending" | "accepted" | "rejected" | "revoked" | "withdraw_pending" | "revoke_pending";
  content_hash: string;
  creator_id: string;
  creator_email: string;
  previous_status: string | null;
  original_locale: string | null;
  title_iv: string | null;
  content_iv: string | null;
  is_encrypted: boolean;
  url_hash: string | null;
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
  previousStatus: string | null;
  originalLocale: string | null;
  titleIv: string | null;
  contentIv: string | null;
  isEncrypted: boolean;
  urlToken: string;
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
