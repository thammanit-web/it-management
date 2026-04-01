"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LogOut, 
  X,
  ChevronRight,
  ShieldAlert,
  LayoutDashboard,
  CheckCircle2,
  Ticket,
  Box,
  ShoppingCart,
  Truck,
  Warehouse,
  Users,
  UserCog,
  FileJson,
  History,
  ChevronLeft,
  Search,
  PlusCircle,
  Laptop
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface SidebarLink {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ isCollapsed, onToggle, isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const role = (session?.user as any)?.role || "user";

  // Dynamic Badge State
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (role !== "admin") return;

    const fetchCounts = async () => {
      try {
        const [eqRes, ticketRes] = await Promise.all([
          fetch("/api/equipment-requests"),
          fetch("/api/requests")
        ]);
        const eqData = await eqRes.json();
        const ticketData = await ticketRes.json();

        const pendingEq = Array.isArray(eqData) ? eqData.filter((r: any) => !r.it_approval_status || r.it_approval_status === "PENDING").length : 0;
        const pendingTickets = Array.isArray(ticketData) ? ticketData.filter((r: any) => !r.it_approval_status || r.it_approval_status === "PENDING").length : 0;

        setPendingCount(pendingEq + pendingTickets);
      } catch (error) {
        console.error("Failed to fetch pending counts:", error);
      }
    };

    fetchCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [role]);

  const adminLinks: SidebarLink[] = [
    { name: t('sidebar.dashboard'), href: "/", icon: LayoutDashboard },
    { name: t('sidebar.approvals'), href: "/admin/approvals", icon: CheckCircle2, badge: pendingCount > 0 ? pendingCount.toString() : undefined },
    { name: t('sidebar.tickets'), href: "/admin/tickets", icon: Ticket },
    { name: t('sidebar.borrowing'), href: "/admin/equipment-requests", icon: Box },
    { name: t('sidebar.purchase_orders'), href: "/admin/purchase-orders", icon: ShoppingCart },
    { name: t('sidebar.receiving'), href: "/admin/equipment-entry-lists", icon: Truck },
    { name: t('sidebar.inventory'), href: "/admin/inventory", icon: Warehouse },
    { name: t('sidebar.employees'), href: "/admin/employees", icon: Users },
    { name: t('sidebar.users'), href: "/admin/users", icon: UserCog },
    { name: t('sidebar.import'), href: "/admin/import", icon: FileJson },
    { name: t('sidebar.logs'), href: "/admin/logs", icon: History },
  ];

  const userLinks: SidebarLink[] = [
    { name: t('sidebar.dashboard'), href: "/", icon: LayoutDashboard },
    { name: t('sidebar.my_requests'), href: "/user/my-requests", icon: Ticket },
    { name: t('sidebar.borrow_equipment'), href: "/user/borrow", icon: PlusCircle },
  ];

  const links = role === "admin" ? adminLinks : userLinks;

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0B0C10] text-[#E9ECEF] border-r border-[#2A2E36] transition-all duration-300">
      {/* Header / Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-[#2A2E36] transition-all duration-300",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-[#4C6EF5] flex items-center justify-center text-white shadow-lg shadow-[#4C6EF5]/20">
            <Laptop className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-bold text-sm tracking-tight uppercase leading-none text-white">NDC IT</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#868E96] mt-1 font-bold">Service Hub</span>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <button 
            onClick={onToggle}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-[#1A1D24] text-[#868E96] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Menu Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {!isCollapsed && (
          <p className="px-3 mb-2 text-[10px] font-bold text-[#868E96] uppercase tracking-[0.15em]">
            {t('sidebar.main_menu')}
          </p>
        )}
        
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onCloseMobile()}
              title={isCollapsed ? link.name : ""}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 relative",
                isActive 
                  ? "bg-[#4C6EF5] text-white shadow-md shadow-[#4C6EF5]/20" 
                  : "text-[#868E96] hover:bg-[#1A1D24] hover:text-[#E9ECEF]"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110", isActive && "text-white")} />
              
              {!isCollapsed && (
                <span className="flex-1 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  {link.name}
                </span>
              )}

              {link.badge && !isCollapsed && (
                <Badge className="bg-[#FF6B6B] text-white border-none h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] px-1 font-bold">
                  {link.badge}
                </Badge>
              )}

              {link.badge && isCollapsed && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B6B] rounded-full border-2 border-[#0B0C10]"></span>
              )}

              {isActive && !isCollapsed && (
                 <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/50" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer / User */}
      <div className="p-3 border-t border-[#2A2E36] bg-[#111217]/50">
        {isCollapsed ? (
          <button 
            onClick={onToggle}
            className="w-full flex justify-center p-2.5 rounded-xl hover:bg-[#1A1D24] text-[#868E96] transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : (
          <div className="space-y-4">
             <div className="flex items-center gap-3 px-1">
                <div className="h-9 w-9 rounded-lg bg-[#1A1D24] border border-[#2A2E36] flex items-center justify-center text-white shrink-0">
                   {session?.user?.name?.[0] || <Users className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                   <p className="text-xs font-bold text-white truncate">{session?.user?.name || 'Authorized'}</p>
                   <p className="text-[10px] text-[#868E96] uppercase font-bold truncate tracking-tight">{role}</p>
                </div>
             </div>
             
             <button
                onClick={() => signOut()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-all active:scale-95"
             >
                <LogOut className="h-5 w-5" />
                <span className="uppercase tracking-wide">{t('sidebar.logout')}</span>
             </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 transition-all duration-300",
          isCollapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-2xl"
            >
              {sidebarContent}
              <button 
                onClick={onCloseMobile}
                className="absolute top-4 -right-12 p-2 bg-white rounded-full text-zinc-900 shadow-lg lg:hidden"
              >
                <X className="h-6 w-6" />
              </button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
