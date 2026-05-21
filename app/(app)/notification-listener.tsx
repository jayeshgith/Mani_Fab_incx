"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
};

export default function NotificationListener() {
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/notifications?unread=true", {
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || cancelled) return;

        const notifications: NotificationItem[] = Array.isArray(data?.notifications)
          ? data.notifications
          : [];

        if (notifications.length === 0) return;

        notifications.forEach((notification) => {
          toast(notification.title || "Notification", {
            description: notification.message,
          });
        });

        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: notifications.map((notification) => notification.id),
          }),
        });
      } catch {
        // Ignore toast fetch errors to avoid blocking page render.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
