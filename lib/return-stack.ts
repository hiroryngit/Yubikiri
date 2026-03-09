/**
 * ログイン後の戻り先URLをスタック管理する。
 * localStorage を使用し、OAuth外部リダイレクトを跨いでも永続化する。
 */

const STACK_KEY = "yubikiri_return_stack";

function getStack(): string[] {
  try {
    const raw = localStorage.getItem(STACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStack(stack: string[]): void {
  try {
    localStorage.setItem(STACK_KEY, JSON.stringify(stack));
  } catch {
    // localStorage にアクセスできない環境では無視
  }
}

/** ログイン前に戻り先URLをスタックに積む */
export function pushReturnUrl(url: string): void {
  const stack = getStack();
  // 同じURLの重複を防ぐ
  if (stack[stack.length - 1] !== url) {
    stack.push(url);
    saveStack(stack);
  }
}

/** ログイン後に戻り先URLをスタックから取り出す */
export function popReturnUrl(): string | null {
  const stack = getStack();
  if (stack.length === 0) return null;
  const url = stack.pop()!;
  saveStack(stack);
  return url;
}

/** スタックに戻り先があるか確認 */
export function hasReturnUrl(): boolean {
  return getStack().length > 0;
}
