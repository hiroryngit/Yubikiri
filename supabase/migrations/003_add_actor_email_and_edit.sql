-- agreement_logs に actor_email カラム追加
ALTER TABLE agreement_logs ADD COLUMN actor_email text;

-- action_type に edit を追加
ALTER TABLE agreement_logs DROP CONSTRAINT agreement_logs_action_type_check;
ALTER TABLE agreement_logs ADD CONSTRAINT agreement_logs_action_type_check
  CHECK (action_type IN ('accept', 'reject', 'revoke', 'rerequest', 'edit'));
