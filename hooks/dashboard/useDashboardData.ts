import { useState, useEffect, useMemo, useCallback } from "react";
import { DashboardService } from "@/lib/services/dashboard-service";
import { logger } from "@/lib/logger";

export function useDashboardData(isAdmin: boolean, session: any) {
  const [requests, setRequests] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Month Filter States
  const [dateFilter, setDateFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Chart Hidden Series
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

  // Dashboard Chart Config States
  const [chartConfig, setChartConfig] = useState<any>({
    trend: { months: 6 },
    proportion: { sort: 'value', order: 'desc', limit: 10 },
    priority: { months: 6 },
    department: { months: 6, selected: [] as string[] },
    type: { sort: 'value', order: 'desc', limit: 7 }
  });

  const updateChartConfig = useCallback((chart: string, updates: any) => {
    setChartConfig((prev: any) => ({
      ...prev,
      [chart]: { ...prev[chart], ...updates }
    }));
  }, []);

  const toggleSeries = useCallback((key: string) => {
    setHiddenSeries(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!session) return;
    
    setIsLoading(true);
    setError(null);
    logger.info("Fetching dashboard data...");

    try {
      const results = await Promise.all([
        DashboardService.getRequests(),
        isAdmin ? DashboardService.getEquipmentEntries() : Promise.resolve({ data: [] }),
        DashboardService.getInventory()
      ]);

      const [requestsRes, entriesRes, inventoryRes] = results;

      if (requestsRes.error || (isAdmin && (entriesRes as any).error) || inventoryRes.error) {
        const err = requestsRes.error || (entriesRes as any).error || inventoryRes.error;
        setError(err || "Failed to fetch dashboard data");
        return;
      }

      const requestsData = requestsRes.data || [];
      const inventoryData = inventoryRes.data || [];
      const entriesData = entriesRes.data || [];

      setRequests(requestsData);
      setInventory(inventoryData);

      if (isAdmin) {
        const merged = [
          ...requestsData.filter((r: any) => r.status !== 'CLOSED' && r.status !== 'RESOLVED').map((r: any) => ({ ...r, type: 'REQUEST' })),
          ...entriesData.map((e: any) => ({ ...e, type: 'EQUIPMENT' }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivities(merged);
      } else {
        // For users, show all requests provided by the API (which includes their own closed ones and others' open ones)
        setActivities(requestsData.map((r: any) => ({ ...r, type: 'REQUEST' })));
      }
      
      logger.info("Dashboard data fetched successfully.");
    } catch (err: any) {
      logger.error("Caught error during dashboard data fetch", err);
      setError("An unexpected error occurred while fetching data.");
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, session]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived Values (useMemo)
  const monthOptions = useMemo(() => {
    const options = new Set<string>();
    const now = new Date();
    options.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    requests.forEach(r => {
      const d = new Date(r.createdAt);
      if (!isNaN(d.getTime())) {
        options.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    return Array.from(options).sort().reverse();
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (dateFilter === "ALL") return requests;
    return requests.filter(r => {
      const d = new Date(r.createdAt);
      return !isNaN(d.getTime()) && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === dateFilter;
    });
  }, [requests, dateFilter]);

  const categoryData = useMemo(() => {
    const CATEGORY_MAP: Record<string, string> = {
      'hardware': 'อุปกรณ์ฮาร์ดแวร์',
      'software': 'ซอฟต์แวร์และโปรแกรม',
      'network': 'ระบบเครือข่าย',
      'account': 'บัญชีผู้ใช้งาน',
      'other': 'อื่นๆ',
      'unknown': 'ไม่ระบุ'
    };

    const counts: Record<string, number> = {};
    filteredRequests.forEach(r => {
      const cat = r.category || 'other';
      const normalizedCat = cat.toLowerCase().trim();
      const thaiCat = CATEGORY_MAP[normalizedCat] || cat;
      counts[thaiCat] = (counts[thaiCat] || 0) + 1;
    });

    let data = Object.entries(counts).map(([name, value]) => ({ name, value }));
    const { sort, order, limit } = chartConfig.proportion;

    data.sort((a, b) => {
      if (sort === 'value') {
        return order === 'asc' ? a.value - b.value : b.value - a.value;
      }
      return order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

    if (limit !== 'ALL') {
      data = data.slice(0, Number(limit));
    }

    return data;
  }, [filteredRequests, chartConfig.proportion]);

  const trendData = useMemo(() => {
    const refDate = dateFilter === "ALL" ? new Date() : new Date(dateFilter + "-01T00:00:00");
    const result: any[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const count = chartConfig.trend.months;
    for (let i = count - 1; i >= 0; i--) {
       const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
       result.push({
         month: `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
         yearMonth: `${d.getFullYear()}-${d.getMonth()}`,
         new: 0, resolved: 0, pending: 0, total: 0
       });
    }

    requests.forEach(r => {
      const d = new Date(r.createdAt);
      if (isNaN(d.getTime())) return;
      const ym = `${d.getFullYear()}-${d.getMonth()}`;
      const idx = result.findIndex(item => item.yearMonth === ym);
      if (idx !== -1) {
        result[idx].new += 1;
        result[idx].total += 1;
        if (r.status === 'RESOLVED' || r.status === 'CLOSED') result[idx].resolved += 1;
        else result[idx].pending += 1;
      }
    });
    return result.map(({ yearMonth, ...rest }) => rest);
  }, [requests, dateFilter, chartConfig.trend.months]);

  const urgencyData = useMemo(() => {
    const refDate = dateFilter === "ALL" ? new Date() : new Date(dateFilter + "-01T00:00:00");
    const result: any[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const count = chartConfig.priority.months;
    for (let i = count - 1; i >= 0; i--) {
       const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
       result.push({
         month: `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
         yearMonth: `${d.getFullYear()}-${d.getMonth()}`,
         high: 0, medium: 0, low: 0
       });
    }
    requests.forEach(r => {
      const d = new Date(r.createdAt);
      if (isNaN(d.getTime())) return;
      const ym = `${d.getFullYear()}-${d.getMonth()}`;
      const idx = result.findIndex(item => item.yearMonth === ym);
      if (idx !== -1) {
        const p = r.priority || 'LOW';
        if (p === 'HIGH') result[idx].high += 1;
        else if (p === 'MEDIUM') result[idx].medium += 1;
        else result[idx].low += 1;
      }
    });
    return result.map(({ yearMonth, ...rest }) => rest);
  }, [requests, dateFilter, chartConfig.priority.months]);

  const resolutionRateThisMonth = useMemo(() => {
    const refDate = dateFilter === "ALL" ? new Date() : new Date(dateFilter + "-01T00:00:00");
    const targetMonth = refDate.getMonth();
    const targetYear = refDate.getFullYear();
    const targetMonthRequests = dateFilter === "ALL" ? requests.filter(r => {
      const d = new Date(r.createdAt);
      return !isNaN(d.getTime()) && d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    }) : filteredRequests;
    
    const total = targetMonthRequests.length;
    const resolved = targetMonthRequests.filter(r => r.status === 'RESOLVED' || r.status === 'CLOSED').length;
    return total === 0 ? 0 : Math.round((resolved / total) * 100);
  }, [requests, filteredRequests, dateFilter]);

  const departmentMonthData = useMemo(() => {
    const deptSet = new Set<string>();
    requests.forEach(r => deptSet.add(r.employee?.department || 'ไม่ระบุ (Unknown)'));

    const refDate = dateFilter === "ALL" ? new Date() : new Date(dateFilter + "-01T00:00:00");
    const result: any[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const count = chartConfig.department.months;
    for (let i = count - 1; i >= 0; i--) {
       const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
       const obj: any = { 
         month: `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
         yearMonth: `${d.getFullYear()}-${d.getMonth()}`, 
         total: 0 
       };
       deptSet.forEach(dept => {
         if (chartConfig.department.selected.length === 0 || chartConfig.department.selected.includes(dept)) {
           obj[dept] = 0;
         }
       });
       result.push(obj);
    }

    requests.forEach(r => {
      const d = new Date(r.createdAt);
      if (isNaN(d.getTime())) return;
      const ym = `${d.getFullYear()}-${d.getMonth()}`;
      const idx = result.findIndex(item => item.yearMonth === ym);
      if (idx !== -1) {
        const dept = r.employee?.department || 'ไม่ระบุ (Unknown)';
        result[idx][dept] = (result[idx][dept] || 0) + 1;
        result[idx].total += 1;
      }
    });

    return {
      data: result.map(({ yearMonth, ...rest }) => rest),
      departments: Array.from(deptSet).filter(dept => chartConfig.department.selected.length === 0 || chartConfig.department.selected.includes(dept))
    };
  }, [requests, dateFilter, chartConfig.department]);

  const typeRequestData = useMemo(() => {
    // Standard IT Task Types in Thai
    const TASK_TYPE_MAP: Record<string, string> = {
      'repair': 'งานซ่อมแซมและแก้ไข',
      'access': 'จัดการสิทธิ์เข้าใช้งาน',
      'account': 'จัดการสิทธิ์เข้าใช้งาน',
      'purchase': 'จัดซื้ออุปกรณ์ IT',
      'software': 'งานด้านซอฟต์แวร์',
      'hardware': 'งานด้านฮาร์ดแวร์',
      'network': 'แก้ปัญหาเครือข่าย',
      'consulting': 'ให้คำปรึกษาด้าน IT',
      'other': 'งานบริการอื่นๆ',
      'None': 'ไม่ระบุประเภท',
      'unknown': 'ไม่ระบุประเภท'
    };

    // Initialize with common tasks to ensure they appear in the graph even if count is 0
    // "ใส่เข้าไปในกราฟทั้งหมด" interpretation: Show these standard categories
    const counts: Record<string, number> = {
      'งานซ่อมแซมและแก้ไข': 0,
      'จัดการสิทธิ์เข้าใช้งาน': 0,
      'จัดซื้ออุปกรณ์ IT': 0,
      'งานด้านซอฟต์แวร์': 0,
      'งานด้านฮาร์ดแวร์': 0,
      'แก้ปัญหาเครือข่าย': 0,
      'งานบริการอื่นๆ': 0
    };

    filteredRequests.forEach(r => {
      let type = r.type_request || 'unknown';
      // Normalize and map to Thai
      const normalizedType = type.toLowerCase().trim();
      const thaiType = TASK_TYPE_MAP[normalizedType] || type;
      
      counts[thaiType] = (counts[thaiType] || 0) + 1;
    });
    
    let data = Object.entries(counts).map(([name, value]) => ({ name, value }));
    const { sort, order, limit } = chartConfig.type;
    
    data.sort((a, b) => {
      if (sort === 'value') {
        if (a.value !== b.value) {
          return order === 'asc' ? a.value - b.value : b.value - a.value;
        }
      }
      return order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

    if (limit !== 'ALL') {
      data = data.slice(0, Number(limit));
    }
    
    return data;
  }, [filteredRequests, chartConfig.type]);

  const refreshData = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    requests,
    filteredRequests,
    activities,
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
    // Chart Derived Data
    categoryData,
    trendData,
    urgencyData,
    resolutionRateThisMonth,
    departmentMonthData,
    typeRequestData,
    refreshData
  };
}
