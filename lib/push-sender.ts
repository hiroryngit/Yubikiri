import { createAdminClient } from "@/lib/supabase/admin";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

let vapidInitialized = false;

async function getWebPush() {
  const webpush = (await import("web-push")).default;
  if (!vapidInitialized) {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return null;
    webpush.setVapidDetails(
      "mailto:noreply@yubikiri.vercel.app",
      publicKey,
      privateKey,
    );
    vapidInitialized = true;
  }
  return webpush;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const webpush = await getWebPush();
  if (!webpush) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yubikiri.vercel.app";
  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) return;

  const fullPayload = {
    ...payload,
    url: payload.url ? `${siteUrl}${payload.url}` : siteUrl,
  };

  const expiredIds: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(fullPayload),
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          expiredIds.push(sub.id);
        }
      }
    }),
  );

  if (expiredIds.length > 0) {
    await admin
      .from("push_subscriptions")
      .delete()
      .in("id", expiredIds);
  }
}
