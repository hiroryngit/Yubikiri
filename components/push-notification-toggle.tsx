"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  registerServiceWorker,
  subscribeToPush,
  getExistingSubscription,
  serializeSubscription,
} from "@/lib/push-notifications";
import {
  savePushSubscription,
  removePushSubscription,
} from "@/app/actions/push-subscriptions";
import { useTranslations } from "next-intl";

export function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setLoading(false);
      return;
    }
    setSupported(true);

    registerServiceWorker().then(async (reg) => {
      if (!reg) {
        setLoading(false);
        return;
      }
      const existing = await getExistingSubscription(reg);
      setSubscribed(!!existing);
      setLoading(false);
    });
  }, []);

  async function handleToggle() {
    setLoading(true);
    try {
      const reg = await registerServiceWorker();
      if (!reg) return;

      if (subscribed) {
        const existing = await getExistingSubscription(reg);
        if (existing) {
          await removePushSubscription(existing.endpoint);
          await existing.unsubscribe();
        }
        setSubscribed(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const sub = await subscribeToPush(reg);
        if (!sub) return;

        const serialized = serializeSubscription(sub);
        const result = await savePushSubscription(serialized);
        if (result.success) {
          setSubscribed(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={loading}
      title={subscribed ? t("push.disable") : t("push.enable")}
    >
      {subscribed ? (
        <Bell className="h-5 w-5" />
      ) : (
        <BellOff className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  );
}
