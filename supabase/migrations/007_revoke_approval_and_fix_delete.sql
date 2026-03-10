-- DELETEポリシーを修正: 作成者だけでなく、当事者も削除可能にする
-- （取り下げ承認・解除承認時に非作成者が削除するため）
-- サーバーアクション側で権限チェック済みのため、認証ユーザーなら削除可能にする
DROP POLICY "agreements_delete" ON agreements;
CREATE POLICY "agreements_delete" ON agreements
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- revoke_pending ステータスを追加
ALTER TABLE agreements DROP CONSTRAINT agreements_status_check;
ALTER TABLE agreements ADD CONSTRAINT agreements_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'revoked', 'withdraw_pending', 'revoke_pending'));

-- revoke_request, revoke_approve, revoke_reject アクションタイプを追加
ALTER TABLE agreement_logs DROP CONSTRAINT agreement_logs_action_type_check;
ALTER TABLE agreement_logs ADD CONSTRAINT agreement_logs_action_type_check
  CHECK (action_type IN ('accept', 'reject', 'revoke', 'rerequest', 'edit', 'withdraw_request', 'withdraw_approve', 'withdraw_reject', 'revoke_request', 'revoke_approve', 'revoke_reject'));
