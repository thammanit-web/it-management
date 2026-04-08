"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { Sidebar } from "@/components/sidebar";
import { 
  Menu, 
  User, 
  ChevronRight,
  LogOut
} from "lucide-react";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { AIChatFAB } from "@/components/ai/AIChatFAB";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { t } = useTranslation();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      const empId = (session?.user as any)?.employeeId;
      if (!empId) return;
      try {
        const res = await fetch(`/api/employees/${empId}`);
        const data = await res.json();
        setEmployee(data);
      } catch (error) {
        console.error("Fetch employee error:", error);
      }
    };
    if (session) fetchEmployee();
  }, [session]);

  const breadcrumbs = useMemo(() => {
    const paths = pathname.split("/").filter(Boolean);
    return paths.map((p, i) => ({
      name: p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " "),
      href: "/" + paths.slice(0, i + 1).join("/"),
    }));
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300 font-sans">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 min-w-0",
        isSidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[240px]"
      )}>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-surface px-4 lg:px-6 border-border">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsMobileOpen(true)} 
               className="lg:hidden p-2 text-accent hover:text-primary transition-all rounded-lg hover:bg-secondary"
             >
                <Menu className="h-5 w-5" />
             </button>
             
             {/* Breadcrumb */}
             <nav className="hidden md:flex items-center text-sm font-medium text-accent">
                <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => window.location.href = '/'}>Home</span>
                {breadcrumbs.map((crumb, i) => (
                  <div key={i} className="flex items-center">
                    <ChevronRight className="h-4 w-4 mx-2 opacity-50" />
                    <span className={cn(
                      "capitalize",
                      i === breadcrumbs.length - 1 ? "text-foreground font-semibold" : "hover:text-primary cursor-pointer"
                    )}>
                      {crumb.name}
                    </span>
                  </div>
                ))}
             </nav>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
             <ThemeSwitcher />
             <LanguageSwitcher />

             <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>

             {/* Profile Dropdown */}
             <Dropdown
                trigger={
                  <button className="flex items-center gap-2 lg:gap-3 p-1 hover:bg-secondary rounded-xl transition-all group">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 transition-transform group-hover:scale-105">
                       {session?.user?.name?.[0] || <User className="h-5 w-5" />}
                    </div>
                    <div className="text-left hidden sm:block pr-1">
                       <p className="text-sm font-bold text-foreground leading-none">{employee?.employee_name_th || session?.user?.name || "System Member"}</p> 
                       <p className="text-[10px] text-accent font-medium uppercase mt-1 tracking-tight">{employee?.department || (session?.user as any)?.role || "User"}</p>
                    </div>
                  </button>
                }
              >
                <div className="w-56 p-2">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-xs font-semibold text-accent uppercase">{employee?.employee_name_th}</p>
                  </div>
                  <DropdownItem className="rounded-lg gap-3 py-2.5" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 text-danger" />
                    <span className="text-danger font-semibold">{t('profile.sign_out')}</span>
                  </DropdownItem>
                </div>
             </Dropdown>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 layout-gap flex flex-col">
          {children}
        </main>
      </div>
      <AIChatFAB />
    </div>
  );
}
