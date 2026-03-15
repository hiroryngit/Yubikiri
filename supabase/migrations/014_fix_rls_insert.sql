-- RLS修正: INSERT+RETURNINGで新規行が見えない問題を解決
-- agreements_selectはインラインに戻し、agreement_logs_selectのみ
-- SECURITY DEFINER関数で循環参照を断ち切る

-- 先にポリシーを全て削除（旧関数への依存を解除）
DROP POLICY IF EXISTS "agreements_select" ON agreements;
DROP POLICY IF EXISTS "agreements_update" ON agreements;
DROP POLICY IF EXISTS "agreements_delete" ON agreements;
DROP POLICY IF EXISTS "agreement_logs_select" ON agreement_logs;

-- 旧関数を削除
DROP FUNCTION IF EXISTS is_agreement_participant(uuid);

-- 新関数: agreementsテーブルのcreator_idのみチェック
CREATE OR REPLACE FUNCTION is_agreement_creator(agreement_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agreements
    WHERE id = agreement_uuid AND creator_id = auth.uid()
  );
$$;

-- agreements_select: インライン（関数不使用）
CREATE POLICY "agreements_select" ON agreements
  FOR SELECT USING (
    auth.uid() = creator_id
    OR EXISTS (
      SELECT 1 FROM agreement_logs
      WHERE agreement_logs.agreement_id = agreements.id
        AND agreement_logs.actor_id = auth.uid()
    )
  );

-- agreement_logs_select: SECURITY DEFINER関数でcreator判定（循環回避）
CREATE POLICY "agreement_logs_select" ON agreement_logs
  FOR SELECT USING (
    actor_id = auth.uid()
    OR is_agreement_creator(agreement_id)
  );

-- agreements_update: インライン
CREATE POLICY "agreements_update" ON agreements
  FOR UPDATE USING (
    auth.uid() = creator_id
    OR EXISTS (
      SELECT 1 FROM agreement_logs
      WHERE agreement_logs.agreement_id = agreements.id
        AND agreement_logs.actor_id = auth.uid()
    )
  );

-- agreements_delete: インライン
CREATE POLICY "agreements_delete" ON agreements
  FOR DELETE USING (
    auth.uid() = creator_id
    OR EXISTS (
      SELECT 1 FROM agreement_logs
      WHERE agreement_logs.agreement_id = agreements.id
        AND agreement_logs.actor_id = auth.uid()
    )
  );
