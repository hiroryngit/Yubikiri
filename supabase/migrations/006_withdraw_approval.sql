-- agreements に取り下げ前のステータスを保存するカラム追加
ALTER TABLE agreements ADD COLUMN previous_status text;

-- status に withdraw_pending を追加
ALTER TABLE agreements DROP CONSTRAINT agreements_status_check;
ALTER TABLE agreements ADD CONSTRAINT agreements_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'revoked', 'withdraw_pending'));

-- action_type に取り下げ関連を追加
ALTER TABLE agreement_logs DROP CONSTRAINT agreement_logs_action_type_check;
ALTER TABLE agreement_logs ADD CONSTRAINT agreement_logs_action_type_check
  CHECK (action_type IN ('accept', 'reject', 'revoke', 'rerequest', 'edit', 'withdraw_request', 'withdraw_approve', 'withdraw_reject'));
