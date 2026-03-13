import { NextResponse, type NextRequest } from "next/server";
import {
  confirmationEmail,
  recoveryEmail,
  emailChangeEmail,
  magicLinkEmail,
} from "@/lib/email-templates";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const HOOK_SECRET = process.env.AUTH_SEND_EMAIL_HOOK_SECRET!;
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://yubikiri.vercel.app";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

type EmailPayload = {
  user: { id: string; email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    verification_url?: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
    new_email?: string;
  };
  email_action_type: string;
};

const SUBJECTS: Record<string, string> = {
  signup: "Confirm your email - Yubikiri",
  recovery: "Reset your password - Yubikiri",
  email_change: "Confirm email change - Yubikiri",
  magic_link: "Sign in to Yubikiri",
};

function buildConfirmationUrl(payload: EmailPayload): string {
  if (payload.email_data.verification_url) {
    return payload.email_data.verification_url;
  }
  const params = new URLSearchParams({
    token_hash: payload.email_data.token_hash,
    type: payload.email_action_type,
    next: payload.email_data.redirect_to || "/",
  });
  return `${SITE_URL}/auth/confirm?${params.toString()}`;
}

function renderHtml(payload: EmailPayload, url: string): string {
  switch (payload.email_action_type) {
    case "signup":
      return confirmationEmail(url);
    case "recovery":
      return recoveryEmail(url);
    case "email_change":
      return emailChangeEmail(
        url,
        payload.user.email,
        payload.email_data.new_email || payload.user.email,
      );
    case "magic_link":
      return magicLinkEmail(url);
    default:
      return `<p><a href="${url}">Click here to continue</a></p>`;
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!HOOK_SECRET || authHeader !== `Bearer ${HOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload: EmailPayload = await request.json();
  const { user, email_action_type } = payload;
  const url = buildConfirmationUrl(payload);
  const html = renderHtml(payload, url);
  const subject = SUBJECTS[email_action_type] || `Yubikiri - Action required`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Yubikiri <${FROM_EMAIL}>`,
      to: user.email,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend API error:", err);
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({});
}
