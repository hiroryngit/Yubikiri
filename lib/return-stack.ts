/**
 * ログイン後の戻り先URLをスタック管理する。
 * localStorage を使用し、OAuth外部リダイレクトを跨いでも永続化する。
 * 5分以上経過したエントリは自動破棄する。
 */

const STACK_KEY = "yubikiri_return_stack";
const MAX_AGE_MS = 5 * 60 * 1000; // 5分

type StackEntry = {
  url: string;
  timestamp: number;
};

function getStack(): StackEntry[] {
  try {
    const raw = localStorage.getItem(STACK_KEY);
    if (!raw) return [];
    const entries: StackEntry[] = JSON.parse(raw);
    const now = Date.now();
    // 期限切れのエントリを除去
    return entries.filter((e) => now - e.timestamp < MAX_AGE_MS);
  } catch {
    return [];
  }
}

function saveStack(stack: StackEntry[]): void {
  try {
    if (stack.length === 0) {
      localStorage.removeItem(STACK_KEY);
    } else {
      localStorage.setItem(STACK_KEY, JSON.stringify(stack));
    }
  } catch {
    // localStorage にアクセスできない環境では無視
  }
}

/** ログイン前に戻り先URLをスタックに積む */
export function pushReturnUrl(url: string): void {
  const stack = getStack();
  // 同じURLの重複を防ぐ
  if (stack.length > 0 && stack[stack.length - 1].url === url) return;
  stack.push({ url, timestamp: Date.now() });
  saveStack(stack);
}

/** ログイン後に戻り先URLをスタックから取り出す */
export function popReturnUrl(): string | null {
  const stack = getStack();
  if (stack.length === 0) return null;
  const entry = stack.pop()!;
  saveStack(stack);
  return entry.url;
}

/** スタックに有効な戻り先があるか確認 */
export function hasReturnUrl(): boolean {
  return getStack().length > 0;
}
