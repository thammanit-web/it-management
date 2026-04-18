import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Ticket, 
  Package, 
  CheckCircle2, 
  TrendingUp, 
  Activity, 
  AlertCircle,
  Clock,
} from "lucide-react";

interface StatsGridProps {
  isAdmin: boolean;
  filteredRequests: any[];
  inventory: any[];
  resolutionRate: number;
  dateFilter: string;
  session: any;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  isAdmin,
  filteredRequests,
  inventory,
  resolutionRate,
  dateFilter,
  session
}) => {
  type StatCardData = {
    label: string;
    value: string | number;
    icon: any;
    sub: React.ReactNode;
    color: string;
    isGauge?: boolean;
  };

  const adminStats: StatCardData[] = [
    { 
      label: "รายการแจ้งซ่อม / Active Tickets", 
      value: filteredRequests.filter(r => r.status !== 'RESOLVED').length, 
      icon: Ticket, 
      sub: <div className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-rose-500" /><span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Pending</span></div>, 
      color: "blue" 
    },
    { 
      label: "สต็อกต่ำ / Inventory Alert", 
      value: inventory.filter(i => i.remaining < 3).length, 
      icon: Package, 
      sub: <div className="flex items-center gap-1.5"><AlertCircle className="h-3 w-3 text-amber-500" /><span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Low stock</span></div>, 
      color: "amber" 
    },
    { 
      label: "เป้าหมายเดือนนี้ / Resolution KPI", 
      value: resolutionRate, 
      isGauge: true, 
      icon: CheckCircle2, 
      sub: <div className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-emerald-500" /><span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Resolved</span></div>, 
      color: "emerald" 
    },
    {
      label: "รายการใหม่ / Total Requests", 
      value: filteredRequests.length, 
      icon: TrendingUp, 
      sub: <div className="flex items-center gap-1.5"><Activity className="h-3 w-3 text-blue-500" /><span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">{dateFilter === "ALL" ? "All Time" : "This Period"}</span></div>, 
      color: "rose"
    },
  ];

  const userStats: StatCardData[] = [
    { label: "แจ้งซ่อมของฉัน / My Active Tickets", value: filteredRequests.filter(r => r.userId === session?.user?.id && r.status !== 'RESOLVED').length, icon: Ticket, sub: "In-progress", color: "blue" },
    { label: "รายการที่ปิดแล้ว / Resolved Tasks", value: filteredRequests.filter(r => r.userId === session?.user?.id && r.status === 'RESOLVED').length, icon: CheckCircle2, sub: "Resolved", color: "emerald" },
    { label: "รอการตรวจสอบ / Wait for Review", value: filteredRequests.filter(r => r.userId === session?.user?.id && r.status === 'OPEN').length, icon: Clock, sub: "Pending", color: "amber" },
    { label: "รายการสำคัญ / Urgent items", value: filteredRequests.filter(r => r.userId === session?.user?.id && r.priority === 'HIGH').length, icon: AlertCircle, sub: "Attention", color: "rose" },
  ];

  const statsToUse = isAdmin ? adminStats : userStats;

  return (
    <div className={cn("grid gap-4", isAdmin ? "grid-cols-2 lg:grid-cols-4" : "hidden")}>
      {statsToUse.map((stat, i) => (
        <Card key={i} className="group relative overflow-hidden p-4 border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 bg-white dark:bg-slate-900 shadow-sm">
          <div className={cn(
            "absolute -right-3 -top-3 w-20 h-20 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700",
            stat.color === 'blue' ? "bg-blue-600" : stat.color === 'amber' ? "bg-amber-600" : stat.color === 'emerald' ? "bg-emerald-600" : stat.color === 'indigo' ? "bg-indigo-600" : "bg-rose-600"
          )} />

          <div className="flex justify-between items-end gap-2">
            <div className="space-y-1">
              <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest block leading-none">{stat.label}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{stat.isGauge ? `${stat.value}%` : stat.value}</span>
                <div className="hidden sm:block shrink-0">{stat.sub}</div>
              </div>
            </div>

            {stat.isGauge && (
              <div className="relative flex items-center justify-center h-10 w-10 shrink-0 group-hover:scale-110 transition-transform duration-500">
                <svg className="transform -rotate-90 w-10 h-10">
                  <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                  <circle 
                    cx="20" 
                    cy="20" 
                    r="18" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 18} 
                    strokeDashoffset={(2 * Math.PI * 18) - ((stat.value as number) / 100) * (2 * Math.PI * 18)} 
                    className={cn("transition-all duration-1500 ease-out", (stat.value as number) >= 80 ? 'text-emerald-500' : (stat.value as number) >= 50 ? 'text-amber-500' : 'text-rose-500')} 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className={cn("h-3 w-3", (stat.value as number) >= 80 ? "text-emerald-500" : (stat.value as number) >= 50 ? "text-amber-500" : "text-rose-500")} />
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
