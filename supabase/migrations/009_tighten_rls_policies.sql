-- RLS ポリシーを強化
-- 1. agreements_select: true → 関係者 + 公開合意書(target_email IS NULL)のみ
-- 2. agreements_delete: 認証済みなら誰でも → 関係者のみ
-- 3. agreement_logs_select: agreement存在チェック → 関係者チェック

-- =============================================================
-- agreements_select: 作成者、対象者、過去のアクション実行者、
-- または公開合意書（target_email IS NULL = UUID共有モデル）のみ閲覧可能
-- =============================================================
DROP POLICY "agreements_select" ON agreements;
CREATE POLICY "agreements_select" ON agreements
  FOR SELECT USING (
    auth.uid() = creator_id
    OR target_email IS NULL
    OR target_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM agreement_logs
      WHERE agreement_logs.agreement_id = agreements.id
        AND agreement_logs.actor_id = auth.uid()
    )
  );

-- =============================================================
-- agreements_delete: 作成者、対象者、または過去のアクション実行者のみ削除可能
-- （サーバーアクション側でも権限チェック済み）
-- =============================================================
DROP POLICY "agreements_delete" ON agreements;
CREATE POLICY "agreements_delete" ON agreements
  FOR DELETE USING (
    auth.uid() = creator_id
    OR target_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM agreement_logs
      WHERE agreement_logs.agreement_id = agreements.id
        AND agreement_logs.actor_id = auth.uid()
    )
  );

-- =============================================================
-- agreement_logs_select: 対象の合意書の関係者、または自分のログのみ閲覧可能
-- =============================================================
DROP POLICY "agreement_logs_select" ON agreement_logs;
CREATE POLICY "agreement_logs_select" ON agreement_logs
  FOR SELECT USING (
    actor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM agreements
      WHERE agreements.id = agreement_logs.agreement_id
        AND (
          agreements.creator_id = auth.uid()
          OR agreements.target_email IS NULL
          OR agreements.target_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
        )
    )
  );
