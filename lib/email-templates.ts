const HEADER = `<tr>
  <td style="background-color:#171717;padding:28px 32px;text-align:center;">
    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">&#x1F91E; Yubikiri</span>
  </td>
</tr>`;

const FOOTER = `<tr>
  <td style="padding:16px 32px 24px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#a1a1aa;">
      &copy; Yubikiri &mdash; Record agreements with trust and transparency.
    </p>
  </td>
</tr>`;

function securityNotice(text: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fefce8;border-radius:8px;border:1px solid #fef08a;">
  <tr><td style="padding:12px 16px;">
    <p style="margin:0;font-size:12px;color:#854d0e;line-height:1.6;">
      <strong>Security notice:</strong> ${text}
    </p>
  </td></tr>
</table>`;
}

function ctaButton(url: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:8px 0 24px;">
    <a href="${url}" style="display:inline-block;background-color:#171717;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;letter-spacing:0.3px;">
      ${label}
    </a>
  </td></tr>
</table>`;
}

function fallbackUrl(url: string): string {
  return `<p style="margin:0 0 4px;font-size:12px;color:#a1a1aa;line-height:1.6;">
  If the button doesn't work, copy and paste this URL into your browser:
</p>
<p style="margin:0 0 24px;font-size:12px;color:#3b82f6;word-break:break-all;line-height:1.6;">
  ${url}
</p>`;
}

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;max-width:480px;width:100%;">
${HEADER}
<tr><td style="padding:36px 32px 24px;">
${body}
</td></tr>
${FOOTER}
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function confirmationEmail(url: string): string {
  return wrap(`
<h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#171717;">Confirm your email</h1>
<p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
  Thank you for signing up for Yubikiri. Please confirm your email address by clicking the button below.
</p>
${ctaButton(url, "Confirm email address")}
${fallbackUrl(url)}
<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">
<p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
  If you did not create an account on Yubikiri, you can safely ignore this email.
</p>`);
}

export function recoveryEmail(url: string): string {
  return wrap(`
<h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#171717;">Reset your password</h1>
<p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
  We received a request to reset the password for your Yubikiri account. Click the button below to set a new password.
</p>
${ctaButton(url, "Reset password")}
${fallbackUrl(url)}
<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">
${securityNotice("This link expires in 1 hour. If you did not request a password reset, please ignore this email. Your password will remain unchanged.")}`);
}

export function emailChangeEmail(url: string, oldEmail: string, newEmail: string): string {
  return wrap(`
<h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#171717;">Confirm email change</h1>
<p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
  A request was made to change your Yubikiri account email from <strong style="color:#171717;">${oldEmail}</strong> to <strong style="color:#171717;">${newEmail}</strong>. Please confirm this change by clicking the button below.
</p>
${ctaButton(url, "Confirm email change")}
${fallbackUrl(url)}
<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">
${securityNotice("If you did not request this change, please ignore this email and ensure your account is secure.")}`);
}

export function magicLinkEmail(url: string): string {
  return wrap(`
<h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#171717;">Sign in to Yubikiri</h1>
<p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
  Click the button below to securely sign in to your Yubikiri account. This link is valid for a limited time.
</p>
${ctaButton(url, "Sign in")}
${fallbackUrl(url)}
<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">
<p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
  If you did not request this link, you can safely ignore this email.
</p>`);
}
