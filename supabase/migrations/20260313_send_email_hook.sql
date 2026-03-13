-- Enable pg_net extension for making HTTP requests from Postgres
create extension if not exists pg_net with schema extensions;

-- Send Email Hook function
-- Called by Supabase Auth when an email needs to be sent
create or replace function public.send_email_hook(payload jsonb)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _user_email text;
  _action_type text;
  _token_hash text;
  _redirect_to text;
  _verification_url text;
  _site_url text := 'https://yubikiri.vercel.app';
  _confirmation_url text;
  _subject text;
  _html text;
  _resend_api_key text;
  _from_email text := 'Yubikiri <onboarding@resend.dev>';
  _request_id bigint;
begin
  -- Extract payload data
  _user_email := payload->'user'->>'email';
  _action_type := payload->>'email_action_type';
  _token_hash := payload->'email_data'->>'token_hash';
  _redirect_to := coalesce(payload->'email_data'->>'redirect_to', '/');
  _verification_url := payload->'email_data'->>'verification_url';

  -- Get Resend API key from vault or use hardcoded (set via ALTER)
  _resend_api_key := current_setting('app.resend_api_key', true);

  -- Build confirmation URL
  if _verification_url is not null and _verification_url != '' then
    _confirmation_url := _verification_url;
  else
    _confirmation_url := _site_url || '/auth/confirm?token_hash=' || _token_hash || '&type=' || _action_type || '&next=' || _redirect_to;
  end if;

  -- Set subject based on action type
  case _action_type
    when 'signup' then _subject := 'Confirm your email - Yubikiri';
    when 'recovery' then _subject := 'Reset your password - Yubikiri';
    when 'email_change' then _subject := 'Confirm email change - Yubikiri';
    when 'magic_link' then _subject := 'Sign in to Yubikiri';
    else _subject := 'Yubikiri - Action required';
  end case;

  -- Build HTML email (simplified branded template)
  _html := '<!DOCTYPE html><html><head><meta charset="utf-8"></head>'
    || '<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;">'
    || '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;"><tr><td align="center">'
    || '<table width="480" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;max-width:480px;width:100%;">'
    -- Header
    || '<tr><td style="background-color:#171717;padding:28px 32px;text-align:center;">'
    || '<span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:0.5px;">&#x1F91E; Yubikiri</span>'
    || '</td></tr>'
    -- Body
    || '<tr><td style="padding:36px 32px 24px;">'
    || '<h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#171717;">' || _subject || '</h1>'
    || '<p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">Click the button below to continue.</p>'
    -- CTA button
    || '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">'
    || '<a href="' || _confirmation_url || '" style="display:inline-block;background-color:#171717;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">'
    || _subject || '</a>'
    || '</td></tr></table>'
    -- Fallback URL
    || '<p style="margin:0 0 4px;font-size:12px;color:#a1a1aa;">If the button doesn''t work, copy and paste this URL:</p>'
    || '<p style="margin:0 0 24px;font-size:12px;color:#3b82f6;word-break:break-all;">' || _confirmation_url || '</p>'
    || '<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">'
    || '<p style="margin:0;font-size:12px;color:#a1a1aa;">If you did not request this, you can safely ignore this email.</p>'
    || '</td></tr>'
    -- Footer
    || '<tr><td style="padding:16px 32px 24px;text-align:center;">'
    || '<p style="margin:0;font-size:11px;color:#a1a1aa;">&copy; Yubikiri</p>'
    || '</td></tr>'
    || '</table></td></tr></table></body></html>';

  -- Send via Resend HTTP API using pg_net
  select net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || _resend_api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', _from_email,
      'to', _user_email,
      'subject', _subject,
      'html', _html
    )
  ) into _request_id;

  return jsonb_build_object();
end;
$$;

-- Grant execute to supabase_auth_admin (required for hooks)
grant execute on function public.send_email_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.send_email_hook(jsonb) from authenticated, anon, public;
