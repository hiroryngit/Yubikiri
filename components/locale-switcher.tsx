"use client";

import { useLocale } from "next-intl";
import { locales, localeNames, type Locale } from "@/i18n/config";

export function LocaleSwitcher() {
  const currentLocale = useLocale();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const locale = e.target.value as Locale;
    document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <select
      value={currentLocale}
      onChange={handleChange}
      className="bg-background border border-input rounded-md px-2 py-1 text-xs cursor-pointer text-foreground"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale} className="bg-background text-foreground">
          {localeNames[locale]}
        </option>
      ))}
    </select>
  );
}
