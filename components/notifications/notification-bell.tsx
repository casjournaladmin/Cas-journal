"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getUnreadNotificationCountAction } from "@/app/notifications/actions";
import { NotificationDrawer } from "./notification-drawer";

let cachedUnreadCount: number | null = null;
let lastUnreadFetchTime = 0;
const UNREAD_THROTTLE_MS = 30000;

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState<number>(
    () => cachedUnreadCount ?? 0,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);

  const fetchUnreadCount = useCallback(async (force = false) => {
    if (isFetchingRef.current) return;
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      return;
    }

    const now = Date.now();
    if (
      !force &&
      cachedUnreadCount !== null &&
      now - lastUnreadFetchTime < UNREAD_THROTTLE_MS
    ) {
      setUnreadCount(cachedUnreadCount);
      return;
    }

    isFetchingRef.current = true;
    try {
      const res = await getUnreadNotificationCountAction();
      if (typeof res?.count === "number") {
        cachedUnreadCount = res.count;
        lastUnreadFetchTime = Date.now();
        setUnreadCount(res.count);
      }
    } catch {
      // Suppress unhandled network error
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Conservative throttled refresh without blocking or flickering initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      const now = Date.now();
      if (
        cachedUnreadCount === null ||
        now - lastUnreadFetchTime >= UNREAD_THROTTLE_MS
      ) {
        fetchUnreadCount();
      }
    }, 2000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    };

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount(true);
      }
    }, UNREAD_THROTTLE_MS);

    const handleCustomRefresh = () => {
      fetchUnreadCount(true);
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("notification-count-refresh", handleCustomRefresh);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener(
        "notification-count-refresh",
        handleCustomRefresh,
      );
    };
  }, [fetchUnreadCount]);

  const handleUnreadCountChange = useCallback((count: number) => {
    cachedUnreadCount = count;
    lastUnreadFetchTime = Date.now();
    setUnreadCount((prev) => (prev === count ? prev : count));
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : "Notifications"
        }
        onClick={() => setIsDrawerOpen(true)}
        className="relative flex size-9 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-surface-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-focus)]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="size-4.5 opacity-80"
        >
          <path
            d="M8.25 15.5C8.42 16.23 9.07 16.75 9.83 16.75C10.6 16.75 11.25 16.23 11.42 15.5H8.25Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.5 14H15.5C15.85 14 16.14 13.71 16.14 13.36C16.14 13.06 15.93 12.8 15.63 12.75L14.75 12.6V8.5C14.75 5.74 12.51 3.5 9.75 3.5C6.99 3.5 4.75 5.74 4.75 8.5V12.6L3.87 12.75C3.57 12.8 3.36 13.06 3.36 13.36C3.36 13.71 3.65 14 4.5 14Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[9px] font-bold text-white shadow-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </>
  );
}
