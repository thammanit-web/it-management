"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useDashboardData } from "@/hooks/dashboard/useDashboardData";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { InventoryStock } from "@/components/dashboard/InventoryStock";
import { logger } from "@/lib/logger";
import { useEffect, Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PublicDirectory } from "@/components/notes/public-directory";

// Lazy-load heavier components for performance
const StatsGrid = lazy(() => import("@/components/dashboard/StatsGrid").then(module => ({ default: module.StatsGrid })));
const DashboardCharts = lazy(() => import("@/components/dashboard/DashboardCharts").then(module => ({ default: module.DashboardCharts })));

const LoadingFallback = () => (
  <div className="w-full flex justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-[#0F1059]" />
  </div>
);

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = (session?.user as any)?.role === "admin";

  const {
    filteredRequests,
    activities,
    filteredActivities,
    inventory,
    isLoading,
    error,
    dateFilter,
    setDateFilter,
    monthOptions,
    chartConfig,
    updateChartConfig,
    hiddenSeries,
    toggleSeries,
    categoryData,
    trendData,
    urgencyData,
    resolutionRateThisMonth,
    departmentMonthData,
    typeRequestData,
    refreshData,
    requests
  } = useDashboardData(isAdmin, session);

  useEffect(() => {
    if (error) {
      logger.error("Dashboard error state detected", error);
    }
  }, [error]);

  const handleChartClick = (_type: string, value: string) => {
    if (isAdmin) {
      router.push(`/admin/tickets?q=${encodeURIComponent(value)}`);
    }
  };

  if (!session) return null;

  return (
    <div className="p-4 sm:p-5 space-y-4 w-full animate-in fade-in duration-1000">
      <DashboardHeader
        isAdmin={isAdmin}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        monthOptions={monthOptions}
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider">
          {error}
        </div>
      )}

      {!isAdmin && <QuickActions />}

      <Suspense fallback={<div className="h-32 bg-zinc-50 rounded-2xl animate-pulse" />}>
        <StatsGrid
          isAdmin={isAdmin}
          filteredRequests={filteredRequests}
          inventory={inventory}
          resolutionRate={resolutionRateThisMonth}
          dateFilter={dateFilter}
          session={session}
        />
      </Suspense>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4 w-full">
          {isAdmin && (
            <Suspense fallback={<LoadingFallback />}>
              <DashboardCharts
                dateFilter={dateFilter}
                trendData={trendData}
                urgencyData={urgencyData}
                categoryData={categoryData}
                departmentMonthData={departmentMonthData}
                typeRequestData={typeRequestData}
                chartConfig={chartConfig}
                updateChartConfig={updateChartConfig}
                hiddenSeries={hiddenSeries}
                toggleSeries={toggleSeries}
                handleChartClick={handleChartClick}
                requests={requests}
              />
            </Suspense>
          )}
          {!isAdmin && (
            <div className="space-y-4">
               <PublicDirectory />
               <InventoryStock inventory={inventory} />
            </div>
          )}
        </div>

        <div className="space-y-4 xl:col-span-1">

          <RecentActivity
            isAdmin={isAdmin}
            isLoading={isLoading}
            filteredActivities={filteredActivities}
            onRefresh={refreshData}
            router={router}
            session={session}
          />
        </div>
      </div>
    </div>
  );
}
