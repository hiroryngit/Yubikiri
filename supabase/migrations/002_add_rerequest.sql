-- action_type に rerequest を追加
alter table agreement_logs drop constraint agreement_logs_action_type_check;
alter table agreement_logs add constraint agreement_logs_action_type_check
  check (action_type in ('accept', 'reject', 'revoke', 'rerequest'));
