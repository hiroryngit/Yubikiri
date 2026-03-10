import { headers } from "next/headers";

/** サーバーアクションからリクエスト元のIP・地域情報を取得する */
export async function getRequestInfo() {
  const h = await headers();

  // Vercel は自動で以下のヘッダーを付与する
  const ipAddress =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;
  const ipCountry = h.get("x-vercel-ip-country") ?? null;
  const ipCity = h.get("x-vercel-ip-city")
    ? decodeURIComponent(h.get("x-vercel-ip-city")!)
    : null;

  return { ipAddress, ipCountry, ipCity };
}
