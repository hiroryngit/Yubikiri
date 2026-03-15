-- RLSポリシーの循環参照を修正
-- agreements_select → agreement_logs → agreements_select の無限ループを
-- SECURITY DEFINER 関数で断ち切る

-- RLSをバイパスして当事者チェックする関数
CREATE OR REPLACE FUNCTION is_agreement_participant(agreement_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agreements
    WHERE id = agreement_uuid AND creator_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.agreement_logs
    WHERE agreement_id = agreement_uuid AND actor_id = auth.uid()
  );
$$;

-- agreements_select を再作成（関数を使用）
DROP POLICY "agreements_select" ON agreements;
CREATE POLICY "agreements_select" ON agreements
  FOR SELECT USING (is_agreement_participant(id));

-- agreement_logs_select を再作成（関数を使用）
DROP POLICY "agreement_logs_select" ON agreement_logs;
CREATE POLICY "agreement_logs_select" ON agreement_logs
  FOR SELECT USING (is_agreement_participant(agreement_id));

-- agreements_delete も関数を使用
DROP POLICY "agreements_delete" ON agreements;
CREATE POLICY "agreements_delete" ON agreements
  FOR DELETE USING (is_agreement_participant(id));

-- agreements_update も関数を使用
DROP POLICY "agreements_update" ON agreements;
CREATE POLICY "agreements_update" ON agreements
  FOR UPDATE USING (is_agreement_participant(id));
