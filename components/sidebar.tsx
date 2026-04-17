"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Ticket, 
  PlusCircle, 
  Box, 
  ShoppingCart, 
  Truck, 
  Warehouse, 
  Laptop, 
  Lock, 
  ShieldCheck, 
  Users, 
  UserCog, 
  FileJson, 
  History, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
  X,
  AlertTriangle
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { getPendingTicketsCount } from "@/lib/actions/ticket-actions";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface SidebarLink {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

export function Sidebar({ isCollapsed, onToggle, isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [pendingCount, setPendingCount] = useState(0);

  const role = (session?.user as any)?.role;

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const count = await getPendingTicketsCount();
        setPendingCount(count);
      } catch (error) {
        console.error("Failed to fetch pending tickets:", error);
      }
    };

    if (role === "admin") {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [role]);

  const adminLinks: SidebarLink[] = [
    { name: t('sidebar.dashboard'), href: "/", icon: LayoutDashboard },
    { name: t('sidebar.approvals'), href: "/admin/approvals", icon: CheckCircle2, badge: pendingCount > 0 ? pendingCount.toString() : undefined },
    { name: t('sidebar.tickets'), href: "/admin/tickets", icon: Ticket },

    { name: t('sidebar.borrowing'), href: "/admin/equipment-requests", icon: Box },
    { name: t('sidebar.purchase_orders'), href: "/admin/purchase-orders", icon: ShoppingCart },
    { name: t('sidebar.receiving'), href: "/admin/equipment-entry-lists", icon: Truck },
    { name: t('sidebar.inventory'), href: "/admin/inventory", icon: Warehouse },
    { name: t('sidebar.assets'), href: "/admin/assets", icon: Laptop },
    { name: t('sidebar.credentials'), href: "/admin/credentials", icon: Lock },
    { name: t('sidebar.it_vault'), href: "/user/notes", icon: ShieldCheck },
    { name: "Incident Reports", href: "/admin/incident-reports", icon: AlertTriangle },
    { name: t('sidebar.employees'), href: "/admin/employees", icon: Users },
    { name: t('sidebar.users'), href: "/admin/users", icon: UserCog },
    { name: t('sidebar.import'), href: "/admin/import", icon: FileJson },
    { name: t('sidebar.logs'), href: "/admin/logs", icon: History },
  ];

  const userLinks: SidebarLink[] = [
    { name: t('sidebar.dashboard'), href: "/", icon: LayoutDashboard },
    { name: t('sidebar.my_requests'), href: "/user/my-requests", icon: Ticket },
    { name: t('sidebar.borrow_equipment'), href: "/user/borrow", icon: PlusCircle },
    { name: t('sidebar.inventory'), href: "/user/inventory", icon: Warehouse },
    { name: t('sidebar.it_vault'), href: "/user/notes", icon: ShieldCheck },
    { name: "Incident Reports", href: "/user/incident-reports", icon: AlertTriangle },
  ];

  const links = role === "admin" ? adminLinks : userLinks;

  const NavLink = ({ link, onClick }: { link: SidebarLink, onClick?: () => void }) => {
    const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
    
    return (
      <Link
        href={link.href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group",
          isActive 
            ? "bg-primary text-white shadow-lg shadow-primary/20 font-bold" 
            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
        )}
      >
        <link.icon className={cn(
          "h-5 w-5 transition-transform duration-300",
          isActive ? "scale-110" : "group-hover:scale-110"
        )} />
        {!isCollapsed && (
          <span className="text-sm truncate flex-1">{link.name}</span>
        )}
        {!isCollapsed && link.badge && (
           <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-rose-500/20">
              {link.badge}
           </span>
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0B0C10] text-[#E9ECEF] border-r border-[#2A2E36] transition-all duration-300">
      {/* Header / Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-[#2A2E36] transition-all duration-300",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="font-white text-lg tracking-tighter uppercase whitespace-nowrap">
               IT SYSTEM
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="hidden lg:flex h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCloseMobile}
          className="lg:hidden h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
        >
          <X size={18} />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide px-3 py-4 space-y-1">
        {links.map((link) => (
          <NavLink key={link.href} link={link} onClick={onCloseMobile} />
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#2A2E36] space-y-2">
        
        {!isCollapsed && session?.user && (
           <div className="flex items-center gap-3 p-2 bg-slate-800/30 rounded-xl mb-2">
              <div className="h-9 w-9 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 shrink-0 capitalize">
                 {session.user.name?.charAt(0) || <UserIcon size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                 <p className="text-xs font-black truncate">{session.user.name}</p>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">{role}</p>
              </div>
           </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-300",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm font-bold uppercase tracking-wider">{t('profile.sign_out')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:block h-screen fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[72px]" : "w-[240px]"
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
