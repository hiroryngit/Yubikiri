import type {
  AgreementRow,
  Agreement,
  AgreementLogRow,
  AgreementLog,
} from "@/types/database";

export function toAgreement(row: AgreementRow): Agreement {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status,
    contentHash: row.content_hash,
    creatorId: row.creator_id,
    targetEmail: row.target_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toAgreementLog(row: AgreementLogRow): AgreementLog {
  return {
    id: row.id,
    agreementId: row.agreement_id,
    actionType: row.action_type,
    recordedAt: row.recorded_at,
    userAgent: row.user_agent,
    actorId: row.actor_id,
  };
}

export async function generateContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
