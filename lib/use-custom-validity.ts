import { useTranslations } from "next-intl";
import { useCallback } from "react";

/**
 * HTML5フォームバリデーションのメッセージを翻訳に合わせるためのハンドラを返す。
 * required属性のinputに onInvalid と onInput を設定する。
 */
export function useCustomValidity() {
  const t = useTranslations("common");

  const onInvalid = useCallback(
    (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      if (el.validity.valueMissing) {
        el.setCustomValidity(t("requiredField"));
      } else if (el.validity.typeMismatch && el.type === "email") {
        el.setCustomValidity(t("invalidEmail"));
      } else {
        el.setCustomValidity("");
      }
    },
    [t],
  );

  const onInput = useCallback(
    (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.setCustomValidity("");
    },
    [],
  );

  return { onInvalid, onInput };
}
