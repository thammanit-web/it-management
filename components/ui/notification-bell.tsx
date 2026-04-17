"use client";

import React, { useEffect, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { Dropdown } from "./dropdown";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string;
  createdAt: string;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Admin and users could have notifications, but we primarily target admin per requirements.
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchNotifications();
      // Optional: Poll every 60s
      // const i = setInterval(fetchNotifications, 60000);
      // return () => clearInterval(i);
    }
  }, [session]);

  const markAsReadAndNavigate = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await fetch(`/api/notifications/${notif.id}`, { method: "PUT" });
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) => 
          prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n)
        );
      } catch (e) {
        console.error(e);
      }
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const markAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications`, { method: "PUT" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // If not admin, the API might not return anything, or at least we render it anyway
  // and they see their own if any.

  return (
    <Dropdown
      align="right"
      className="w-[340px] max-h-[85vh] overflow-hidden flex flex-col"
      trigger={
        <button className="relative p-2 rounded-xl text-accent hover:text-primary hover:bg-secondary transition-all">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-rose-500 rounded-full border border-surface shadow-sm"></span>
          )}
        </button>
      }
    >
      <div className="flex flex-col h-full max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-surface z-10 shrink-0">
          <p className="font-black text-[13px] uppercase tracking-widest text-primary flex items-center gap-2">
            Notifications 
            {unreadCount > 0 && (
              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">
                {unreadCount} NEW
              </span>
            )}
          </p>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-[10px] uppercase font-black tracking-widest text-accent hover:text-primary transition-colors flex items-center gap-1"
            >
              <Check className="h-3 w-3" /> Mark Read
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="py-8 flex justify-center text-accent">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 px-4 text-center text-accent">
              <p className="text-xs font-bold uppercase tracking-widest">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsReadAndNavigate(n)}
                  className={cn(
                    "px-4 py-3 cursor-pointer transition-all hover:bg-secondary/50",
                    !n.isRead ? "bg-primary/5" : "opacity-80"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[12px] font-black uppercase tracking-tight truncate leading-tight",
                        !n.isRead ? "text-primary" : "text-foreground"
                      )}>
                        {n.title}
                      </p>
                      <p className="text-[11px] font-medium text-foreground/70 mt-1 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="shrink-0 w-2 h-2 rounded-full bg-rose-500 mt-1"></div>
                    )}
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-accent mt-2">
                    {new Date(n.createdAt).toLocaleString('en-GB')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dropdown>
  );
}
