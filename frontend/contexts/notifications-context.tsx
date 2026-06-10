'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './auth-context';
import { io, Socket } from 'socket.io-client';

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'PAYMENT' | 'COURSE' | 'ASSIGNMENT' | 'SYSTEM' | 'MEETING';
  createdAt: string;
  updatedAt: string;
}

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: string;
}

interface NotificationsContextType {
  notifications: NotificationItem[];
  isLoading: boolean;
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

// Audio Alert Synthesizer (Web Audio API)
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Crisp harmonious bell sound
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5 note
    osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.1);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(554.37, now); // C#5 note
    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(now);
    osc2.start(now);
    
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.warn('Web Audio playback failed', err);
  }
};

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Request native browser notification permissions
  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [isAuthenticated]);

  // Fetch notifications list
  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data;
    },
    enabled: isAuthenticated,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Real-time WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const token = localStorage.getItem('access_token');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

    const socketInstance = io(baseUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('Notifications WebSocket connected.');
    });

    socketInstance.on('notification', (newNotification: NotificationItem) => {
      console.log('Received real-time notification:', newNotification);
      
      // 1. Play premium alert sound
      playNotificationSound();

      // 2. Trigger native desktop push notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new window.Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/logo.jpg',
          });
        } catch (e) {
          console.warn('Failed to display native desktop notification', e);
        }
      }

      // 3. Show in-app visual toast
      const toastId = Math.random().toString(36).substring(7);
      setToasts((prev) => [
        ...prev,
        {
          id: toastId,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
        },
      ]);

      // Automatically remove toast after 4.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 4500);

      // 4. Update React Query cache
      queryClient.setQueryData<NotificationItem[]>(['notifications'], (old = []) => {
        if (old.some((n) => n._id === newNotification._id)) return old;
        return [newNotification, ...old];
      });
    });

    setSocket(socketInstance);
    // eslint-disable-next-line react-hooks/set-state-in-effect

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user, queryClient]);

  // Mark single read mutation
  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: (updatedNotification: NotificationItem) => {
      queryClient.setQueryData<NotificationItem[]>(['notifications'], (old = []) => {
        return old.map((n) => (n._id === updatedNotification._id ? updatedNotification : n));
      });
    },
  });

  // Mark all read mutation
  const readAllMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/notifications/read-all');
      return data;
    },
    onSuccess: () => {
      queryClient.setQueryData<NotificationItem[]>(['notifications'], (old = []) => {
        return old.map((n) => ({ ...n, read: true }));
      });
    },
  });

  const markAsRead = (id: string) => {
    readMutation.mutate(id);
  };

  const markAllAsRead = () => {
    readAllMutation.mutate();
  };

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

      {/* Floating stack of visual Toast banners */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes slideInNotification {
              from {
                transform: translateY(20px) scale(0.95);
                opacity: 0;
              }
              to {
                transform: translateY(0) scale(1);
                opacity: 1;
              }
            }
            .animate-slide-in-notification {
              animation: slideInNotification 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          ` }} />

          {toasts.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl border border-base-300 shadow-2xl flex gap-3 bg-base-100/90 backdrop-blur-md animate-slide-in-notification relative overflow-hidden transition-all duration-300 hover:translate-x-[-4px]"
            >
              {/* Colored type-specific sidebar decoration */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  t.type === 'PAYMENT' ? 'bg-success' :
                  t.type === 'COURSE' ? 'bg-primary' :
                  t.type === 'ASSIGNMENT' ? 'bg-warning' :
                  t.type === 'MEETING' ? 'bg-info' : 'bg-neutral'
                }`}
              />

              <div className="pl-2 flex-1 text-left">
                <h4 className="font-extrabold text-xs text-base-content tracking-tight">{t.title}</h4>
                <p className="text-[10px] text-base-content/75 mt-1 leading-normal font-medium">{t.message}</p>
              </div>

              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-base-content/40 hover:text-base-content text-[11px] font-bold self-start shrink-0 ml-1 cursor-pointer transition-colors duration-150"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
