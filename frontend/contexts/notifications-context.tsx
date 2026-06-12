"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, BookOpen, CheckSquare, CreditCard, Video } from "lucide-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "./auth-context";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: "PAYMENT" | "COURSE" | "ASSIGNMENT" | "SYSTEM" | "MEETING";
  createdAt: string;
  updatedAt: string;
}

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: NotificationItem["type"];
}

interface NotificationsContextType {
  notifications: NotificationItem[];
  isLoading: boolean;
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(
  null,
);

// ─── Audio ────────────────────────────────────────────────────────────────────

const playNotificationSound = () => {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.1);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(554.37, now);
    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.7);
  } catch {
    // silently ignore
  }
};

// ─── Toast type config ────────────────────────────────────────────────────────

const typeConfig: Record<string, { icon: React.ElementType; accent: string }> =
  {
    PAYMENT: { icon: CreditCard, accent: "bg-success" },
    COURSE: { icon: BookOpen, accent: "bg-primary" },
    ASSIGNMENT: { icon: CheckSquare, accent: "bg-warning" },
    MEETING: { icon: Video, accent: "bg-info" },
    SYSTEM: { icon: Bell, accent: "bg-neutral" },
  };

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Request browser notification permission once
  useEffect(() => {
    if (
      isAuthenticated &&
      typeof window !== "undefined" &&
      "Notification" in window
    ) {
      if (Notification.permission === "default")
        Notification.requestPermission();
    }
  }, [isAuthenticated]);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications");
      return data;
    },
    enabled: isAuthenticated,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Dismiss a toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle an incoming real-time notification
  const handleIncoming = useCallback(
    (newNotification: NotificationItem) => {
      playNotificationSound();

      // Native desktop push
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new window.Notification(newNotification.title, {
            body: newNotification.message,
            icon: "/logo.jpg",
          });
        } catch {
          // ignore
        }
      }

      // In-app toast
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [
        ...prev,
        {
          id,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
        },
      ]);
      setTimeout(() => dismissToast(id), 4500);

      // Update cache
      queryClient.setQueryData<NotificationItem[]>(
        ["notifications"],
        (old = []) => {
          if (old.some((n) => n._id === newNotification._id)) return old;
          return [newNotification, ...old];
        },
      );
    },
    [queryClient, dismissToast],
  );

// WebSocket
   useEffect(() => {
     if (!isAuthenticated || !user) return;

     const token = localStorage.getItem("access_token");
     const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

     const socket: Socket = io(baseUrl, {
       auth: { token },
       transports: ["websocket", "polling"],
     });

     socket.on("connect_error", (err) => {
       console.warn("Socket connection failed (expected on serverless):", err.message);
     });

     socket.on("notification", handleIncoming);

     return () => {
       socket.disconnect();
     };
   }, [isAuthenticated, user, handleIncoming]);

  // Mark single read
  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data as NotificationItem;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<NotificationItem[]>(
        ["notifications"],
        (old = []) => old.map((n) => (n._id === updated._id ? updated : n)),
      );
    },
  });

  // Mark all read
  const readAllMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch("/notifications/read-all");
      return data;
    },
    onSuccess: () => {
      queryClient.setQueryData<NotificationItem[]>(
        ["notifications"],
        (old = []) => old.map((n) => ({ ...n, read: true })),
      );
    },
  });

  const markAsRead = useCallback(
    (id: string) => readMutation.mutate(id),
    [readMutation],
  );
  const markAllAsRead = useCallback(
    () => readAllMutation.mutate(),
    [readAllMutation],
  );

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        isLoading,
        unreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}

      {/* ── Toast stack ───────────────────────────────────────────── */}
      <div
        aria-live="polite"
        className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-[9999] flex flex-col gap-2.5 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const cfg = typeConfig[toast.type] ?? typeConfig.SYSTEM;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-auto relative overflow-hidden flex gap-3 items-start p-3.5 bg-base-100/95 backdrop-blur-xl border border-base-content/10 rounded-2xl shadow-xl shadow-base-content/10"
              >
                {/* Color bar */}
                <span
                  className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.accent}`}
                />

                {/* Icon */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.accent}/15`}
                >
                  <Icon
                    className={`w-4 h-4 ${cfg.accent.replace("bg-", "text-")}`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pl-1">
                  <p className="text-xs font-extrabold text-base-content leading-none truncate">
                    {toast.title}
                  </p>
                  <p className="text-[10px] text-base-content/60 mt-1 leading-normal line-clamp-2">
                    {toast.message}
                  </p>
                </div>

                {/* Dismiss */}
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="shrink-0 w-5 h-5 rounded-lg flex items-center justify-center text-base-content/35 hover:text-base-content hover:bg-base-content/8 transition-colors text-xs font-bold"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  return ctx;
}
