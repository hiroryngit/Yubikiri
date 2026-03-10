"use client";

import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

// 静的にすべてのメッセージをインポート
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";

const messageMap: Record<string, typeof ja> = { ja, en };

function getLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return defaultLocale;
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]*)/);
  if (match) {
    const val = match[1] as Locale;
    if (locales.includes(val)) return val;
  }
  return defaultLocale;
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
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<typeof ja>(ja);

  useEffect(() => {
    const detected = getLocaleFromCookie() !== defaultLocale
      ? getLocaleFromCookie()
      : getLocaleFromBrowser();
    loadMessages(detected).then((msgs) => {
      setLocale(detected);
      setMessages(msgs);
      document.documentElement.lang = detected;
    });
  }, []);

  // cookie変更を検知して再ロード
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getLocaleFromCookie();
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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
