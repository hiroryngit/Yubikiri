// DB Row 型 (snake_case) - Supabase から返却される形式
export type AgreementRow = {
  id: string;
  title: string;
  content: string;
  status: "pending" | "accepted" | "rejected" | "revoked";
  content_hash: string;
  creator_id: string;
  creator_email: string;
  target_email: string | null;
  created_at: string;
  updated_at: string;
};

export type AgreementLogRow = {
  id: string;
  agreement_id: string;
  action_type: "accept" | "reject" | "revoke";
  recorded_at: string;
  user_agent: string | null;
  actor_id: string;
};

// アプリケーション型 (camelCase)
export type Agreement = {
  id: string;
  title: string;
  content: string;
  status: "pending" | "accepted" | "rejected" | "revoked";
  contentHash: string;
  creatorId: string;
  creatorEmail: string;
  targetEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgreementLog = {
  id: string;
  agreementId: string;
  actionType: "accept" | "reject" | "revoke";
  recordedAt: string;
  userAgent: string | null;
  actorId: string;
};
