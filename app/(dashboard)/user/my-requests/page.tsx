"use client";
import { useSearchParams } from "next/navigation";

import React, { useState, useEffect, Suspense } from "react";
import { Search, Loader2, Ticket,  Clock, Plus, ClipboardCheck, Link as LinkIcon, Check, FileDown, Eye, X, ImagePlus } from "lucide-react";
import {
   Table,
   TableHeader,
   TableBody,
   TableHead,
   TableRow,
   TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {  TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AICategorizeSuggest, AICategorizeSuggestHandle } from "@/components/ai/AICategorizeSuggest";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { ITRequestPDF } from "@/lib/pdf/ITRequestPDF";
import { EmployeeSearchSelect, Employee } from "@/components/employee-search-select";
import { PDFViewer } from "@react-pdf/renderer";

interface UserRequest {
   id: string;
   userId: string;
   request_code: string;
   description: string;
   category: string;
   priority: string;
   status: string;
   reason: string;
   type_request?: string;
   attachment?: string;
   createdAt: string;
   updatedAt: string;
   approval: string;
   approval_status: string;
   approval_comment?: string;
   approval_date?: string;
   it_approval?: string;
   it_approval_status?: string;
   it_approval_comment?: string;
   it_approval_date?: string;
   employee?: {
      employee_name_th: string;
      employee_code: string;
      department: string;
      position: string;
      supervisor_name?: string;
   };
   user?: { username: string; role?: string };
}

function RequestsContent() {
   const { data: session } = useSession();
   const { t, locale } = useTranslation();
   const searchParams = useSearchParams();
   const action = searchParams.get('action');
   const itemName = searchParams.get('item');

   const [requests, setRequests] = useState<UserRequest[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [viewRequest, setViewRequest] = useState<UserRequest | null>(null);
   const [employees, setEmployees] = useState<Employee[]>([]);
   const [showSuccess, setShowSuccess] = useState<{ id: string, approvalNeeded: boolean } | null>(null);
   const [isCopied, setIsCopied] = useState(false);
   const [isExportingPDF] = useState(false);
   const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
   const [filterType, setFilterType] = useState<'ME' | 'ALL'>('ME');
   const [formError, setFormError] = useState<string | null>(null);
   const [filterMonth, setFilterMonth] = useState(() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
   });

   // Cancellation States
   const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
   const [cancelId, setCancelId] = useState<string | null>(null);
   const [isCancelling, setIsCancelling] = useState(false);
   const [isUploading, setIsUploading] = useState(false);
   const monthOptions = React.useMemo(() => {
      const options = [];
      const now = new Date();
      for (let i = 0; i < 12; i++) {
         const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
         const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
         const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
         options.push({ val, label });
      }
      return options;
   }, []);

   const aiRef = React.useRef<AICategorizeSuggestHandle>(null);

   // Form State
   const [formData, setFormData] = useState({
      description: "",
      reason: "",
      category: "GENERAL",
      priority: "LOW",
      type_request: "REPAIR",
      type_request_other: "",
      employeeId: (session?.user as any)?.employeeId || "",
      approval: "",
      attachment: ""
   });
   const [inventory, setInventory] = useState<any[]>([]);
   const [invSearch, setInvSearch] = useState("");

   useEffect(() => {
      if (session) {
         fetchMyRequests();
         fetchEmployees();
         fetchInventory();
         setFormData(prev => ({ ...prev, employeeId: (session.user as any).employeeId }));

         if (action === 'purchase') {
            setIsModalOpen(true);
            setFormData(prev => ({
               ...prev,
               type_request: 'PURCHASE',
               description: itemName || ""
            }));
         }

         if (action === 'new') {
            setIsModalOpen(true);
         }
      }
   }, [session, action, itemName, filterMonth]);

   const fetchInventory = async () => {
      try {
         const res = await fetch("/api/equipment-lists?limit=1000");
         const result = await res.json();
         if (Array.isArray(result)) {
            setInventory(result);
         } else if (result && Array.isArray(result.data)) {
            setInventory(result.data);
         }
      } catch (error) {
         console.error("Fetch inventory error:", error);
      }
   };

   const fetchEmployees = async () => {
      try {
         const res = await fetch("/api/employees?limit=1000");
         const result = await res.json();
         if (Array.isArray(result)) {
            setEmployees(result);
         } else if (result && Array.isArray(result.data)) {
            setEmployees(result.data);
         }
      } catch (error) {
         console.error("Fetch employees error:", error);
      }
   };

   const fetchMyRequests = async () => {
      setIsLoading(true);
      try {
         const params = new URLSearchParams({
            limit: '1000',
            month: filterMonth
         });
         const res = await fetch(`/api/requests?${params.toString()}`);
         const data = await res.json();
         // Handle both direct array (old) and paginated object (new)
         if (Array.isArray(data)) {
            setRequests(data);
         } else if (data && Array.isArray(data.data)) {
            setRequests(data.data);
         }
      } catch (error) {
         console.error("Fetch error:", error);
      } finally {
         setIsLoading(false);
      }
   };

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
         const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&folder=requests`, {
            method: "POST",
            body: file,
         });
         const data = await res.json();
         if (data.url) {
            setFormData(prev => ({ ...prev, attachment: data.url }));
         }
      } catch (error) {
         console.error("Upload error:", error);
      } finally {
         setIsUploading(false);
      }
   };

   const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isStandard && !formData.approval) {
         setFormError(locale === 'th' ? "กรุณาระบุผู้อนุมัติ (หัวหน้างาน/ผู้จัดการแผนก)" : "Please specify an approver (Manager).");
         return;
      }
      setFormError(null);
      setIsSaving(true);
      
      let finalCategory = formData.category;
      let finalPriority = formData.priority;
      let aiReasoning = undefined;

      try {
         // Run AI Classification at create time
         const aiResult = await aiRef.current?.runClassify();
         if (aiResult) {
            finalCategory = aiResult.category;
            finalPriority = aiResult.priority;
            if (aiResult.reasoning) aiReasoning = aiResult.reasoning;
         }

         const res = await fetch("/api/requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               ...formData,
               category: finalCategory,
               priority: finalPriority,
               ai_reasoning: aiReasoning,
               approval_status: isStandard ? "APPROVED" : "PENDING",
               type_request: formData.type_request === "OTHER" ? formData.type_request_other : formData.type_request
            })
         });

          if (res.ok) {
             const data = await res.json();
             setIsModalOpen(false);
             setFormData({ ...formData, description: "", reason: "", approval: "", type_request: "REPAIR", type_request_other: "", attachment: "" });
             fetchMyRequests();
            setShowSuccess({ id: data.id, approvalNeeded: !!(formData.approval && !isStandard) });
         }
      } catch (error) {
         console.error("Save error:", error);
      } finally {
         setIsSaving(false);
      }
   };

   const copyApprovalLink = (id: string) => {
      const url = `${window.location.origin}/approve/${id}?t=r`;
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
   };

   const handleCancel = async (id: string) => {
      setCancelId(id);
      setIsCancelModalOpen(true);
   };

   const confirmCancel = async () => {
      if (!cancelId) return;
      setIsCancelling(true);
      try {
         const res = await fetch(`/api/requests/${cancelId}`, { method: "DELETE" });
         if (res.ok) {
            setIsCancelModalOpen(false);
            setViewRequest(null);
            fetchMyRequests();
         }
      } catch (error) {
         console.error("Cancel error:", error);
      } finally {
         setIsCancelling(false);
         setCancelId(null);
      }
   };

   const handleExportPDF = () => {
      if (!viewRequest) return;
      setIsPreviewModalOpen(true);
   };

   const isStandard = ["SUPPORT", "PASSWORD_ACCOUNT", "BORROW_ACC", "REPAIR", "INSTALLATION"].includes(formData.type_request);

   const filteredRequests = requests.filter(r => filterType === 'ALL' || r.userId === (session?.user as any)?.id);

   return (
      <div className="p-4 sm:p-6 space-y-4">
         <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-xl font-black text-primary tracking-tight uppercase leading-none">{t('requests.title')}</h1>
            </div>
            <Button
               onClick={() => setIsModalOpen(true)}
               className="w-full sm:w-auto h-12 rounded-xl shadow-lg shadow-primary/20 transition-all font-black text-[11px] uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2"
            >
               <Plus className="h-4 w-4" />
               {t('requests.create_ticket')}
            </Button>
         </header>

         <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-xl border border-border w-fit">
                  {[
                     { id: 'ME', label: t('common.me') },
                     { id: 'ALL', label: t('common.all') }
                  ].map((btn) => (
                     <button
                        key={btn.id}
                        onClick={() => setFilterType(btn.id as any)}
                        className={cn(
                           "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                           filterType === btn.id ? "bg-surface text-primary shadow-sm" : "text-accent hover:text-foreground"
                        )}
                     >
                        {btn.label}
                     </button>
                  ))}
                  {/* Month Filter */}
               <select
                  className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none text-accent focus:border-primary/30 font-sans shadow-sm"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
               >
                  <option value="ALL">{locale === 'th' ? 'ทุกเดือน' : 'ALL MONTHS'}</option>
                  {monthOptions.map(opt => (
                     <option key={opt.val} value={opt.val}>{opt.label}</option>
                  ))}
               </select>
            </div>
               {/* No Search here? Borrow has search. Let's add it if needed but user didn't ask for search in Request yet. Let's stick to existing. */}
            </div>



            {/* Desktop Table View */}
            <Card className="rounded-xl border border-border shadow-sm overflow-hidden hidden lg:block bg-surface">
               <Table className="w-full">
                  <TableHeader className="bg-secondary/30">
                     <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="px-5 py-4 text-[10px] font-black text-accent uppercase tracking-widest">{t('requests.problem_desc')}</TableHead>
                        <TableHead className="px-5 py-4 text-[10px] font-black text-accent uppercase tracking-widest text-center">{t('common.category')}</TableHead>
                        <TableHead className="px-5 py-4 text-[10px] font-black text-accent uppercase tracking-widest text-center">{t('common.priority')}</TableHead>
                        <TableHead className="px-5 py-4 text-[10px] font-black text-accent uppercase tracking-widest text-center">{t('common.date')}</TableHead>
                        <TableHead className="px-5 py-4 text-[10px] font-black text-accent uppercase tracking-widest">{locale === 'th' ? 'สถานะ' : 'STATUS'}</TableHead>
                        <TableHead className="px-5 py-4 text-right"></TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                     {isLoading ? (
                        <TableRow>
                           <TableCell colSpan={6} className="p-0 border-none">
                              <TableSkeleton rows={5} cols={6} />
                           </TableCell>
                        </TableRow>
                     ) : filteredRequests.length === 0 ? (
                        <TableRow className="border-none">
                           <TableCell colSpan={6} className="p-0 border-none">
                              <EmptyState
                                 title={filterType === 'ME' ? t('requests.no_tickets_me') : t('requests.no_tickets_all')}
                                 description="Start by creating a new ticket using the button above."
                                 icon={<Ticket className="h-8 w-8" />}
                              />
                           </TableCell>
                        </TableRow>
                     ) : (
                        filteredRequests.map((req: any) => (
                           <TableRow key={req.id} className="hover:bg-secondary/40 transition-all group border-border">
                              <TableCell className="px-4 py-3">
                                 <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg w-fit italic tracking-widest">{req.request_code || 'RQ-N/A'}</span>
                                    <div className="font-bold text-foreground text-[14px] leading-tight line-clamp-1">{req.description}</div>
                                 </div>
                              </TableCell>
                              <TableCell className="px-5 py-4 text-center">
                                 <div className="flex flex-col items-center">
                                    <span className="text-[11px] font-bold text-foreground/80 uppercase tracking-tight">
                                       {req.category === "HARDWARE" ? t('categories.hardware') :
                                          req.category === "SOFTWARE" ? t('categories.software') :
                                             req.category === "NETWORK" ? t('categories.network') :
                                                req.category === "GENERAL" ? t('categories.general') : req.category}
                                    </span>
                                    <span className="text-[9px] font-black text-accent uppercase tracking-widest mt-0.5">{req.type_request || 'N/A'}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="px-5 py-4 text-center">
                                 <div className={cn(
                                    "inline-flex items-center rounded-lg px-2.5 py-0.5 border",
                                    req.priority === "URGENT" ? "text-red-700 bg-red-700/5 border-red-700/20" :
                                       req.priority === "HIGH" ? "text-orange-700 bg-orange-700/5 border-orange-700/20" :
                                          req.priority === "MEDIUM" ? "text-yellow-700 bg-yellow-700/5 border-yellow-700/20" :
                                             "text-green-700 bg-green-700/5 border-green-700/20"
                                 )}>
                                    <span className="text-[8px] font-black uppercase tracking-widest">
                                       {req.priority === "URGENT" ? t('priorities.urgent') :
                                          req.priority === "HIGH" ? t('priorities.high') :
                                             req.priority === "MEDIUM" ? t('priorities.medium') :
                                                req.priority === "LOW" ? t('priorities.low') : req.priority}
                                    </span>
                                 </div>
                              </TableCell>
                              <TableCell className="px-5 py-4 text-center">
                                 <div className="flex flex-col items-center">
                                    <span className="text-[11px] font-bold text-foreground/70">{new Date(req.createdAt).toLocaleDateString('en-GB')}</span>
                                    <span className="text-[9px] font-black text-accent uppercase tracking-widest mt-0.5">{new Date(req.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="px-5 py-4">
                                 <Badge variant={
                                    req.status === "RESOLVED" ? "success" :
                                       req.status === "IN_PROGRESS" ? "warning" : "default"
                                 } className="rounded-lg text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5">
                                    {req.status || 'PENDING'}
                                 </Badge>
                              </TableCell>
                              <TableCell className="px-5 py-4 text-right">
                                 <Button
                                    variant="ghost"
                                    onClick={() => setViewRequest(req)}
                                    className="h-9 w-9 p-0 rounded-xl bg-secondary/50 hover:bg-primary hover:text-white transition-all shadow-sm"
                                 >
                                    <Eye className="h-4 w-4" />
                                 </Button>
                              </TableCell>
                           </TableRow>
                        ))
                     )}
                  </TableBody>
               </Table>
            </Card>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-3 lg:hidden pb-10">
               {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                     <div key={i} className="animate-pulse h-48 bg-secondary/50 rounded-2xl border border-border" />
                  ))
               ) : filteredRequests.length === 0 ? (
                  <Card className="py-20 text-center border-dashed border-border rounded-2xl bg-surface/50 shadow-none">
                     <p className="text-[10px] font-black text-accent uppercase tracking-widest">{t('requests.no_tickets_me')}</p>
                  </Card>
               ) : filteredRequests.map((req: any) => (
                  <Card
                     key={req.id}
                     onClick={() => setViewRequest(req)}
                     className="p-0 cursor-pointer active:scale-[0.98] transition-all border-border bg-surface shadow-sm rounded-2xl overflow-hidden"
                  >
                     <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
                        <div className="space-y-1 min-w-0 flex-1">
                           <Badge variant="secondary" className="w-fit text-[9px] font-black bg-primary/5 text-primary border border-primary/10 tracking-widest uppercase">{req.request_code || 'RQ-N/A'}</Badge>
                           <CardTitle className="line-clamp-2 uppercase text-sm font-black text-primary tracking-tight leading-tight mt-1">{req.description}</CardTitle>
                        </div>
                        <Badge variant={
                           req.status === "RESOLVED" ? "success" :
                              req.status === "IN_PROGRESS" ? "warning" : "default"
                        } className="ml-2 rounded-lg text-[8px] font-black uppercase tracking-widest px-2 py-0.5 shrink-0">
                           {req.status || 'OPEN'}
                        </Badge>
                     </CardHeader>
                     <CardContent className="space-y-4 p-4 pt-0">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className={cn(
                              "rounded-lg text-[8px] font-black uppercase tracking-widest px-2 py-0.5",
                              req.priority === "URGENT" ? "text-danger border-danger/20 bg-danger/5" :
                                 req.priority === "HIGH" ? "text-warning border-warning/20 bg-warning/5" :
                                    req.priority === "MEDIUM" ? "text-primary border-primary/20 bg-primary/5" : "text-accent border-border bg-secondary/50"
                           )}>
                              {req.priority || 'LOW'}
                           </Badge>
                           <span className="text-[10px] font-black text-accent uppercase tracking-widest leading-none border-l border-border pl-2">{req.category || 'GENERAL'}</span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-secondary">
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black text-accent uppercase tracking-widest leading-none mb-1">{locale === 'th' ? 'วันที่ขอ' : 'DATE'}</span>
                              <span className="text-[11px] font-bold text-foreground/70">{new Date(req.createdAt).toLocaleDateString('en-GB')}</span>
                           </div>
                           <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                              <Eye className="h-4 w-4" />
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               ))}
            </div>
         </div>


         <Modal
            isOpen={!!viewRequest}
            onClose={() => setViewRequest(null)}
            title={t('requests.ticket_details')}
            size="lg"
         >
            <div className="space-y-4">
               {/* Primary Info Header */}
               <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">{locale === 'th' ? 'รหัสคำร้อง' : 'REQUEST CODE'}</p>
                        <p className="text-sm font-black text-primary uppercase tracking-tight">{viewRequest?.request_code || 'N/A'}</p>
                     </div>
                     <div className="text-right space-y-0.5">
                        <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">{locale === 'th' ? 'วันที่สร้าง' : 'CREATED'}</p>
                        <p className="text-xs font-bold text-foreground/70 uppercase">{viewRequest?.createdAt ? new Date(viewRequest.createdAt).toLocaleDateString('en-GB') : '-'}</p>
                     </div>
                  </div>

                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-2">{t('requests.problem_desc')}</p>
                     <div className="p-3 rounded-lg bg-surface border border-border">
                        <p className="text-[14px] font-bold text-primary uppercase leading-tight">{viewRequest?.description}</p>
                     </div>
                  </div>

                  {viewRequest?.attachment && (
                     <div className="space-y-1 pt-3 border-t border-border/50">
                        <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-2">{locale === 'th' ? 'รูปภาพแนบ' : 'ATTACHMENT'}</p>
                        <div className="rounded-xl overflow-hidden border border-border bg-black/5 flex items-center justify-center">
                           <a href={viewRequest.attachment} target="_blank" rel="noopener noreferrer" className="w-full text-center hover:opacity-90 transition-opacity">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={viewRequest.attachment} alt="Attachment" className="max-h-[300px] max-w-full object-contain mx-auto" />
                           </a>
                        </div>
                     </div>
                  )}

                  <div className="space-y-1 pt-3 border-t border-border/50">
                     <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-2">{t('requests.reason_urgency')}</p>
                     <div className="p-3 rounded-lg bg-surface/50 border border-border min-h-[60px]">
                        <p className="text-[13px] font-medium text-foreground/80 leading-relaxed">
                           {viewRequest?.reason || t('requests.no_info')}
                        </p>
                     </div>
                  </div>
               </div>

               {/* Metrics Grid */}
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-border bg-surface shadow-sm space-y-2">
                     <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">{t('common.category')}</p>
                     <Badge variant="secondary" className="rounded-lg text-[9px] font-black uppercase tracking-widest bg-primary/5 text-primary border-none">
                        {viewRequest?.category || 'GENERAL'}
                     </Badge>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-surface shadow-sm space-y-2">
                     <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">{t('common.priority')}</p>
                     <Badge className={cn(
                        "rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border-none text-white",
                        viewRequest?.priority === "URGENT" ? "bg-red-700" :
                           viewRequest?.priority === "HIGH" ? "bg-red-500" :
                              viewRequest?.priority === "MEDIUM" ? "bg-yellow-500 text-black" : "bg-green-500 text-black"
                     )}>
                        {viewRequest?.priority || 'LOW'}
                     </Badge>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-surface shadow-sm space-y-2">
                     <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">{t('requests.request_type')}</p>
                     <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase border-primary/20 text-primary bg-primary/5">
                        {viewRequest?.type_request || 'REPAIR'}
                     </Badge>
                  </div>
               </div>

               {/* User/Employee Context */}
               {viewRequest?.employee && (
                  <div className="p-4 rounded-xl border border-border bg-secondary/20 flex flex-col sm:flex-row justify-between gap-4">
                     <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">{locale === 'th' ? 'ชื่อความพนักงาน' : 'EMPLOYEE'}</p>
                        <p className="text-[13px] font-bold text-foreground/80 uppercase">{viewRequest.employee.employee_name_th}</p>
                     </div>
                     <div className="space-y-0.5 sm:text-right">
                        <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">{locale === 'th' ? 'รหัสพนักงาน' : 'CODE'}</p>
                        <p className="text-[13px] font-mono font-bold text-foreground/80 uppercase">{viewRequest.employee.employee_code}</p>
                     </div>
                  </div>
               )}

               {/* Approval Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-surface shadow-sm space-y-4">
                     <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">{t('requests.approval_status')}</p>
                        <Badge variant={viewRequest?.approval_status === "APPROVED" ? "success" : viewRequest?.approval_status === "REJECTED" ? "danger" : "default"} className="rounded-lg text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5">
                           {viewRequest?.approval_status || 'PENDING'}
                        </Badge>
                     </div>
                     {viewRequest?.approval && (
                        <div className="pt-2 border-t border-border/50">
                           <p className="text-[9px] font-black text-accent uppercase mb-1 tracking-widest">{t('requests.approver')}</p>
                           <p className="text-sm font-black text-primary uppercase">{viewRequest.approval}</p>
                        </div>
                     )}
                     {viewRequest?.approval_comment && (
                        <div className="px-3 py-2 rounded-lg bg-warning/5 border border-warning/10">
                           <p className="text-[9px] font-black text-warning uppercase mb-1">{locale === 'th' ? 'ความเห็นผู้อนุมัติ' : 'COMMENT'}</p>
                           <p className="text-[11px] font-medium text-foreground/80 leading-snug">{viewRequest.approval_comment}</p>
                        </div>
                     )}
                     {viewRequest?.approval && (viewRequest.userId === (session?.user as any)?.id || (session?.user as any)?.role === 'admin') && (
                        <div className="pt-3 border-t border-border/50">
                           <Button
                              onClick={() => copyApprovalLink(viewRequest.id)}
                              size="sm"
                              className="w-full rounded-lg bg-secondary hover:bg-secondary/80 text-primary text-[10px] font-black uppercase tracking-widest h-10"
                           >
                              {isCopied ? <><Check className="h-3.5 w-3.5 mr-1" /> {t('common.copied')}</> : <><LinkIcon className="h-3.5 w-3.5 mr-1" /> {t('common.copy_link')}</>}
                           </Button>
                        </div>
                     )}
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-secondary/30 shadow-sm space-y-4">
                     <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none text-primary">{locale === 'th' ? 'เจ้าหน้าที่ไอที' : 'IT OFFICER'}</p>
                        <Badge variant={viewRequest?.it_approval_status === "APPROVED" ? "success" : viewRequest?.it_approval_status === "REJECTED" ? "danger" : "default"} className="rounded-lg text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5">
                           {viewRequest?.it_approval_status || 'PENDING'}
                        </Badge>
                     </div>
                     {viewRequest?.it_approval && (
                        <div className="pt-2 border-t border-border/50">
                           <p className="text-[9px] font-black text-accent uppercase mb-1 tracking-widest">{locale === 'th' ? 'ผู้ดำเนินการ' : 'OFFICER'}</p>
                           <p className="text-sm font-black text-primary uppercase">{viewRequest.it_approval}</p>
                        </div>
                     )}
                     {viewRequest?.it_approval_comment && (
                        <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                           <p className="text-[9px] font-black text-primary/60 uppercase mb-1">{locale === 'th' ? 'ความเห็นไอที' : 'IT COMMENT'}</p>
                           <p className="text-[11px] font-medium text-foreground/80 leading-snug">{viewRequest.it_approval_comment}</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Actions */}
               <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                     onClick={() => setViewRequest(null)}
                     variant="ghost"
                     className="flex-1 h-12 rounded-xl text-accent text-[11px] font-black uppercase tracking-widest bg-secondary/20 order-3 sm:order-1"
                  >
                     {t('common.close')}
                  </Button>
                  <Button
                     onClick={handleExportPDF}
                     disabled={isExportingPDF}
                     className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 order-1 sm:order-2"
                  >
                     {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <><FileDown className="h-4 w-4 mr-2" /> {t('common.preview_pdf')}</>}
                  </Button>
                  {(viewRequest?.status === 'OPEN' || viewRequest?.status === 'PENDING') && (viewRequest.userId === (session?.user as any)?.id || (session?.user as any)?.role === 'admin') && (
                     <Button
                        onClick={() => handleCancel(viewRequest?.id!)}
                        className="flex-1 h-12 rounded-xl bg-danger hover:bg-danger/90 text-white text-[11px] font-black uppercase tracking-widest order-2 sm:order-3 shadow-lg shadow-danger/20"
                     >
                        {t('requests.cancel_request')}
                     </Button>
                  )}
               </div>
            </div>
         </Modal>

         <Drawer
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={t('requests.new_ticket_title')}
            size="lg"
         >
            <form onSubmit={handleCreate} className="space-y-6">
               <div className="space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('requests.request_type')}</label>
                     <select
                        required
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/20 transition-all font-sans"
                        value={formData.type_request}
                        onChange={(e) => {
                           const val = e.target.value;
                           setFormData({ ...formData, type_request: val });
                        }}
                     >
                        <optgroup label={t('requests.standard_request_group')}>
                           <option value="SUPPORT">{t('types.support')}</option>
                           <option value="PASSWORD_ACCOUNT">{t('types.password_reset')}</option>
                           <option value="BORROW_ACC">{t('types.borrow_acc')}</option>
                           <option value="REPAIR">{t('types.repair')}</option>
                           <option value="INSTALLATION">{t('types.installation')}</option>
                        </optgroup>
                        <optgroup label={t('requests.requires_approval_group')}>
                           <option value="PURCHASE">{t('types.purchase')}</option>
                           <option value="LICENSE">{t('types.license')}</option>
                           <option value="ACCESS">{t('types.access')}</option>
                           <option value="CHANGE">{t('types.change')}</option>
                        </optgroup>
                        <optgroup label={t('types.other')}>
                           <option value="OTHER">{t('types.other')}</option>
                        </optgroup>
                     </select>

                     {formData.type_request !== "" && (
                        <div className={cn(
                           "mt-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300",
                           isStandard
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-amber-50 text-amber-600 border border-amber-100"
                        )}>
                           {isStandard ? (
                              <><Check className="h-3 w-3" /> {t('requests.standard_indicator')}</>
                           ) : (
                              <><Clock className="h-3 w-3" /> {t('requests.approval_required_indicator')}</>
                           )}
                        </div>
                     )}
                  </div>

                  {formData.type_request === "OTHER" && (
                     <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-[11px] font-black text-[#0F1059] uppercase tracking-widest">{t('requests.please_specify')}</label>
                        <input
                           required
                           className="w-full bg-zinc-50 border border-[#0F1059]/30 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                           placeholder={t('requests.please_specify') + "..."}
                           value={formData.type_request_other}
                           onChange={(e) => setFormData({ ...formData, type_request_other: e.target.value })}
                        />
                     </div>
                  )}

                  <div className="space-y-1.5">
                     <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                        {formData.type_request === "PURCHASE" ? t('requests.purchase_items') : t('requests.problem_desc')}
                     </label>

                     {formData.type_request === "PURCHASE" && (
                        <div className="mb-4 p-4 rounded-2xl bg-[#0F1059]/5 border border-[#0F1059]/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                           <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('requests.check_stock')}</p>
                           </div>
                           <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                              <input
                                 className="w-full bg-white border border-zinc-100 rounded-xl pl-9 pr-4 py-2.5 text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-[#0F1059]/5"
                                 placeholder={t('requests.search_available')}
                                 value={invSearch}
                                 onChange={(e) => setInvSearch(e.target.value)}
                              />
                           </div>

                           {invSearch.length > 0 && (
                              <div className="space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                                 {inventory
                                    .filter(item => {
                                       const s = invSearch.toLowerCase();
                                       return (item.equipmentEntry?.list || "").toLowerCase().includes(s) ||
                                          (item.equipmentEntry?.brand_name || "").toLowerCase().includes(s);
                                    })
                                    .slice(0, 5)
                                    .map(item => (
                                       <button
                                          key={item.id}
                                          type="button"
                                          onClick={() => {
                                             setFormData({ ...formData, description: `${item.equipmentEntry?.list} [${item.equipmentEntry?.brand_name}]` });
                                             setInvSearch("");
                                          }}
                                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-[#0F1059] hover:text-white border border-zinc-50 transition-all text-left group"
                                       >
                                          <div className="min-w-0 flex-1">
                                             <p className="text-[10px] font-black truncate">{item.equipmentEntry?.list}</p>
                                             <p className="text-[8px] font-bold opacity-60 uppercase">{item.equipmentEntry?.brand_name} • {t('inventory.stock_count')}: {item.remaining}</p>
                                          </div>
                                          <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                       </button>
                                    ))
                                 }
                              </div>
                           )}
                        </div>
                     )}

                     <textarea
                        required
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[80px] focus:border-[#0F1059]/20 transition-all font-sans"
                        placeholder={formData.type_request === "PURCHASE" ? t('requests.specify_details') : t('requests.fault_details')}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('requests.reason_urgency')}</label>
                     <textarea
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[80px] focus:border-[#0F1059]/20 transition-all font-sans"
                        placeholder={t('requests.urgent_reason')}
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{locale === 'th' ? 'แนบรูปภาพ (ถ้ามี)' : 'ATTACHMENT (OPTIONAL)'}</label>
                     <div className="flex items-center gap-3">
                        <label className={cn(
                           "flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                           formData.attachment ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-zinc-50 border-zinc-200 text-zinc-400 hover:bg-zinc-100 hover:border-primary/30"
                        )}>
                           <div className="flex items-center gap-2 text-sm font-medium">
                              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                              {isUploading ? (locale === 'th' ? "กำลังอัปโหลด..." : "Uploading...") : 
                               formData.attachment ? (locale === 'th' ? "อัปโหลดแล้ว (คลิกเพื่อเปลี่ยน)" : "Uploaded (Click to change)") : 
                               (locale === 'th' ? "คลิกเพื่อแนบรูปภาพ" : "Click to attach image")}
                           </div>
                           <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                        {formData.attachment && (
                           <div className="h-12 w-12 rounded-lg border border-border overflow-hidden shrink-0 relative bg-zinc-100 shadow-sm flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={formData.attachment} alt="Attachment" className="h-full w-full object-cover" />
                              <button
                                 type="button"
                                 onClick={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, attachment: "" })); }}
                                 className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm"
                              >
                                 <X className="h-2 w-2" />
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-[#0F1059] uppercase tracking-widest">{t('requests.requestor')}</label>
                  <select
                     required
                     disabled
                     className="w-full border bg-black/10 border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium outline-none appearance-none cursor-not-allowed transition-all shadow-sm font-sans"
                     value={formData.employeeId}
                     onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  >
                     <option value="">{t('requests.select_employee')}</option>
                     {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.employee_name_th} ({emp.employee_code})</option>
                     ))}
                  </select>
               </div>

               {!isStandard && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                     <label className="text-[11px] font-black text-[#0F1059] uppercase tracking-widest">{t('requests.approver')}</label>
                     <EmployeeSearchSelect
                        value={formData.approval}
                        employees={employees}
                        onChange={(val) => {
                           setFormData({ ...formData, approval: val });
                           if (val) setFormError(null);
                        }}
                        placeholder={t('requests.no_approval_option')}
                     />
                     {formError && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">! {formError}</p>}
                     <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">* {t('requests.supervisor_needed_hint')}</p>
                  </div>
               )}

                {/* AI Category & Priority Control */}
                <AICategorizeSuggest
                   ref={aiRef}
                   type_request={formData.type_request}
                   description={formData.description}
                   reason={formData.reason}
                   onApply={(category, priority) =>
                     setFormData({ ...formData, category, priority })
                   }
                />

               <div className="grid-cols-1 sm:grid-cols-2 gap-4 hidden">
                  <div className="space-y-1.5">
                     <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('common.category')}</label>
                     <select
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none cursor-pointer focus:border-[#0F1059]/20 font-sans"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                     >
                        <option value="HARDWARE">{t('categories.hardware')}</option>
                        <option value="SOFTWARE">{t('categories.software')}</option>
                        <option value="NETWORK">{t('categories.network')}</option>
                        <option value="GENERAL">{t('categories.general')}</option>
                     </select>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('common.priority')}</label>
                     <select
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none cursor-pointer focus:border-[#0F1059]/20 font-sans"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                     >
                        <option value="LOW">{t('priorities.low')}</option>
                        <option value="MEDIUM">{t('priorities.medium')}</option>
                        <option value="HIGH">{t('priorities.high')}</option>
                        <option value="URGENT">{t('priorities.urgent')}</option>
                     </select>
                  </div>
               </div>

               <div className="flex items-center gap-3 pt-4 border-t border-zinc-50">
                  <Button
                     type="submit"
                     disabled={isSaving}
                     className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest transition-all"
                  >
                     {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.submit')}
                  </Button>
               </div>
            </form>
         </Drawer>

         {/* Success Modal */}
         <Modal
            isOpen={!!showSuccess}
            onClose={() => setShowSuccess(null)}
            title={t('requests.success_title')}
         >
            <div className="flex flex-col items-center text-center space-y-6 pt-4">
               <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center ring-8 ring-emerald-50/50">
                  <ClipboardCheck className="h-10 w-10" />
               </div>

               <div className="space-y-2">
                  <h3 className="text-xl font-black text-[#0F1059] uppercase tracking-tight">{locale === 'th' ? 'บันทึกข้อมูลสำเร็จ!' : 'Success!'}</h3>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                     {showSuccess?.approvalNeeded
                        ? t('requests.success_msg_approval')
                        : t('requests.success_msg_no_approval')}
                  </p>
               </div>

               {showSuccess?.approvalNeeded && (
                  <div className="w-full p-4 rounded-2xl bg-[#0F1059]/5 border border-[#0F1059]/10 space-y-3">
                     <p className="text-[10px] font-black text-[#0F1059] uppercase tracking-[0.25em] text-left ml-1">{t('requests.approval_link')}</p>
                     <div className="flex gap-2">
                        <div className="flex-1 h-12 bg-white rounded-xl border flex items-center px-4 overflow-hidden border-[#0F1059]/10">
                           <span className="text-[10px] text-zinc-400 truncate font-mono">
                              {typeof window !== 'undefined' ? `${window.location.origin}/approve/${showSuccess.id}?t=r` : ''}
                           </span>
                        </div>
                        <Button
                           onClick={() => copyApprovalLink(showSuccess.id)}
                           className={cn(
                              "h-12 rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest shrink-0",
                              isCopied ? "bg-emerald-500 text-white" : "bg-[#0F1059] text-white"
                           )}
                        >
                           {isCopied ? <><Check className="h-3.5 w-3.5 mr-1.5" /> {t('common.copied')}</> : <><LinkIcon className="h-3.5 w-3.5 mr-1.5" /> {t('common.copy_link')}</>}
                        </Button>
                     </div>
                  </div>
               )}

               <Button
                  onClick={() => setShowSuccess(null)}
                  className="w-full h-12 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-[11px] font-black uppercase tracking-widest mt-4"
               >
                  {t('common.ok')}
               </Button>
            </div>
         </Modal>

         {/* PDF Preview Modal */}
         <Modal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            title={t('common.preview_pdf')}
            size="xl"
         >
            <div className="h-[75vh] w-full rounded-2xl overflow-hidden border border-zinc-100">
               {viewRequest && (
                  <PDFViewer width="100%" height="100%" showToolbar={true}>
                     <ITRequestPDF data={viewRequest} locale={locale} />
                  </PDFViewer>
               )}
            </div>
            <div className="mt-4 flex justify-end">
               <Button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-[11px] font-black uppercase tracking-widest px-8"
               >
                  {t('common.close')}
               </Button>
            </div>
         </Modal>

         {/* Cancel Confirmation Modal */}
         <Modal
            isOpen={isCancelModalOpen}
            onClose={() => setIsCancelModalOpen(false)}
            title={locale === 'th' ? "ยืนยันการยกเลิก" : "Confirm Cancel Request"}
            size="sm"
         >
            <div className="space-y-6 text-center">
               <div className="mx-auto w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 mb-2">
                  <X className="h-8 w-8" />
               </div>
               <div>
                  <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">
                     {locale === 'th' ? "ยกเลิกคำร้อง?" : "Cancel Request?"}
                  </h3>
                  <p className="text-[13px] font-bold text-zinc-400 mt-2 leading-relaxed uppercase tracking-widest">
                     {locale === 'th'
                        ? "คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำร้องนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
                        : "Are you sure you want to cancel this request? This action cannot be undone."}
                  </p>
               </div>
               <div className="flex flex-col gap-2 pt-2">
                  <Button
                     onClick={confirmCancel}
                     disabled={isCancelling}
                     className="w-full h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-rose-500/20"
                  >
                     {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : (locale === 'th' ? "ยืนยันการยกเลิก" : "Cancel Permanently")}
                  </Button>
                  <Button
                     variant="ghost"
                     onClick={() => setIsCancelModalOpen(false)}
                     disabled={isCancelling}
                     className="w-full h-12 rounded-2xl text-zinc-400 font-black uppercase tracking-widest text-[11px]"
                  >
                     {viewRequest && t('common.cancel')}
                  </Button>
               </div>
            </div>
         </Modal>
      </div>
   );
}

export default function MyRequestsPage() {
   return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-[#0F1059]" /></div>}>
         <RequestsContent />
      </Suspense>
   );
}
