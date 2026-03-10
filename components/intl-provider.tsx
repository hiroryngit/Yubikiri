"use client";

import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

// 静的にすべてのメッセージをインポート
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";

const messageMap: Record<string, typeof ja> = { ja, en };

function getLocaleFromCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]*)/);
  if (match) {
    const val = match[1] as Locale;
    if (locales.includes(val)) return val;
  }
  return null;
}

function getLocaleFromBrowser(): Locale {
  if (typeof navigator === "undefined") return defaultLocale;
  for (const lang of navigator.languages ?? [navigator.language]) {
    if (locales.includes(lang as Locale)) return lang as Locale;
    const prefix = lang.split("-")[0] as Locale;
    if (locales.includes(prefix)) return prefix;
  }
  return defaultLocale;
}

// 初期ロケールを同期的に決定（SSR時はデフォルト、クライアントではcookie/ブラウザ言語）
function getInitialLocale(): Locale {
  const fromCookie = getLocaleFromCookie();
  if (fromCookie) return fromCookie;
  return getLocaleFromBrowser();
}

function getInitialMessages(locale: Locale): typeof ja {
  return messageMap[locale] ?? ja;
}

async function loadMessages(locale: Locale) {
  if (messageMap[locale]) return messageMap[locale];
  try {
    const mod = await import(`@/messages/${locale}.json`);
    messageMap[locale] = mod.default;
    return mod.default;
  } catch {
    return messageMap[defaultLocale];
  }
}

export function IntlProvider({ children }: { children: ReactNode }) {
  const initialLocale = getInitialLocale();
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<typeof ja>(getInitialMessages(initialLocale));
  const [ready, setReady] = useState(!!messageMap[initialLocale]);

  // 初回：静的importにないロケールの場合、非同期で読み込む
  useEffect(() => {
    if (!messageMap[locale]) {
      loadMessages(locale).then((msgs) => {
        setMessages(msgs);
        setReady(true);
        document.documentElement.lang = locale;
      });
    } else {
      document.documentElement.lang = locale;
      setReady(true);
    }
  }, []);

  // cookie変更を検知して再ロード
  useEffect(() => {
    const interval = setInterval(() => {
      const fromCookie = getLocaleFromCookie();
      const current = fromCookie ?? defaultLocale;
      if (current !== locale) {
        loadMessages(current).then((msgs) => {
          setLocale(current);
          setMessages(msgs);
          document.documentElement.lang = current;
        });
      }
    }, 500);
    return () => clearInterval(interval);
  }, [locale]);

  // 非同期読み込み中は何も表示しない（一瞬だけ）
  if (!ready) return null;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
