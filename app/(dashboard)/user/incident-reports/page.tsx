"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Plus, FileText, Eye, AlertTriangle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Drawer } from "@/components/ui/drawer";
import IncidentReportForm from "@/components/incident-reports/incident-report-form";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";

export default function UserIncidentReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  
  const monthOptions = useState(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
       const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
       const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
       const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
       options.push({ val, label });
    }
    return options;
  })[0];

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/incident-reports?limit=1000&month=${filterMonth}`);
      const data = await res.json();
      
      const items = Array.isArray(data) ? data : (data.data || []);
      // Filter only for the user
      const userItems = items.filter((item: any) => item.userId === (session?.user as any)?.id);
      
      setReports(userItems);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      toast({ title: "Error", message: "Failed to fetch reports", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchReports();
    }
  }, [session, filterMonth]);

  const handleOpenNew = () => {
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const handleSuccess = () => {
    fetchReports();
    setIsDrawerOpen(false);
  };

  const filteredReports = reports.filter((r: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.report_code?.toLowerCase().includes(s) ||
      r.location?.toLowerCase().includes(s) ||
      r.details?.toLowerCase().includes(s)
    );
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 sm:p-8 space-y-6 w-full min-h-screen bg-slate-50/30"
    >
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/30">
                <AlertTriangle className="h-6 w-6 text-white" />
             </div>
             <div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-none">My Incident Logs</h1>
                <p className="text-slate-500 font-medium text-sm mt-1">Track your submitted reports and their real-time status</p>
             </div>
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenNew}
          className="group bg-primary text-white hover:bg-primary/95 px-6 py-4 rounded-2xl font-black text-xs transition-all shadow-xl shadow-primary/25 flex items-center gap-3 uppercase tracking-widest"
        >
          <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-90 transition-transform duration-300">
             <Plus className="h-4 w-4" />
          </div>
          <span>Create Incident Report</span>
        </motion.button>
      </header>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-3 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Search by code, location, or details..." 
            className="pl-11 h-12 bg-slate-50/50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 transition-all font-medium text-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-slate-50 border-none rounded-xl px-4 py-2 text-[11px] font-black uppercase outline-none text-slate-500 focus:ring-2 focus:ring-primary/20 font-sans h-12"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          <option value="ALL">ALL MONTHS</option>
          {monthOptions.map(opt => (
            <option key={opt.val} value={opt.val}>{opt.label}</option>
          ))}
        </select>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => { 
            setSearch(""); 
            const now = new Date();
            setFilterMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
          }}
          className="h-12 px-4 rounded-xl bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
        >
           <X className="h-4 w-4" />
        </motion.button>
      </motion.div>

      <motion.div variants={itemVariants} className="w-full h-full">
        <Card className="rounded-[2.5rem] border border-slate-200/60 shadow-2xl shadow-slate-200/50 overflow-hidden hidden lg:block bg-white">
           <Table className="w-full">
              <TableHeader className="bg-slate-50 border-b border-slate-100/50">
                 <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Identification</TableHead>
                    <TableHead className="px-5 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Type</TableHead>
                    <TableHead className="px-5 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Record Date</TableHead>
                    <TableHead className="px-5 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Area / Location</TableHead>
                    <TableHead className="px-5 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Current State</TableHead>
                    <TableHead className="px-8 py-6 text-right font-black text-slate-400 uppercase tracking-[0.2em]">View</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 <AnimatePresence mode="popLayout">
                 {loading ? (
                    <TableRow>
                       <TableCell colSpan={6} className="p-32 text-center text-slate-400">
                          <Loader2 className="animate-spin mx-auto h-10 w-10 mb-4 text-primary/30" />
                          <p className="text-sm font-black uppercase tracking-[0.3em] opacity-40">Syncing database...</p>
                       </TableCell>
                    </TableRow>
                 ) : filteredReports.length === 0 ? (
                    <TableRow className="border-none">
                       <TableCell colSpan={6} className="p-0 border-none">
                          <EmptyState
                             title="No Incidents Reported"
                             description="All systems seem to be running smoothly."
                             icon={<FileText className="h-12 w-12 text-slate-100" />}
                          />
                       </TableCell>
                    </TableRow>
                 ) : (
                    filteredReports.map((r: any, idx) => (
                       <motion.tr 
                          key={r.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="group hover:bg-slate-50/50 transition-all border-b border-slate-50/50 last:border-none"
                       >
                          <TableCell className="px-8 py-6">
                             <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg w-fit tracking-widest">{r.report_code || "INC-NEW"}</span>
                                <div className="font-extrabold text-slate-900 text-[15px] group-hover:text-primary transition-colors line-clamp-1">{r.details || "No details provided"}</div>
                             </div>
                          </TableCell>
                          <TableCell className="px-5 py-6 text-center">
                             <Badge variant="outline" className="text-[9px] px-3.5 py-1.5 rounded-xl uppercase font-black bg-white border-slate-200 text-slate-500 tracking-wider shadow-sm">
                                {r.incidentType}
                             </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-6">
                             <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-700">
                                   {new Date(r.incidentTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                   {new Date(r.incidentTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </div>
                          </TableCell>
                          <TableCell className="px-5 py-6 text-center">
                             <div className="inline-flex items-center justify-center p-2.5 px-5 rounded-2xl bg-white text-slate-600 font-black text-[11px] border border-slate-100 shadow-sm group-hover:bg-slate-50 transition-all uppercase tracking-tighter">
                                {r.location}
                             </div>
                          </TableCell>
                          <TableCell className="px-5 py-6">
                             <Badge variant={
                                r.status === "RESOLVED" ? "success" :
                                r.status === "IN_PROGRESS" ? "warning" : "default"
                             } className="text-[10px] px-4 py-2 rounded-xl uppercase tracking-[0.15em] font-black shadow-lg shadow-current/10 border-none">
                                {r.status || "OPEN"}
                             </Badge>
                          </TableCell>
                          <TableCell className="px-8 py-6 text-right">
                             <Link href={`/print/incident-report/${r.id}`} target="_blank">
                                <motion.button 
                                  whileHover={{ scale: 1.1, backgroundColor: "#0F1059", color: "#fff" }}
                                  whileTap={{ scale: 0.9 }}
                                  className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 transition-all border border-slate-100 flex items-center justify-center"
                                >
                                   <Eye className="h-5 w-5" />
                                </motion.button>
                             </Link>
                          </TableCell>
                       </motion.tr>
                    ))
                 )}
                 </AnimatePresence>
              </TableBody>
           </Table>
        </Card>
      </motion.div>

      {/* Mobile view */}
      <div className="grid grid-cols-1 gap-4 lg:hidden pb-12">
         {loading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse h-48 bg-white rounded-4xl border border-slate-100 shadow-sm" />
             ))
         ) : filteredReports.length === 0 ? (
             <Card className="py-24 text-center border-dashed border-slate-200 rounded-[2.5rem] bg-white/50 shadow-none">
                <FileText className="h-10 w-10 text-slate-100 mx-auto mb-4" />
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.25em]">No Records Found</p>
             </Card>
         ) : filteredReports.map((r: any, idx) => (
            <motion.div
               key={r.id}
               initial={{ opacity: 0, scale: 0.97 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-0 border-slate-100 bg-white shadow-xl shadow-slate-100 rounded-[2.2rem] overflow-hidden">
                 <CardHeader className="flex flex-row items-start justify-between p-6 pb-4">
                    <div className="space-y-2 min-w-0 flex-1">
                       <Badge variant="secondary" className="w-fit text-[10px] font-black bg-primary/10 text-primary border-none tracking-[0.15em] uppercase px-4 py-1 rounded-full">
                          {r.report_code || "NEW"}
                       </Badge>
                       <CardTitle className="uppercase text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2 truncate">
                          {r.location}
                       </CardTitle>
                    </div>
                    <Badge variant={
                       r.status === "RESOLVED" ? "success" :
                       r.status === "IN_PROGRESS" ? "warning" : "default"
                    } className="ml-3 rounded-xl text-[9px] font-black uppercase tracking-widest px-4 py-2 shrink-0 shadow-lg shadow-current/5 border-none">
                       {r.status || "OPEN"}
                    </Badge>
                 </CardHeader>
                 <CardContent className="space-y-6 p-6 pt-0">
                    <div className="flex items-center gap-3">
                       <div className="h-0.5 w-10 bg-primary/30 rounded-full" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-0.5">
                          {r.incidentType}
                       </span>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                             <FileText className="h-5 w-5 text-slate-400" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[13px] font-black text-slate-700 leading-none">
                                {new Date(r.incidentTime).toLocaleDateString('en-GB')}
                             </span>
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1.5 leading-none">Record Date</span>
                          </div>
                       </div>
                       <Link href={`/print/incident-report/${r.id}`} target="_blank">
                          <motion.div 
                             whileTap={{ scale: 0.9 }}
                             className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/40"
                          >
                             <Eye className="h-6 w-6" />
                          </motion.div>
                       </Link>
                    </div>
                 </CardContent>
              </Card>
            </motion.div>
         ))}
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={isEditing ? "Modify Report" : "Submit Incident Report"}
        size="half"
      >
        <div className="p-1 px-4">
           <IncidentReportForm 
            onClose={() => setIsDrawerOpen(false)} 
            onSuccess={handleSuccess} 
            isUserMode={true}
           />
        </div>
      </Drawer>
    </motion.div>
  );
}
