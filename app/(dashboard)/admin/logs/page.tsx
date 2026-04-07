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
  // Pagination, Filters & Sorting logic states
  const [filterModule, setFilterModule] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterModule, sortConfig, page]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterModule, sortConfig]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        filterModule,
        sortField: sortConfig.key,
        sortOrder: sortConfig.direction
      });
      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Fetch logs error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const modules = ["ALL", ...new Set(logs.map(l => l.module))];

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("FAILURE") || act.includes("DELETE") || act.includes("ERROR")) return "danger";
    if (act.includes("SUCCESS") || act.includes("APPROVE") || act.includes("OK")) return "success";
    if (act.includes("CREATE") || act.includes("UPDATE") || act.includes("CHANGE")) return "warning";
    return "secondary";
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#0F1059] tracking-tighter uppercase leading-none flex items-center gap-3">
             <div className="h-12 w-12 rounded-lg bg-[#0F1059] flex items-center justify-center text-white border border-[#0F1059]/10 shadow-sm">
                <ShieldCheck className="h-6 w-6" />
             </div>
             {t('logs.title')}
          </h1>
          <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-widest mt-2">{t('logs.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
            <Button onClick={fetchLogs} variant="outline" className="rounded-lg border-zinc-200 h-11 px-6 bg-white/50 backdrop-blur-sm font-black uppercase tracking-widest text-[10px] transition-all shadow-sm">
                <Clock className="h-4 w-4 mr-2" /> {t('logs.refresh')}
            </Button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-5 rounded-xl border-zinc-100 flex items-center gap-4 group bg-white/80 backdrop-blur-sm shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-zinc-50 flex items-center justify-center text-[#0F1059] border border-zinc-100 group-hover:bg-[#0F1059] group-hover:text-white transition-all shadow-inner">
               <Activity className="h-5 w-5" />
            </div>
            <div>
               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{t('logs.total_logs')}</p>
               <p className="text-xl font-black text-[#0F1059] leading-none">{total}</p>
            </div>
          </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-zinc-100 shadow-sm font-sans">
        <div className="flex w-full sm:w-1/2 items-center gap-3 px-4 py-2 bg-zinc-50 rounded-lg border border-zinc-100 focus-within:border-[#0F1059]/30 transition-all group">
             <Search className="h-4 w-4 text-zinc-300 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase w-full placeholder:text-zinc-300"
                placeholder={t('logs.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-lg border border-zinc-100">
               {modules.map(mod => (
                 <button
                   key={mod}
                   onClick={() => {
                     setFilterModule(mod);
                     setPage(1);
                   }}
                   className={cn(
                     "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                     filterModule === mod ? "bg-[#0F1059] text-white shadow-lg shadow-[#0F1059]/20" : "text-zinc-400 hover:text-zinc-600"
                   )}
                 >
                   {mod === 'ALL' ? t('common.all') : mod}
                 </button>
               ))}
            </div>
        </div>
      </div>

      <Card className="rounded-xl overflow-hidden bg-white/90 backdrop-blur-xl border border-zinc-100 shadow-sm">
        <Table className="w-full text-left font-sans">
          <TableHeader className="bg-zinc-50/50">
            <TableRow className="border-none">
              <TableHead 
                className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                    {t('logs.timestamp')}
                    {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead 
                className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                onClick={() => handleSort('module')}
              >
                <div className="flex items-center gap-1">
                    {t('logs.module')}
                    {sortConfig.key === 'module' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead 
                className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                onClick={() => handleSort('action')}
              >
                <div className="flex items-center gap-1">
                    {t('logs.action')}
                    {sortConfig.key === 'action' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead 
                className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                onClick={() => handleSort('userName')}
              >
                <div className="flex items-center gap-1">
                    {t('logs.user')}
                    {sortConfig.key === 'userName' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('logs.device')}</TableHead>
              <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{locale === 'th' ? 'IP' : 'IP ADDRESS'}</TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-zinc-50">
            {isLoading ? (
               Array.from({ length: 10 }).map((_, i) => (
                 <TableRow key={i}>
                   <TableCell colSpan={7} className="h-20 animate-pulse bg-zinc-50/20" />
                 </TableRow>
               ))
            ) : logs.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                        <FileText className="h-16 w-16" />
                        <p className="text-[11px] font-black uppercase tracking-[0.2em]">{t('logs.no_logs_found')}</p>
                    </div>
                 </TableCell>
               </TableRow>
            ) : logs.map((log) => (
              <TableRow key={log.id} className="hover:bg-[#0F1059]/2 transition-colors group cursor-pointer" onClick={() => setSelectedLog(log)}>
                <TableCell className="px-6 py-5 whitespace-nowrap">
                   <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-zinc-900">{new Date(log.createdAt).toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit'})}</span>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">{new Date(log.createdAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB')}</span>
                      </div>
                   </div>
                </TableCell>
                <TableCell className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                     <div className={cn(
                        "h-2.5 w-2.5 rounded-full shadow-sm",
                        log.module === "AUTH" ? "bg-amber-400" : log.module === "EQUIPMENT_BORROW" ? "bg-blue-400" : "bg-emerald-400"
                     )} />
                     <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{log.module}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-5 whitespace-nowrap">
                  <Badge variant={getActionBadge(log.action)} className="rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1 border-none drop-shadow-sm shadow-sm">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-5 whitespace-nowrap">
                   <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-sm">
                          <User className="h-4 w-4 text-[#0F1059]" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black text-zinc-800 uppercase">{log.userName || "Unknown"}</span>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">{log.userId?.slice(-10).toUpperCase() || "GUEST"}</span>
                       </div>
                   </div>
                </TableCell>
                <TableCell className="px-6 py-5 whitespace-nowrap">
                   <span className="text-[10px] font-black text-zinc-500 bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-100 uppercase tracking-tight shadow-sm">
                      {log.device || "Unknown Device"}
                   </span>
                </TableCell>
                <TableCell className="px-4 py-5 whitespace-nowrap">
                   <span className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100 shadow-sm">
                      {log.ipAddress || '-'}
                   </span>
                </TableCell>
                <TableCell className="px-6 py-5 whitespace-nowrap text-right">
                    <button className="h-10 w-10 rounded-lg flex items-center justify-center bg-white border border-zinc-100 transition-all text-zinc-300 group-hover:text-[#0F1059] group-hover:border-[#0F1059]/30 group-hover:bg-[#0F1059]/5 shadow-sm">
                       <LayoutGrid className="h-4 w-4" />
                    </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination UI */}
        <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
               {t('common.total')} {total} {t('logs.entry_count') || 'LOGS'}
            </div>
            <div className="flex items-center gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 disabled={page <= 1 || isLoading}
                 onClick={() => setPage(page - 1)}
                 className="h-8 rounded-lg border-zinc-200 text-[10px] font-black uppercase tracking-widest px-4 hover:bg-white transition-all disabled:opacity-30"
               >
                 {t('common.previous')}
               </Button>
               <div className="flex items-center gap-1.5 px-3">
                  <span className="text-[11px] font-black text-[#0F1059]">{page}</span>
                  <span className="text-[10px] font-bold text-zinc-300">/</span>
                  <span className="text-[10px] font-bold text-zinc-400">{totalPages}</span>
               </div>
               <Button
                 variant="outline"
                 size="sm"
                 disabled={page >= totalPages || isLoading}
                 onClick={() => setPage(page + 1)}
                 className="h-8 rounded-lg border-zinc-200 text-[10px] font-black uppercase tracking-widest px-4 hover:bg-white transition-all disabled:opacity-30"
               >
                 {t('common.next')}
               </Button>
            </div>
        </div>
      </Card>

      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={t('logs.details_title')}
        size="full"
      >
        {selectedLog && (
           <div className="space-y-6 font-sans">
               <div className="flex items-center justify-between p-6 rounded-xl bg-zinc-50/50 border border-zinc-100 shadow-inner">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                       <Activity className="h-3 w-3" /> {t('logs.action_module')}
                    </p>
                    <div className="flex items-center gap-3">
                        <Badge variant={getActionBadge(selectedLog.action)} className="rounded-lg px-4 py-1 font-black shadow-sm">{selectedLog.action}</Badge>
                        <span className="h-1.5 w-1.5 bg-zinc-300 rounded-full" />
                        <span className="text-[11px] font-black text-[#0F1059] uppercase tracking-[0.2em]">{selectedLog.module}</span>
                    </div>
                 </div>
                 <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('logs.timestamp')}</p>
                    <p className="text-xs font-black text-zinc-600 uppercase">{new Date(selectedLog.createdAt).toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB')}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                 <div className="p-5 rounded-xl border border-zinc-100 bg-zinc-50/30 shadow-sm">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <User className="h-3.5 w-3.5" /> {t('users.username')}
                    </p>
                    <p className="text-xs font-black text-[#0F1059] uppercase">{selectedLog.userName || "Guest Access"}</p>
                 </div>
                 <div className="p-5 rounded-xl border border-zinc-100 bg-zinc-50/30 shadow-sm">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <LayoutGrid className="h-3.5 w-3.5" /> {t('logs.device')}
                    </p>
                    <p className="text-xs font-black text-[#0F1059] uppercase">{selectedLog.device || "Unknown"}</p>
                 </div>
              </div>

              <div className="space-y-3">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" /> {t('logs.raw_json')}
                 </p>
                 <div className="p-6 rounded-lg bg-zinc-900 text-[#A5A6D9] font-mono text-[11px] overflow-x-auto border border-zinc-800 shadow-2xl ring-1 ring-white/5">
                    <pre className="whitespace-pre-wrap leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700">
                        {selectedLog.details ? JSON.stringify(JSON.parse(selectedLog.details), null, 2) : "NO ADDITIONAL DATA"}
                    </pre>
                 </div>
              </div>
              
              <div className="p-5 rounded-xl border border-zinc-100 bg-zinc-50/20 shadow-sm">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">{t('logs.user_agent')}</p>
                <p className="text-[10px] font-bold text-zinc-500 break-all leading-normal opacity-70 italic">{selectedLog.userAgent || "N/A"}</p>
              </div>

              <Button 
                onClick={() => setSelectedLog(null)}
                className="w-full h-12 rounded-lg bg-[#0F1059] hover:bg-black text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 shadow-xl shadow-[#0F1059]/20"
              >
                  {t('logs.close')}
              </Button>
           </div>
        )}
      </Modal>
    </div>
  );
}
