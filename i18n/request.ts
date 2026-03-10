import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

async function resolveLocale(): Promise<Locale> {
  try {
    // 1. Cookie から取得
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("locale")?.value as Locale | undefined;
    if (cookieLocale && locales.includes(cookieLocale)) {
      return cookieLocale;
    }

    // 2. Accept-Language ヘッダーから推定
    const headersList = await headers();
    const acceptLang = headersList.get("accept-language");
    if (acceptLang) {
      const preferred = acceptLang
        .split(",")
        .map((part) => {
          const [lang, q] = part.trim().split(";q=");
          return { lang: lang.trim(), q: q ? parseFloat(q) : 1 };
        })
        .sort((a, b) => b.q - a.q);

      for (const { lang } of preferred) {
        if (locales.includes(lang as Locale)) {
          return lang as Locale;
        }
        const prefix = lang.split("-")[0];
        if (locales.includes(prefix as Locale)) {
          return prefix as Locale;
        }
      }
    }
  } catch {
    // Static rendering (prerender) doesn't have access to cookies/headers
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
