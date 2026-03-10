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
  // 都道府県レベル（市区町村はIP判定では不正確なため使わない）
  const ipRegion = h.get("x-vercel-ip-country-region") ?? null;

  return { ipAddress, ipCountry, ipRegion };
}
