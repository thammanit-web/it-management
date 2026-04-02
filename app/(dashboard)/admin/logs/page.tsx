"use client";

import { useState, useEffect } from "react";
import { Search, ShieldCheck, Activity, User, Clock, FileText, LayoutGrid, ChevronUp, ChevronDown } from "lucide-react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface AuditLog {
  id: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  module: string;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  device?: string | null;
  createdAt: string;
}

export default function AuditLogsPage() {
  const { t, locale } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterModule, setFilterModule] = useState<string>("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof AuditLog; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } catch (error) {
      console.error("Fetch logs error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: keyof AuditLog) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredLogs = logs
    .filter(log => {
      const searchLow = search.toLowerCase();
      const actionMatch = log.action.toLowerCase().includes(searchLow);
      const nameMatch = log.userName?.toLowerCase().includes(searchLow);
      const moduleMatch = log.module.toLowerCase().includes(searchLow);
      const detailMatch = log.details?.toLowerCase().includes(searchLow);
      const deviceMatch = log.device?.toLowerCase().includes(searchLow);
      
      const matchesSearch = actionMatch || moduleMatch || nameMatch || detailMatch || deviceMatch;
      const matchesModule = filterModule === "ALL" || log.module === filterModule;
      
      return matchesSearch && matchesModule;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (!aValue || !bValue) return 0;
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const modules = ["ALL", ...new Set(logs.map(l => l.module))];

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("FAILURE") || act.includes("DELETE") || act.includes("ERROR")) return "danger";
    if (act.includes("SUCCESS") || act.includes("APPROVE") || act.includes("OK")) return "success";
    if (act.includes("CREATE") || act.includes("UPDATE") || act.includes("CHANGE")) return "warning";
    return "secondary";
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-none flex items-center gap-3">
             <div className="h-10 w-10 rounded-lg bg-[#0F1059] flex items-center justify-center text-white border border-slate-200 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
             </div>
             {t('logs.title')}
          </h1>
          <p className="text-[12px] font-medium text-slate-500 uppercase tracking-widest mt-1">{t('logs.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
            <Button onClick={fetchLogs} variant="outline" className="rounded-lg border-slate-200 h-10 px-4 bg-white font-bold uppercase tracking-widest text-[11px] transition-all">
                <Clock className="h-4 w-4 mr-2" /> {t('logs.refresh')}
            </Button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="p-4 rounded-xl border border-slate-200 flex items-center gap-3 bg-white shadow-sm transition-all group">
            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-[#0F1059] border border-slate-200 group-hover:bg-[#0F1059] group-hover:text-white transition-all">
               <Activity className="h-5 w-5" />
            </div>
            <div>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">{t('logs.total_logs')}</p>
               <p className="text-lg font-black text-[#0F1059] leading-none">{logs.length}</p>
            </div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm font-sans">
        <div className="flex w-full md:w-1/2 items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 focus-within:border-[#0F1059]/30 transition-all group">
             <Search className="h-4 w-4 text-slate-300 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-sm font-bold uppercase w-full placeholder:text-slate-300"
                placeholder={t('logs.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide py-1">
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
               {modules.map(mod => (
                 <button
                   key={mod}
                   onClick={() => setFilterModule(mod)}
                   className={cn(
                     "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                     filterModule === mod ? "bg-[#0F1059] text-white shadow-md shadow-[#0F1059]/20" : "text-slate-400 hover:text-slate-600"
                   )}
                 >
                   {mod === 'ALL' ? t('common.all') : mod}
                 </button>
               ))}
            </div>
        </div>
      </div>

      <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full text-left">
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead 
                  className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                      {t('logs.timestamp')}
                      {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                  className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('module')}
                >
                  <div className="flex items-center gap-1">
                      {t('logs.module')}
                      {sortConfig.key === 'module' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                  className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('action')}
                >
                  <div className="flex items-center gap-1">
                      {t('logs.action')}
                      {sortConfig.key === 'action' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                  className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center gap-1">
                      {t('logs.user')}
                      {sortConfig.key === 'userName' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('logs.device')}</TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                 Array.from({ length: 10 }).map((_, i) => (
                   <TableRow key={i}>
                     <TableCell colSpan={6} className="py-8 animate-pulse bg-slate-50/50" />
                   </TableRow>
                 ))
              ) : filteredLogs.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                          <FileText className="h-12 w-12" />
                          <p className="text-[11px] font-bold uppercase tracking-widest">{t('logs.no_logs_found')}</p>
                      </div>
                   </TableCell>
                 </TableRow>
              ) : filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedLog(log)}>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-900 leading-none mb-1">{new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit'})}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(log.createdAt).toLocaleDateString('en-GB')}</span>
                     </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{log.module}</span>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <Badge variant="outline" 
                      className={cn("rounded text-[9px] font-bold uppercase tracking-wider px-2 py-0 border-none",
                         getActionBadge(log.action) === 'success' ? 'bg-emerald-50 text-emerald-600' :
                         getActionBadge(log.action) === 'danger' ? 'bg-rose-50 text-rose-600' :
                         getActionBadge(log.action) === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-800 uppercase leading-none mb-1">{log.userName || "Unknown"}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono truncate max-w-[80px]">{log.userId?.slice(-10).toUpperCase() || "GUEST"}</span>
                     </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[120px]">
                        {log.device || "Unknown Device"}
                     </span>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap text-right">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#0F1059] shadow-sm">
                         <LayoutGrid className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile View: Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-xl" />
          ))
        ) : filteredLogs.length === 0 ? (
          <div className="py-10 text-center text-slate-400 italic uppercase font-bold tracking-widest">{t('logs.no_logs_found')}</div>
        ) : filteredLogs.map((log) => (
          <Card key={log.id} 
            className="p-4 shadow-sm rounded-xl border border-slate-200 bg-white space-y-3 active:scale-95 transition-transform"
            onClick={() => setSelectedLog(log)}
          >
            <div className="flex justify-between items-start">
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.module}</span>
                     <Badge variant="outline" className={cn("text-[8px] font-bold uppercase py-0 border-none",
                        getActionBadge(log.action) === 'success' ? 'bg-emerald-50 text-emerald-600' :
                        getActionBadge(log.action) === 'danger' ? 'bg-rose-50 text-rose-600' :
                        getActionBadge(log.action) === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                     )}>
                        {log.action}
                     </Badge>
                  </div>
                  <h3 className="text-[13px] font-bold text-slate-900 uppercase">{log.userName || "Unknown"}</h3>
               </div>
               <p className="text-[9px] font-bold text-slate-400">{new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit'})}</p>
            </div>
          </Card>
        ))}
      </div>

      <Drawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={t('logs.details_title')}
        size="lg"
      >
        {selectedLog && (
           <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                 <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                       <Activity className="h-3 w-3" /> {t('logs.action_module')}
                    </p>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("rounded px-2 py-0 font-bold text-[10px] uppercase border-none",
                           getActionBadge(selectedLog.action) === 'success' ? 'bg-emerald-50 text-emerald-600' :
                           getActionBadge(selectedLog.action) === 'danger' ? 'bg-rose-50 text-rose-600' :
                           getActionBadge(selectedLog.action) === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-slate-200 text-slate-600'
                        )}>{selectedLog.action}</Badge>
                        <span className="text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{selectedLog.module}</span>
                    </div>
                 </div>
                 <div className="text-right space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('logs.timestamp')}</p>
                    <p className="text-[11px] font-bold text-slate-600">{new Date(selectedLog.createdAt).toLocaleString('en-GB')}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                       <User className="h-3 w-3" /> {t('users.username')}
                    </p>
                    <p className="text-sm font-bold text-slate-900 uppercase truncate">{selectedLog.userName || "Guest Access"}</p>
                 </div>
                 <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                       <LayoutGrid className="h-3 w-3" /> {t('logs.device')}
                    </p>
                    <p className="text-sm font-bold text-slate-900 uppercase truncate">{selectedLog.device || "Unknown"}</p>
                 </div>
              </div>

              <div className="space-y-2">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <FileText className="h-3.5 w-3.5" /> {t('logs.raw_json')}
                 </p>
                 <div className="p-4 rounded-xl bg-slate-900 text-[#A5A6D9] font-mono text-[10px] overflow-x-auto border border-slate-800 shadow-lg">
                    <pre className="whitespace-pre-wrap leading-relaxed">
                        {selectedLog.details ? JSON.stringify(JSON.parse(selectedLog.details), null, 2) : "NO ADDITIONAL DATA"}
                    </pre>
                 </div>
              </div>
              
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('logs.user_agent')}</p>
                <p className="text-[10px] font-medium text-slate-500 break-all leading-relaxed">{selectedLog.userAgent || "N/A"}</p>
              </div>

              <div className="pt-4 mt-auto">
                <Button 
                    onClick={() => setSelectedLog(null)}
                    className="w-full h-12 rounded-xl bg-[#0F1059] hover:bg-black text-white font-bold uppercase tracking-widest text-[11px] transition-all"
                >
                    {t('logs.close')}
                </Button>
              </div>
           </div>
        )}
      </Drawer>
    </div>
  );
}
