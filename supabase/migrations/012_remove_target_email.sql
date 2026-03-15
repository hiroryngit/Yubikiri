-- target_email カラムを削除（未使用）

-- RLS ポリシーから target_email 参照を除去

-- agreements_select: target_email 条件を除去
DROP POLICY "agreements_select" ON agreements;
CREATE POLICY "agreements_select" ON agreements
  FOR SELECT USING (
    auth.uid() = creator_id
    OR EXISTS (
      SELECT 1 FROM agreement_logs
      WHERE agreement_logs.agreement_id = agreements.id
        AND agreement_logs.actor_id = auth.uid()
    )
  );

-- agreements_update: target_email 条件を除去
DROP POLICY "agreements_update" ON agreements;
CREATE POLICY "agreements_update" ON agreements
  FOR UPDATE USING (
    auth.uid() = creator_id
    OR (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM agreement_logs
      WHERE agreement_logs.agreement_id = agreements.id
        AND agreement_logs.actor_id = auth.uid()
    ))
  );

-- agreements_delete: target_email 条件を除去
DROP POLICY "agreements_delete" ON agreements;
CREATE POLICY "agreements_delete" ON agreements
  FOR DELETE USING (
    auth.uid() = creator_id
    OR EXISTS (
      SELECT 1 FROM agreement_logs
      WHERE agreement_logs.agreement_id = agreements.id
        AND agreement_logs.actor_id = auth.uid()
    )
  );

-- agreement_logs_select: target_email 条件を除去
DROP POLICY "agreement_logs_select" ON agreement_logs;
CREATE POLICY "agreement_logs_select" ON agreement_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agreements
      WHERE agreements.id = agreement_logs.agreement_id
        AND (
          agreements.creator_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM agreement_logs al2
            WHERE al2.agreement_id = agreements.id
              AND al2.actor_id = auth.uid()
          )
        )
    )
  );

-- カラムを削除
ALTER TABLE agreements DROP COLUMN target_email;
