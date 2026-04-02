"use client";

import { useState, useEffect } from "react";
import { 
  Package, 
  Ticket, 
  CheckCircle2, 
  User2, 
  ChevronRight,
  Loader2,
  Calendar,
  Search,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Filter,
  Info,
  AlertCircle,
  Hash,
  Boxes,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/ui/modal";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface RequestItem {
  id: string;
  __type: "EQUIPMENT" | "TICKETS";
  it_approval_status?: string;
  request_code?: string;  // For Tickets
  group_code?: string;    // For Equipment Batch
  createdAt?: string;
  request_date?: string;
  description?: string;
  reason?: string;
  problem_detail?: string;
  approval_status?: string;
  priority?: string;
  requests?: any[];       // For Equipment batch items
  user?: {
    username?: string;
    employee?: {
      employee_name_th?: string;
      employee_code?: string;
    };
  };
  employee?: {
    employee_name_th?: string;
    employee_code?: string;
  };
  equipmentList?: {
    equipmentEntry?: {
      list?: string;
      item_name?: string;
      brand_name?: string;
    };
  };
}

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  
  const [allRequests, setAllRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "EQUIPMENT" | "TICKETS">("ALL");
  const [deptStatusFilter, setDeptStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirmData, setConfirmData] = useState<any>({
    id: "",
    requestCode: "",
    type: "EQUIPMENT",
    isReject: false,
    comment: "",
    title: "",
    fullData: null
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eqRes, ticketRes] = await Promise.all([
        fetch("/api/equipment-requests"),
        fetch("/api/requests")
      ]);
      const eqData = await eqRes.json();
      const ticketData = await ticketRes.json();

      const typedEq = (Array.isArray(eqData) ? eqData : []).map(r => ({ ...r, __type: "EQUIPMENT" as const }));
      const typedTickets = (Array.isArray(ticketData) ? ticketData : []).map(r => ({ ...r, __type: "TICKETS" as const }));
      
      setAllRequests([...typedEq, ...typedTickets]);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openConfirm = (req: RequestItem, type: "EQUIPMENT" | "TICKETS", isReject: boolean = false) => {
    const requestCode = type === "EQUIPMENT" ? req.group_code : req.request_code;
    const title = type === "EQUIPMENT" 
      ? (locale === 'th' ? `ใบเบิกอุปกรณ์ (${req.requests?.length || 0} รายการ)` : `Equipment Batch (${req.requests?.length || 0} items)`)
      : (req.description || "Support Ticket");

    setConfirmData({
      id: req.id,
      requestCode,
      type,
      isReject,
      comment: "",
      title,
      fullData: req
    });
    setIsConfirmOpen(true);
  };

  const handleAction = async () => {
    setProcessing(true);
    const { id, type, isReject, comment } = confirmData;
    
    const status = isReject ? "REJECTED" : "APPROVED";
    const approverName = session?.user?.name || "IT Admin";
    
    const payload: any = { 
      it_approval_status: status, 
      it_approval: approverName,
      it_approval_comment: comment 
    };
    
    const endpoint = type === "EQUIPMENT" ? `/api/equipment-requests/${id}` : `/api/requests/${id}`;

    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsConfirmOpen(false);
        fetchData();
      }
    } catch (error) {
       console.error("Action error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSort = (field: string) => {
     if (sortField === field) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
     } else {
        setSortField(field);
        setSortOrder('desc');
     }
  };

  const filteredList = allRequests
    .filter(r => {
      const isITPending = r.it_approval_status === "PENDING" || !r.it_approval_status;
      const matchesType = typeFilter === "ALL" || r.__type === typeFilter;
      const matchesDept = deptStatusFilter === "ALL" || r.approval_status === deptStatusFilter;
      
      const searchLow = search.toLowerCase();
      const code = r.__type === "EQUIPMENT" ? (r.group_code || "") : (r.request_code || "");
      
      const matchesSearch = r.__type === "EQUIPMENT" 
         ? ((r.user?.username || "").toLowerCase().includes(searchLow) ||
            (r.user?.employee?.employee_name_th || "").toLowerCase().includes(searchLow) ||
            (r.reason || "").toLowerCase().includes(searchLow) ||
            (code.toLowerCase().includes(searchLow)) ||
            (r.requests?.some(item => (item.equipmentList?.equipmentEntry?.list || "").toLowerCase().includes(searchLow))))
         : ((r.description || "").toLowerCase().includes(searchLow) || 
            (r.employee?.employee_name_th || "").toLowerCase().includes(searchLow) ||
            (code.toLowerCase().includes(searchLow)));
      
      return isITPending && matchesType && matchesSearch && matchesDept;
    })
    .sort((a, b) => {
       let valA, valB;
       if (sortField === 'createdAt') {
          valA = new Date(a.createdAt || a.request_date!).getTime();
          valB = new Date(b.createdAt || b.request_date!).getTime();
       } else if (sortField === 'requestor') {
          valA = a.__type === "EQUIPMENT" ? (a.user?.employee?.employee_name_th || "") : (a.employee?.employee_name_th || "");
          valB = b.__type === "EQUIPMENT" ? (b.user?.employee?.employee_name_th || "") : (b.employee?.employee_name_th || "");
       } else if (sortField === 'type') {
          valA = a.__type;
          valB = b.__type;
       } else {
          valA = a.__type === "EQUIPMENT" ? (a.group_code || "") : (a.request_code || "");
          valB = b.__type === "EQUIPMENT" ? (b.group_code || "") : (b.request_code || "");
       }
       if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
       if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
       return 0;
    });

  const stats = {
    totalPending: allRequests.filter(r => r.it_approval_status === "PENDING" || !r.it_approval_status).length,
    eqPending: allRequests.filter(r => r.__type === "EQUIPMENT" && (r.it_approval_status === "PENDING" || !r.it_approval_status)).length,
    ticketPending: allRequests.filter(r => r.__type === "TICKETS" && (r.it_approval_status === "PENDING" || !r.it_approval_status)).length
  };

  const SortIcon = ({ field }: { field: string }) => {
     if (sortField !== field) return null;
     return sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1 text-primary" /> : <ChevronDown className="h-3 w-3 inline ml-1 text-primary" />;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-primary flex items-center gap-2 uppercase tracking-tight">
            <CheckCircle className="h-5 w-5" />
            {t('approvals.title')}
          </h1>
          <p className="text-[11px] font-black text-accent uppercase tracking-widest leading-none">{t('approvals.subtitle')}</p>
        </div>

        <div className="flex bg-secondary/50 p-1 rounded-xl border border-border w-fit">
           {[
             { id: "ALL", label: locale === 'th' ? 'ทั้งหมด' : 'ALL', icon: LayoutGrid, count: stats.totalPending },
             { id: "EQUIPMENT", label: t('approvals.equipment_tab'), icon: Package, count: stats.eqPending },
             { id: "TICKETS", label: t('approvals.tickets_tab'), icon: Ticket, count: stats.ticketPending }
           ].map((item) => (
             <button 
               key={item.id}
               onClick={() => setTypeFilter(item.id as any)}
               className={cn(
                 "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                 typeFilter === item.id ? "bg-surface text-primary shadow-sm" : "text-accent hover:text-foreground"
               )}
             >
               <item.icon className="h-3.5 w-3.5" /> 
               {item.label} <span className="opacity-40 ml-0.5 whitespace-nowrap">({item.count})</span>
             </button>
           ))}
        </div>
      </header>

      <div className="bg-surface p-4 rounded-xl border border-border shadow-none space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-6 relative w-full font-sans">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
               <input 
                  type="text" 
                  placeholder={t('approvals.search_placeholder')}
                  className="w-full bg-secondary/30 border border-border rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-black uppercase focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all text-foreground placeholder:text-accent/50 h-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
               />
            </div>
            
            <div className="md:col-span-6 flex flex-wrap items-center gap-2 justify-end">
               <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-lg border border-border h-10 min-w-[140px]">
                  <Filter className="h-3.5 w-3.5 text-accent" />
                  <select 
                     className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-primary w-full cursor-pointer"
                     value={deptStatusFilter}
                     onChange={(e) => setDeptStatusFilter(e.target.value)}
                  >
                     <option value="ALL">{locale === 'th' ? 'สถานะแผนก' : 'DEPT STATUS'}</option>
                     <option value="PENDING">{locale === 'th' ? 'รออนุมัติ' : 'PENDING'}</option>
                     <option value="APPROVED">{locale === 'th' ? 'อนุมัติแล้ว' : 'APPROVED'}</option>
                     <option value="REJECTED">{locale === 'th' ? 'ปฏิเสธ' : 'REJECTED'}</option>
                  </select>
               </div>

               <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort('createdAt')}
                  className={cn(
                     "text-[10px] font-black uppercase tracking-widest h-10 rounded-lg gap-2 bg-secondary/10 px-4",
                     sortField === 'createdAt' ? "border-primary text-primary" : "border-border text-accent"
                  )}
               >
                  <Calendar className="h-4 w-4" />
                  {locale === 'th' ? 'วันที่' : 'DATE'} <SortIcon field="createdAt" />
               </Button>
               
               <div className="text-[10px] font-black text-accent uppercase tracking-widest bg-secondary/10 px-4 py-2.5 rounded-lg border border-border whitespace-nowrap h-10 flex items-center">
                  {t('common.total')} {filteredList.length}
               </div>
            </div>
         </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
             {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-secondary/20 rounded-xl border border-border" />
             ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-20 text-center bg-surface rounded-xl border border-dashed border-border group overflow-hidden">
             <div className="h-20 w-20 bg-secondary/50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-accent group-hover:scale-110 transition-transform duration-500">
                <CheckCircle2 className="h-10 w-10 opacity-30" />
             </div>
             <h3 className="text-xl font-black text-primary uppercase tracking-tight">{t('approvals.no_pending')}</h3>
             <p className="text-[10px] font-black text-accent mt-2 uppercase tracking-[0.2em]">{t('approvals.pending_cleared')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="rounded-xl border border-border shadow-none overflow-hidden hidden lg:block bg-surface">
               <Table className="w-full">
                  <TableHeader className="bg-secondary/30">
                     <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead 
                           className="py-3 px-4 text-[10px] font-black text-accent uppercase tracking-widest cursor-pointer hover:text-primary transition-colors flex items-center"
                           onClick={() => handleSort('type')}
                        >
                           {t('common.type')} <SortIcon field="type" />
                        </TableHead>
                        <TableHead className="py-3 px-4 text-[10px] font-black text-accent uppercase tracking-widest">{t('requests.problem_desc')}</TableHead>
                        <TableHead 
                           className="py-3 px-4 text-[10px] font-black text-accent uppercase tracking-widest cursor-pointer hover:text-primary transition-colors"
                           onClick={() => handleSort('requestor')}
                        >
                           {locale === 'th' ? 'ผู้ขอ' : 'REQUESTOR'} <SortIcon field="requestor" />
                        </TableHead>
                        <TableHead 
                           className="py-3 px-4 text-[10px] font-black text-accent uppercase tracking-widest text-center cursor-pointer hover:text-primary transition-colors"
                           onClick={() => handleSort('createdAt')}
                        >
                           {t('common.date')} <SortIcon field="createdAt" />
                        </TableHead>
                        <TableHead className="py-3 px-4 text-[10px] font-black text-accent uppercase tracking-widest text-center">{t('requests.approval_status')}</TableHead>
                        <TableHead className="py-3 px-4 text-right"></TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/50">
                     {filteredList.map((r) => {
                        const requestCode = r.__type === "EQUIPMENT" ? r.group_code : r.request_code;
                        return (
                        <TableRow key={r.id} className="hover:bg-secondary/10 transition-colors group">
                           <TableCell className="py-3 px-4">
                              <Badge variant={r.__type === "EQUIPMENT" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5 font-black uppercase tracking-widest rounded border-none shadow-none">
                                 {r.__type === "EQUIPMENT" ? t('approvals.equipment_type') : t('approvals.ticket_type')}
                              </Badge>
                           </TableCell>
                           <TableCell className="py-3 px-4">
                              <div className="flex flex-col min-w-0">
                                 <div className="flex items-center gap-1.5 mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <Hash className="h-2.5 w-2.5 text-primary" />
                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{requestCode}</span>
                                 </div>
                                 <p className="text-[13px] font-black text-primary uppercase line-clamp-1 truncate max-w-[320px]">
                                    {r.__type === "EQUIPMENT" 
                                       ? (locale === 'th' ? `ใบเบิกวัสดุ (${r.requests?.length || 0} รายการ)` : `Batch Equipment Request (${r.requests?.length || 0} items)`) 
                                       : (r.description || 'SUPPORT TICKET')}
                                 </p>
                              </div>
                           </TableCell>
                           <TableCell className="py-3 px-4">
                              <p className="text-[13px] font-bold text-foreground/80 uppercase truncate">
                                 {r.__type === "EQUIPMENT" 
                                    ? (r.user?.employee?.employee_name_th || r.user?.username || 'GUEST') 
                                    : (r.employee?.employee_name_th || 'GUEST')}
                              </p>
                           </TableCell>
                           <TableCell className="py-3 px-4 text-center">
                              <div className="flex flex-col items-center">
                                 <span className="text-[13px] font-bold text-foreground/70">{new Date(r.createdAt || r.request_date!).toLocaleDateString('en-GB')}</span>
                                 <span className="text-[9px] font-black text-accent uppercase tracking-widest mt-0.5">{new Date(r.createdAt || r.request_date!).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                           </TableCell>
                           <TableCell className="py-3 px-4 text-center">
                              <Badge variant={r.approval_status === "APPROVED" ? "success" : r.approval_status === "REJECTED" ? "danger" : "warning"} className="text-[10px] font-black uppercase tracking-widest rounded-lg px-2.5 py-0.5 border-none shadow-none">
                                 {r.approval_status || "PENDING"}
                              </Badge>
                           </TableCell>
                           <TableCell className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <Button 
                                    size="sm"
                                    onClick={() => openConfirm(r, r.__type)}
                                    className="bg-primary hover:bg-primary-hover text-white h-8 px-4 rounded-lg font-black uppercase tracking-widest text-[9px] shadow-sm transition-all active:scale-95 whitespace-nowrap"
                                 >
                                    {t('approvals.check_and_approve')}
                                 </Button>
                                 <Button 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0 rounded-lg bg-secondary/50 text-accent hover:bg-primary hover:text-white transition-all shadow-sm"
                                     onClick={() => openConfirm(r, r.__type)}
                                 >
                                    <ChevronRight className="h-4 w-4" />
                                 </Button>
                              </div>
                           </TableCell>
                        </TableRow>
                        );
                     })}
                  </TableBody>
               </Table>
            </Card>

            <div className="grid grid-cols-1 gap-3 lg:hidden pb-10">
              {filteredList.map((r) => {
                const requestCode = r.__type === "EQUIPMENT" ? r.group_code : r.request_code;
                return (
                <Card key={r.id} onClick={() => openConfirm(r, r.__type)} className="p-4 rounded-xl border border-border bg-surface shadow-sm active:scale-[0.98] transition-all group overflow-hidden">
                   <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                         <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 tracking-widest uppercase truncate max-w-[120px] italic">#{requestCode}</span>
                               <Badge variant={r.__type === "EQUIPMENT" ? "default" : "secondary"} className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-none">
                                 {r.__type === "EQUIPMENT" ? t('approvals.equipment_type') : t('approvals.ticket_type')}
                               </Badge>
                            </div>
                            <h3 className="text-[14px] font-black text-primary uppercase tracking-tight leading-tight line-clamp-2">
                              {r.__type === "EQUIPMENT" 
                                 ? (locale === 'th' ? `ใบเบิกวัสดุ (${r.requests?.length || 0} รายการ)` : `Batch Borrow (${r.requests?.length || 0} items)`) 
                                 : (r.description || 'SUPPORT TICKET')}
                            </h3>
                         </div>
                         <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-accent shrink-0">
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                           <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-accent">
                               <User2 className="h-4 w-4 opacity-50" />
                            </div>
                            <p className="text-[11px] font-bold text-foreground/70 uppercase">
                               {r.__type === "EQUIPMENT" 
                                  ? (r.user?.employee?.employee_name_th || r.user?.username || 'GUEST') 
                                  : (r.employee?.employee_name_th || 'GUEST')}
                            </p>
                        </div>
                        <Badge variant={r.approval_status === "APPROVED" ? "success" : r.approval_status === "REJECTED" ? "danger" : "warning"} className="text-[10px] font-black uppercase tracking-widest rounded-lg px-2 py-0.5 border-none shadow-none">
                          {r.approval_status || "PENDING"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-bold text-accent uppercase tracking-tighter">
                         <div className="flex items-center gap-1.5 leading-none">
                            <Calendar className="h-3 w-3" />
                            {new Date(r.createdAt || r.request_date!).toLocaleDateString('en-GB')}
                         </div>
                         <div className="bg-secondary/50 px-2 py-1 rounded border border-border">
                            {new Date(r.createdAt || r.request_date!).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                         </div>
                      </div>
                   </div>
                </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        title={confirmData.isReject ? t('approvals.reject_modal_title') : t('approvals.it_approve_modal_title')}
        size="lg"
      >
        <div className="space-y-6 pt-2 font-sans">
          {/* Enhanced Request Details */}
          <div className="space-y-4">
             {/* Header Section */}
             <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-4 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-2 opacity-[0.03] scale-[2]">
                   {confirmData.type === "EQUIPMENT" ? <Package className="h-20 w-20" /> : <Ticket className="h-20 w-20" />}
                </div>
                
                <div className="flex items-start justify-between">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-1">{locale === 'th' ? 'รหัสรายการ' : 'REQUEST ID'}</p>
                      <p className="text-sm font-black text-primary uppercase tracking-tight">#{confirmData.requestCode}</p>
                   </div>
                   <Badge variant={confirmData.type === "EQUIPMENT" ? "default" : "secondary"} className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-none rounded">
                      {confirmData.type === "EQUIPMENT" ? t('approvals.equipment_type') : t('approvals.ticket_type')}
                   </Badge>
                </div>

                <div className="space-y-1">
                   <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-2">{locale === 'th' ? 'สรุปรายการ' : 'SUMMARY'}</p>
                   <div className="p-3 rounded-lg bg-surface border border-border shadow-sm">
                      <p className="text-[14px] font-black text-primary uppercase leading-snug">{confirmData.title}</p>
                   </div>
                </div>

                {/* Specific Equipment List for Equipment Requests */}
                {confirmData.type === "EQUIPMENT" && confirmData.fullData?.requests && (
                   <div className="space-y-2">
                       <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-2 flex items-center gap-2">
                          <Boxes className="h-3.5 w-3.5" />
                          {locale === 'th' ? 'รายการอุปกรณ์ที่เบิก' : 'ITEMIZED LIST'}
                       </p>
                       <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                          {confirmData.fullData.requests.map((item: any) => (
                             <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-border group hover:bg-surface transition-colors shadow-sm">
                                <div className="min-w-0 flex-1 pr-4">
                                   <p className="text-[12px] font-black text-primary uppercase truncate">
                                      {item.equipmentList?.equipmentEntry?.list || item.manual_item_name || 'N/A'}
                                   </p>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[9px] font-bold text-accent uppercase">{item.equipmentList?.equipmentEntry?.brand_name || item.manual_item_type || '-'}</span>
                                      <Badge variant="outline" className="text-[8px] h-3 px-1.5 opacity-60 border-primary/20 text-primary uppercase font-bold tracking-tighter">
                                         {item.borrow_type}
                                      </Badge>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <span className="text-[12px] font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
                                      x{item.quantity}
                                   </span>
                                </div>
                             </div>
                          ))}
                       </div>
                   </div>
                )}

                {/* Ticket Details for Tickets */}
                {confirmData.type === "TICKETS" && (
                   <div className="space-y-2">
                       <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-2">{locale === 'th' ? 'รายละเอียดงาน' : 'TICKET DETAILS'}</p>
                       <p className="text-[13px] font-medium text-foreground/80 leading-relaxed italic border-l-2 border-primary/20 pl-3">
                          {confirmData.fullData?.description}
                       </p>
                   </div>
                )}

                {confirmData.fullData?.reason && (
                  <div className="space-y-1 pt-1">
                     <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-2">{locale === 'th' ? 'เหตุผลความจำเป็น' : 'PURPOSE / REASON'}</p>
                     <p className="text-[13px] font-medium text-foreground/80 leading-relaxed italic border-l-2 border-primary/20 pl-3">
                        {confirmData.fullData.reason}
                     </p>
                  </div>
                )}
             </div>

             {/* Metadata Grid */}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-border bg-surface shadow-sm space-y-2">
                   <div className="flex items-center gap-1.5 text-accent">
                      <User2 className="h-3.5 w-3.5" />
                      <p className="text-[10px] font-black uppercase tracking-widest leading-none">{locale === 'th' ? 'ผู้ส่งคำร้อง' : 'REQUESTOR'}</p>
                   </div>
                   <p className="text-[12px] font-bold text-primary uppercase truncate leading-none">
                      {confirmData.type === "EQUIPMENT" 
                         ? (confirmData.fullData?.user?.employee?.employee_name_th || confirmData.fullData?.user?.username || 'GUEST') 
                         : (confirmData.fullData?.employee?.employee_name_th || 'GUEST')}
                   </p>
                </div>
                
                <div className="p-3 rounded-xl border border-border bg-surface shadow-sm space-y-2 text-center">
                   <div className="flex items-center justify-center gap-1.5 text-accent">
                      <Calendar className="h-3.5 w-3.5" />
                      <p className="text-[10px] font-black uppercase tracking-widest leading-none">{t('common.date')}</p>
                   </div>
                   <p className="text-[12px] font-bold text-primary uppercase leading-none">
                      {confirmData.fullData ? new Date(confirmData.fullData.createdAt || confirmData.fullData.request_date!).toLocaleDateString('en-GB') : '-'}
                   </p>
                </div>

                <div className="p-3 rounded-xl border border-border bg-surface shadow-sm space-y-2 text-right">
                   <div className="flex items-center justify-end gap-1.5 text-accent">
                      {confirmData.fullData?.priority === "URGENT" ? <AlertCircle className="h-3.5 w-3.5 text-danger" /> : <Info className="h-3.5 w-3.5" />}
                      <p className="text-[10px] font-black uppercase tracking-widest leading-none">{locale === 'th' ? 'ลำดับความสำคัญ' : 'PRIORITY'}</p>
                   </div>
                   <Badge 
                      variant={
                        confirmData.fullData?.priority === "URGENT" ? "danger" : 
                        confirmData.fullData?.priority === "HIGH" ? "warning" : "secondary"
                      } 
                      className="text-[10px] h-4 font-black uppercase tracking-widest border-none px-2"
                   >
                      {confirmData.fullData?.priority || (confirmData.type === "EQUIPMENT" ? "STANDARD" : "NORMAL")}
                   </Badge>
                </div>
             </div>
          </div>

          {/* IT Comment Input */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-accent uppercase tracking-widest px-1 leading-none flex items-center gap-2">
               <MessageSquareIcon className="h-3.5 w-3.5" />
               {t('approvals.it_comment')}
            </label>
            <textarea 
              className="w-full bg-surface border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-[13px] font-medium min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/5 transition-all shadow-inner placeholder:text-accent/30"
              placeholder={t('approvals.it_comment_placeholder')}
              value={confirmData.comment}
              onChange={(e) => setConfirmData({...confirmData, comment: e.target.value})}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-border">
            {!confirmData.isReject && (
              <Button 
                 variant="ghost" 
                 onClick={() => setConfirmData({...confirmData, isReject: true})}
                 className="w-full sm:flex-1 text-danger hover:bg-danger/5 text-[11px] font-black uppercase tracking-widest rounded-xl h-12"
              >
                 {t('approvals.switch_to_reject')}
              </Button>
            )}
            <Button 
               disabled={processing}
               onClick={handleAction}
               className={cn(
                  "w-full sm:flex-1 text-white text-[11px] font-black uppercase tracking-widest h-12 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2",
                  confirmData.isReject ? "bg-danger hover:bg-danger/90 shadow-danger/20" : "bg-primary hover:bg-primary-hover shadow-primary/20"
               )}
            >
               {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : (confirmData.isReject ? t('approvals.confirm_reject') : t('approvals.confirm_it_approve'))}
               {!processing && (confirmData.isReject ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Support Icons
function MessageSquareIcon(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function X(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

function Check(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
