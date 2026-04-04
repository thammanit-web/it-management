"use client";
import { useSearchParams } from "next/navigation";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Plus, ClipboardCheck, Link as LinkIcon, Check, Eye, FileDown, X, FileText } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { BorrowRequisitionPDF } from "@/lib/pdf/BorrowRequisitionPDF";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { NewBorrowDrawer } from "@/components/borrow/NewBorrowDrawer";
import PDFPreview from "@/components/pdf/PDFPreview";

interface InventoryItem {
  id: string;
  remaining: number;
  equipmentEntry?: {
    item_name: string;
    item_type: string;
    brand_name?: string;
    unit?: string;
    list?: string;
    purchaseOrder?: {
       picture?: string;
       detail?: string;
    }
  }
}

interface BorrowGroup {
  id: string;
  group_code: string;
  userId: string;
  reason?: string;
  approval?: string;
  approval_status: string;
  approval_comment?: string;
  it_approval?: string;
  it_approval_status: string;
  it_approval_comment?: string;
  createdAt: string;
  requests: Array<{
    id: string;
    equipment_code: string;
    quantity: number;
    borrow_type: 'NEW' | 'BROKEN' | 'OTHER' | 'PURCHASE';
    remarks: string;
    equipmentList?: {
      equipmentEntry?: {
        list: string;
        brand_name: string;
        item_name: string;
        item_type: string;
      }
    }
  }>;
  user?: {
    employee?: {
      employee_name_th: string;
      employee_code: string;
    }
  }
}

function BorrowContent() {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [myHistory, setMyHistory] = useState<BorrowGroup[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewGroup, setViewGroup] = useState<BorrowGroup | null>(null);
  const [showSuccess, setShowSuccess] = useState<{ id: string, approvalNeeded: boolean } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ME' | 'ALL'>('ME');

  // Cancellation States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (session) {
      fetchData();

      if (action === 'new') {
        setIsModalOpen(true);
      }
    }
  }, [session, action]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/equipment-requests");
      const data = await res.json();
      if (Array.isArray(data)) setMyHistory(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyApprovalLink = (id: string) => {
    const url = `${window.location.origin}/approve/${id}?t=g`;
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
      const res = await fetch(`/api/equipment-requests/${cancelId}`, { method: "DELETE" }); 
      if (res.ok) {
        setIsCancelModalOpen(false);
        setViewGroup(null);
        fetchData();
      }
    } catch (error) {
      console.error("Cancel error:", error);
    } finally {
      setIsCancelling(false);
      setCancelId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-primary tracking-tight uppercase leading-none">{t('borrow.title')}</h1>
        </div>
        <Button 
          onClick={() => {
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto h-12 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all font-black text-[11px] uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('borrow.create_new')}
        </Button>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-xl border border-border w-fit">
            <button 
              onClick={() => setFilterType('ME')}
              className={cn(
                "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                filterType === 'ME' ? "bg-surface text-primary shadow-sm" : "text-accent hover:text-foreground"
              )}
            >
              {t('borrow.my_requests')}
            </button>
            <button 
              onClick={() => setFilterType('ALL')}
              className={cn(
                "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                filterType === 'ALL' ? "bg-surface text-primary shadow-sm" : "text-accent hover:text-foreground"
              )}
            >
              {t('borrow.public_view')}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-xl border border-border w-full sm:w-64 shadow-sm group focus-within:border-primary/30 transition-all">
            <Search className="h-3.5 w-3.5 text-accent" />
            <input 
              className="bg-transparent border-none outline-none text-[11px] font-bold uppercase tracking-wider w-full text-foreground placeholder:text-accent/50"
              placeholder={t('borrow.search_history')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <Card className="rounded-xl border border-border shadow-sm overflow-hidden bg-surface hidden lg:block">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-secondary/30">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="px-5 py-4 text-[10px] font-black text-accent uppercase tracking-widest">{t('borrow.request_info')}</TableHead>
                  <TableHead className="px-5 py-4 text-[10px] font-black text-accent uppercase tracking-widest text-center">{t('borrow.created_date')}</TableHead>
                  <TableHead className="px-5 py-4 text-[10px] font-black text-accent uppercase tracking-widest text-center">{t('borrow.qty')}</TableHead>
                  <TableHead className="px-5 py-4 text-[10px] font-black text-accent uppercase tracking-widest">{t('borrow.status')}</TableHead>
                  <TableHead className="px-5 py-4 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border/50">
                      <TableCell colSpan={5} className="h-20 animate-pulse bg-secondary/10" />
                    </TableRow>
                  ))
                ) : myHistory.filter(h => filterType === 'ALL' || h.userId === (session?.user as any)?.id).length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                           <FileText className="h-10 w-10 text-accent/20" />
                           <p className="text-[10px] font-black text-accent uppercase tracking-widest">{t('borrow.no_requests')}</p>
                        </div>
                     </TableCell>
                  </TableRow>
                ) : myHistory
                    .filter(h => filterType === 'ALL' || h.userId === (session?.user as any)?.id)
                    .filter(h => {
                      const s = search.toLowerCase();
                      return h.group_code.toLowerCase().includes(s) || 
                             h.requests.some(r => (r.equipmentList?.equipmentEntry?.list || "").toLowerCase().includes(s));
                    })
                    .map((g: BorrowGroup) => (
                  <TableRow key={g.id} className="hover:bg-secondary/10 transition-colors group border-border/50">
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0 tracking-tighter">
                          {g.requests.length}
                        </div>
                        <div className="flex flex-col min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 uppercase tracking-widest">{g.group_code}</span>
                           </div>
                           <p className="text-sm font-bold text-foreground truncate max-w-[300px] uppercase">
                             {g.requests.length === 1 
                               ? g.requests[0].equipmentList?.equipmentEntry?.list 
                               : (locale === 'th' ? `ชุดเบิกอุปกรณ์ (${g.requests.length})` : `Batch Request (${g.requests.length})`)}
                           </p>
                           {filterType === 'ALL' && (
                             <p className="text-[10px] font-bold text-accent uppercase leading-none mt-1">{t('requests.requestor')}: {g.user?.employee?.employee_name_th || 'System'}</p>
                           )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                       <p className="text-[11px] font-bold text-foreground/80">{new Date(g.createdAt).toLocaleDateString('en-GB')}</p>
                       <p className="text-[9px] font-black text-accent uppercase tracking-widest mt-0.5">{new Date(g.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                       <Badge variant="secondary" className="rounded-lg text-[10px] font-black px-2.5 py-0.5 h-auto uppercase tracking-tighter bg-secondary text-accent border-border shadow-none">
                          {g.requests.reduce((acc, r) => acc + r.quantity, 0)} {locale === 'th' ? 'ชิ้น' : 'pcs'}
                       </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge variant={
                          g.it_approval_status === "APPROVED" ? "success" :
                          g.it_approval_status === "REJECTED" ? "danger" : "default"
                        } className="rounded-lg text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5">
                        {g.it_approval_status || 'PENDING'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        onClick={() => setViewGroup(g)}
                        className="h-9 w-9 p-0 rounded-xl hover:bg-primary hover:text-white transition-all bg-secondary/50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Mobile Card View */}
        <div className="grid grid-cols-1 gap-4 lg:hidden pb-10">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse h-48 bg-secondary/50 rounded-2xl border border-border" />
            ))
          ) : myHistory.filter(h => filterType === 'ALL' || h.userId === (session?.user as any)?.id).length === 0 ? (
            <Card className="py-20 text-center border-dashed border-border rounded-2xl bg-surface/50 shadow-none">
              <p className="text-[10px] font-black text-accent uppercase tracking-widest">{t('borrow.no_requests')}</p>
            </Card>
          ) : myHistory
              .filter(h => filterType === 'ALL' || h.userId === (session?.user as any)?.id)
              .filter(h => {
                const s = search.toLowerCase();
                return h.group_code.toLowerCase().includes(s) || 
                       h.requests.some(r => (r.equipmentList?.equipmentEntry?.list || "").toLowerCase().includes(s));
              })
              .map((g: BorrowGroup) => (
            <Card key={g.id} onClick={() => setViewGroup(g)} className="cursor-pointer active:scale-[0.98] transition-all border-border bg-surface shadow-sm rounded-2xl overflow-hidden p-0">
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 uppercase tracking-widest">{g.group_code}</span>
                    <p className="text-sm font-black text-foreground uppercase tracking-tight truncate leading-tight mt-1">
                      {g.requests.length === 1 
                        ? g.requests[0].equipmentList?.equipmentEntry?.list 
                        : (locale === 'th' ? `ชุดเบิกอุปกรณ์ (${g.requests.length})` : `Batch Request (${g.requests.length})`)}
                    </p>
                  </div>
                  <Badge variant={
                    g.it_approval_status === "APPROVED" ? "success" :
                    g.it_approval_status === "REJECTED" ? "danger" : "default"
                  } className="rounded-lg text-[8px] font-black uppercase tracking-widest px-2 py-0.5 shrink-0">
                    {g.it_approval_status || 'PENDING'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-secondary">
                   <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-accent uppercase tracking-widest leading-none">{locale === 'th' ? 'วันที่เบิก' : 'DATE'}</p>
                      <p className="text-[11px] font-bold text-foreground/80">{new Date(g.createdAt).toLocaleDateString('en-GB')}</p>
                   </div>
                   <div className="space-y-0.5 text-right">
                      <p className="text-[8px] font-black text-accent uppercase tracking-widest leading-none">{t('borrow.qty')}</p>
                      <p className="text-[11px] font-bold text-foreground/80">{g.requests.reduce((acc, r) => acc + r.quantity, 0)} {locale === 'th' ? 'รายการ' : 'ITEMS'}</p>
                   </div>
                </div>

                {filterType === 'ALL' && (
                  <div className="px-3 py-2 rounded-lg bg-secondary/50 border border-border/50">
                     <p className="text-[9px] font-bold text-accent uppercase italic">{t('requests.requestor')}: {g.user?.employee?.employee_name_th || 'System'}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Borrow Group Details Modal */}
      <Modal 
        isOpen={!!viewGroup} 
        onClose={() => setViewGroup(null)} 
        title={t('borrow.batch_details')}
        size="lg"
      >
        <div className="space-y-4">
           {/* Primary Info Header */}
           <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-4">
              <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">{t('borrow.group_code')}</p>
                    <p className="text-sm font-black text-primary uppercase tracking-tight">{viewGroup?.group_code || 'N/A'}</p>
                 </div>
                 <div className="text-right space-y-0.5">
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">{locale === 'th' ? 'วันที่สร้าง' : 'CREATED'}</p>
                    <p className="text-xs font-bold text-foreground/70 uppercase">{viewGroup?.createdAt ? new Date(viewGroup.createdAt).toLocaleDateString('en-GB') : '-'}</p>
                 </div>
              </div>
              
              {/* Itemized List */}
              <div className="space-y-2">
                 <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">{t('borrow.itemized_list')} ({viewGroup?.requests.length})</p>
                 <div className="space-y-2">
                    {viewGroup?.requests.map((item) => (
                       <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border shadow-sm group">
                          <div className="flex-1 min-w-0 pr-4">
                             <p className="text-sm font-bold text-primary truncate uppercase">{item.equipmentList?.equipmentEntry?.list}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-[9px] font-black px-1.5 py-0.5 h-auto uppercase tracking-tighter bg-primary/5 border-none text-primary">
                                   {item.borrow_type === 'NEW' ? (locale === 'th' ? 'เบิกของใหม่' : 'NEW') : 
                                    item.borrow_type === 'BROKEN' ? (locale === 'th' ? 'ชำรุด' : 'BROKEN') : 
                                    item.borrow_type === 'PURCHASE' ? (locale === 'th' ? 'แจ้งซื้อ' : 'PURCHASE') :
                                    item.borrow_type === 'OTHER' ? (locale === 'th' ? 'อื่นๆ' : 'OTHER') : item.borrow_type}
                                </Badge>
                                <span className="text-[11px] text-accent font-bold uppercase">{t('borrow.qty')}: {item.quantity}</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="text-[10px] font-mono font-bold text-accent bg-secondary px-2 py-1 rounded border border-border uppercase tracking-tighter shrink-0 block">{item.equipment_code}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Purpose/Reason */}
              <div className="space-y-1 pt-3 border-t border-border/50">
                 <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-2">{t('borrow.primary_reason')}</p>
                 <div className="p-3 rounded-lg bg-surface/50 border border-border min-h-[60px]">
                    <p className="text-[13px] font-medium text-foreground/80 leading-relaxed whitespace-pre-line">
                       {viewGroup?.reason || t('borrow.no_additional_context')}
                    </p>
                 </div>
              </div>
           </div>

           {/* Approval Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-surface shadow-sm space-y-4">
                 <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">{t('requests.approval_status')}</p>
                    <Badge variant={viewGroup?.approval_status === "APPROVED" ? "success" : viewGroup?.approval_status === "REJECTED" ? "danger" : "default"} className="rounded-lg text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5">
                       {viewGroup?.approval_status || 'PENDING'}
                    </Badge>
                 </div>
                 {viewGroup?.approval && (
                    <div className="pt-2 border-t border-border/50">
                       <p className="text-[9px] font-black text-accent uppercase mb-1 tracking-widest">{t('requests.approver')}</p>
                       <p className="text-sm font-black text-primary uppercase">{viewGroup.approval}</p>
                    </div>
                 )}
                 {viewGroup?.approval_comment && (
                    <div className="px-3 py-2 rounded-lg bg-warning/5 border border-warning/10">
                       <p className="text-[9px] font-black text-warning uppercase mb-1">{locale === 'th' ? 'ความเห็นผู้อนุมัติ' : 'COMMENT'}</p>
                       <p className="text-[11px] font-medium text-foreground/80 leading-snug">{viewGroup.approval_comment}</p>
                    </div>
                 )}
                 {viewGroup?.approval && (viewGroup.userId === (session?.user as any)?.id || (session?.user as any)?.role === 'admin') && (
                    <div className="pt-3 border-t border-border/50 flex flex-col gap-2">
                       <Button 
                          onClick={() => copyApprovalLink(viewGroup.id)}
                          size="sm"
                          className="w-full rounded-lg bg-secondary hover:bg-secondary/80 text-primary text-[10px] font-black uppercase tracking-widest h-10"
                       >
                          {isCopied ? <><Check className="h-4 w-4 mr-1.5" /> {t('common.copied')}</> : <><LinkIcon className="h-4 w-4 mr-1.5" /> {t('common.copy_link')}</>}
                       </Button>
                    </div>
                 )}
              </div>

              <div className="p-4 rounded-xl border border-border bg-secondary/30 shadow-sm space-y-4">
                 <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">{locale === 'th' ? 'ตรวจสอบไอที' : 'IT REVIEW'}</p>
                    <Badge variant={viewGroup?.it_approval_status === "APPROVED" ? "success" : viewGroup?.it_approval_status === "REJECTED" ? "danger" : "default"} className="rounded-lg text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5">
                       {viewGroup?.it_approval_status || 'PENDING'}
                    </Badge>
                 </div>
                 {viewGroup?.it_approval_comment && (
                    <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 mt-auto">
                       <p className="text-[9px] font-black text-primary/60 uppercase mb-1">{locale === 'th' ? 'ความเห็นไอที' : 'IT COMMENT'}</p>
                       <p className="text-[11px] font-medium text-foreground/80 leading-snug">{viewGroup.it_approval_comment}</p>
                    </div>
                 )}
              </div>
           </div>

           {/* Actions */}
           <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                   onClick={() => setViewGroup(null)}
                   variant="ghost"
                   className="flex-1 h-12 rounded-xl text-accent text-[11px] font-black uppercase tracking-widest bg-secondary/20 order-3 sm:order-1"
              >
                   {t('common.close')}
              </Button>
              <Button 
                   onClick={() => setIsPreviewModalOpen(true)}
                   className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest order-1 sm:order-2 shadow-lg shadow-emerald-500/20"
              >
                  <><FileDown className="h-4 w-4 mr-2" /> {t('common.preview_pdf')}</>
              </Button>
              {viewGroup?.it_approval_status === 'PENDING' && (viewGroup.userId === (session?.user as any)?.id || (session?.user as any)?.role === 'admin') && (
                <Button 
                     onClick={() => handleCancel(viewGroup!.id)}
                     className="flex-1 h-12 rounded-xl bg-danger hover:bg-danger/90 text-white text-[11px] font-black uppercase tracking-widest order-2 sm:order-3 shadow-lg shadow-danger/20"
                >
                     {t('requests.cancel_request')}
                </Button>
              )}
           </div>
        </div>
      </Modal>

      <NewBorrowDrawer 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(id, approvalNeeded) => {
          fetchData();
          setShowSuccess({ id, approvalNeeded });
        }}
      />

      {/* Success Modal */}
      <Modal 
        isOpen={!!showSuccess} 
        onClose={() => setShowSuccess(null)} 
        title={t('borrow.success_title')}
        size="sm"
      >
        <div className="flex flex-col items-center text-center space-y-6 pt-4">
           <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center ring-8 ring-emerald-500/5 animate-in zoom-in duration-500">
              <ClipboardCheck className="h-10 w-10" />
           </div>
           
           <div className="space-y-1">
              <h3 className="text-xl font-black text-primary uppercase tracking-tight">{locale === 'th' ? 'ส่งคำขอสำเร็จ!' : 'SUCCESSFUL!'}</h3>
              <p className="text-[13px] font-bold text-accent uppercase tracking-widest">
                 {showSuccess?.approvalNeeded ? t('requests.supervisor_approval_needed') : t('requests.sent_to_it')}
              </p>
           </div>

           {showSuccess?.approvalNeeded && (
              <div className="w-full p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                 <p className="text-[10px] font-black text-primary uppercase tracking-widest text-left">{t('requests.approval_link')}</p>
                 <div className="w-full h-10 bg-surface rounded-lg border border-border flex items-center px-3 overflow-hidden text-[11px] font-mono text-accent truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}/approve/${showSuccess.id}?t=g` : ''}
                 </div>
                 <Button onClick={() => copyApprovalLink(showSuccess.id)} className="w-full rounded-lg h-11 font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-lg shadow-primary/20">
                    {isCopied ? <><Check className="h-4 w-4 mr-1.5" /> {t('common.copied')}</> : <><LinkIcon className="h-4 w-4 mr-1.5" /> {t('common.copy_link')}</>}
                 </Button>
              </div>
           )}
           <Button onClick={() => setShowSuccess(null)} variant="ghost" className="w-full h-12 rounded-xl text-accent font-black uppercase tracking-widest bg-secondary/20">{t('common.ok')}</Button>
        </div>
      </Modal>

      {/* PDF Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={t('common.preview_pdf')}
        size="xl"
      >
        <div className="h-[75vh] w-full rounded-2xl overflow-hidden border border-border bg-surface shadow-inner">
          {viewGroup && (
            <PDFPreview 
              document={<BorrowRequisitionPDF data={viewGroup} />} 
              filename={`BORROW_${viewGroup.group_code}`}
            />
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setIsPreviewModalOpen(false)} className="rounded-xl bg-secondary hover:bg-secondary/80 text-primary font-black uppercase tracking-widest px-10 h-12">{t('common.close')}</Button>
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={locale === 'th' ? "ยกเลิกคำขอ" : "CANCEL REQUEST"}
        size="sm"
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center text-danger border border-danger/20 mb-2">
            <X className="h-9 w-9" />
          </div>
          <div>
            <h3 className="text-xl font-black text-primary uppercase tracking-tight">{locale === 'th' ? "ยืนยันการยกเลิก?" : "CONFIRM CANCEL?"}</h3>
            <p className="text-[13px] font-bold text-accent mt-2 leading-relaxed uppercase tracking-widest">{t('requests.cancel_confirm_text')}</p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={confirmCancel} disabled={isCancelling} className="w-full h-12 rounded-xl bg-danger hover:bg-danger/90 text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-danger/20">
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : (locale === 'th' ? "ยกเลิกคำขอ" : "CANCEL NOW")}
            </Button>
            <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)} className="w-full h-12 rounded-xl text-accent font-black uppercase tracking-widest text-[11px]">{t('common.back')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function BorrowPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-[#0F1059]" /></div>}>
      <BorrowContent />
    </React.Suspense>
  );
}
