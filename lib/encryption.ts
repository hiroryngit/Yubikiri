import type { AgreementRow } from "@/types/database";

const ENCRYPTION_SECRET = process.env.APP_ENCRYPTION_SECRET;

function getSecret(): string {
  if (!ENCRYPTION_SECRET) {
    throw new Error("APP_ENCRYPTION_SECRET is not set");
  }
  return ENCRYPTION_SECRET;
}

export async function deriveUserKey(
  userId: string,
  email: string,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(userId + email),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(getSecret()),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(
  key: CryptoKey,
  plaintext: string,
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext),
  );

  return {
    ciphertext: Buffer.from(encrypted).toString("base64"),
    iv: Buffer.from(iv).toString("hex"),
  };
}

export async function decrypt(
  key: CryptoKey,
  ciphertext: string,
  iv: string,
): Promise<string> {
  const decoder = new TextDecoder();
  const ivBytes = new Uint8Array(
    (iv.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)),
  );
  const data = Buffer.from(ciphertext, "base64");

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    data,
  );

  return decoder.decode(decrypted);
}

export async function encryptAgreement(
  userId: string,
  email: string,
  title: string,
  content: string,
): Promise<{
  encTitle: string;
  titleIv: string;
  encContent: string;
  contentIv: string;
}> {
  const key = await deriveUserKey(userId, email);
  const [titleResult, contentResult] = await Promise.all([
    encrypt(key, title),
    encrypt(key, content),
  ]);

  return {
    encTitle: titleResult.ciphertext,
    titleIv: titleResult.iv,
    encContent: contentResult.ciphertext,
    contentIv: contentResult.iv,
  };
}

export async function decryptAgreement(
  creatorId: string,
  creatorEmail: string,
  row: AgreementRow,
): Promise<{ title: string; content: string }> {
  if (!row.is_encrypted) {
    return { title: row.title, content: row.content };
  }

  const key = await deriveUserKey(creatorId, creatorEmail);
  const [title, content] = await Promise.all([
    decrypt(key, row.title, row.title_iv!),
    decrypt(key, row.content, row.content_iv!),
  ]);

  return { title, content };
}
