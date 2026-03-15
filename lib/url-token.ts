const ENCRYPTION_SECRET = process.env.APP_ENCRYPTION_SECRET;

function getSecret(): string {
  if (!ENCRYPTION_SECRET) {
    throw new Error("APP_ENCRYPTION_SECRET is not set");
  }
  return ENCRYPTION_SECRET;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * URLトークンを導出: HMAC-SHA256(id, APP_ENCRYPTION_SECRET)
 * - 決定的: 同じidからは常に同じトークンが生成される
 * - DBに保存しない: サーバーが毎回計算する
 */
export async function generateUrlToken(id: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(id));
  return toHex(signature);
}

/**
 * URLトークンのハッシュを計算: SHA-256(urlToken)
 * - DBに保存する値
 * - urlTokenからは導出できるが、逆は不可能
 */
export async function hashUrlToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return toHex(hash);
}
