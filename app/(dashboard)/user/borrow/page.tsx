"use client";
import { useSearchParams } from "next/navigation";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Plus, ClipboardCheck, ShoppingBag, Link as LinkIcon, Check, Eye, FileDown, X, FileText } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { EmployeeSearchSelect } from "@/components/employee-search-select";
import { PDFViewer } from "@react-pdf/renderer";
import { BorrowRequisitionPDF } from "@/lib/pdf/BorrowRequisitionPDF";
import { useTranslation } from "@/lib/i18n/LanguageContext";

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

interface Employee {
  id: string;
  employee_name_th: string;
  employee_code: string;
  department?: string | null;
  position?: string | null;
}

function BorrowContent() {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [myHistory, setMyHistory] = useState<BorrowGroup[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [viewGroup, setViewGroup] = useState<BorrowGroup | null>(null);
  const [showSuccess, setShowSuccess] = useState<{ id: string, approvalNeeded: boolean } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isExportingPDF] = useState(false);
  const [invSearch, setInvSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Cancellation States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [formData, setFormData] = useState({
    reason: "",
    approval: "",
    date_needed: new Date().toISOString().split('T')[0]
  });

  const [cart, setCart] = useState<{
    id: string,
    item?: InventoryItem, 
    manual_name?: string,
    manual_type?: string,
    quantity: number, 
    borrow_type: 'NEW' | 'BROKEN' | 'OTHER' | 'PURCHASE',
    remarks: string
  }[]>([]);

  const addToCart = (item: InventoryItem, isPurchase: boolean = false) => {
    setCart(prev => {
      const existing = prev.find(i => i.item?.id === item.id);
      if (existing) {
        const maxQty = isPurchase ? 999 : item.remaining;
        return prev.map(i => i.item?.id === item.id ? { ...i, quantity: Math.min(i.quantity + 1, maxQty) } : i);
      }
      return [...prev, { 
        id: item.id,
        item, 
        quantity: 1, 
        borrow_type: isPurchase ? 'PURCHASE' : 'NEW', 
        remarks: '' 
      }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const [filterType, setFilterType] = useState<'ME' | 'ALL'>('ME');

  const updateCartQuantity = (id: string, qty: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const updateCartItemDetails = (id: string, field: 'borrow_type' | 'remarks', value: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  useEffect(() => {
    if (session) {
      fetchData();
      fetchEmployees();

      if (action === 'new') {
        setCart([]);
        setIsModalOpen(true);
      }
    }
  }, [session, action]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invRes, histRes] = await Promise.all([
        fetch("/api/equipment-lists"),
        fetch("/api/equipment-requests")
      ]);
      const invData = await invRes.json();
      const histData = await histRes.json();
      if (Array.isArray(invData)) setInventory(invData);
      if (Array.isArray(histData)) setMyHistory(histData);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (error) {
      console.error("Fetch employees error:", error);
    }
  };

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    const needsApproval = cart.some(i => i.manual_name || ["MAIN", "SOFTWARE"].includes(i.item?.equipmentEntry?.item_type || ""));
    if (needsApproval && !formData.approval) {
       setFormError(locale === 'th' ? "กรุณาระบุผู้อนุมัติ (หัวหน้างาน/ผู้จัดการแผนก)" : "Please specify an approver (Manager).");
      return;
    }
    setFormError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/equipment-requests", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({ 
            equipmentListId: i.item?.id || null,
            manual_item_name: i.manual_name || null,
            manual_item_type: i.manual_type || null,
            quantity: i.quantity,
            borrow_type: i.borrow_type,
            remarks: i.remarks
          })),
          reason: formData.reason,
          approval: formData.approval,
          date_needed: formData.date_needed
        })
      });

      if (res.ok) {
        const result = await res.json();
        setIsModalOpen(false);
        setCart([]);
        setFormData({ reason: "", approval: "", date_needed: new Date().toISOString().split('T')[0] });
        fetchData();
        setShowSuccess({ id: result.id, approvalNeeded: !!formData.approval });
      } else {
        const err = await res.json();
        alert("Error: " + err.error);
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to submit request");
    } finally {
      setIsSaving(false);
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
            setCart([]);
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
                  {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FileDown className="h-4 w-4 mr-2" /> {t('common.preview_pdf')}</>}
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

      {/* Equipment Specs Modal */}
      <Modal 
        isOpen={!!viewingItem} 
        onClose={() => setViewingItem(null)} 
        title={t('borrow.technical_spec')}
        size="lg"
      >
        <div className="space-y-4">
           {viewingItem?.equipmentEntry?.purchaseOrder?.picture ? (
              <div className="w-full h-64 rounded-xl overflow-hidden bg-secondary/30 border border-border flex items-center justify-center">
                 <img src={viewingItem.equipmentEntry.purchaseOrder.picture} alt="" className="max-w-full max-h-full object-contain" />
              </div>
           ) : (
              <div className="w-full h-48 rounded-xl bg-secondary/20 flex items-center justify-center border border-dashed border-border text-accent">
                 <ShoppingBag className="h-10 w-10 opacity-20" />
              </div>
           )}

           <div className="space-y-3">
              <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-accent uppercase tracking-widest">{viewingItem?.equipmentEntry?.brand_name}</span>
                    <Badge variant="secondary" className="rounded-lg text-[9px] font-black uppercase bg-primary/5 text-primary border-none">
                       {viewingItem?.equipmentEntry?.item_type === 'MAIN' ? t('categories.hardware') : viewingItem?.equipmentEntry?.item_type}
                    </Badge>
                 </div>
                 <h3 className="text-xl font-black text-primary uppercase tracking-tight">{viewingItem?.equipmentEntry?.list}</h3>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50 border border-border min-h-[100px]">
                 <p className="text-[13px] font-medium text-foreground/80 leading-relaxed italic whitespace-pre-line">
                    {viewingItem?.equipmentEntry?.purchaseOrder?.detail || t('borrow.no_additional_specs')}
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-2 pt-2">
              <Button onClick={() => setViewingItem(null)} variant="ghost" className="h-12 rounded-xl text-accent text-[11px] font-black uppercase tracking-widest">{t('common.close')}</Button>
              <Button onClick={() => { addToCart(viewingItem!); setViewingItem(null); }} className="h-12 rounded-xl bg-primary hover:bg-primary-hover text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                 {t('borrow.add_to_cart')}
              </Button>
           </div>
        </div>
      </Modal>

      {/* Integrated Request Drawer */}
      <Drawer
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={t('borrow.request_equipment')}
        size="lg"
      >
        <form onSubmit={handleBorrow} className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full pb-6">
             <div className="space-y-4">
                   <div className="bg-secondary/20 p-4 rounded-2xl border border-border/50 h-full flex flex-col">
                      <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-4">1. {t('borrow.select_items')}</p>
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-accent" />
                        <input 
                          className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-3 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground shadow-sm"
                          placeholder={t('borrow.search_store')}
                          value={invSearch}
                          onChange={(e) => setInvSearch(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        {inventory
                          .filter(item => {
                             const searchLow = invSearch.toLowerCase();
                             return (item.equipmentEntry?.list || "").toLowerCase().includes(searchLow) ||
                                    (item.equipmentEntry?.brand_name || "").toLowerCase().includes(searchLow);
                          })
                          .map(item => {
                            const isInCart = cart.find(i => i.id === item.id);
                            return (
                              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border shadow-sm group hover:border-primary/30 transition-all">
                                <div className="flex-1 min-w-0 pr-3">
                                    <p className="text-xs font-black text-primary truncate uppercase">{item.equipmentEntry?.list}</p>
                                    <p className="text-[9px] font-bold text-accent uppercase tracking-tighter">{item.equipmentEntry?.brand_name} • {t('inventory.stock')}: {item.remaining}</p>
                                </div>
                                <Button 
                                  type="button" 
                                  onClick={() => addToCart(item)}
                                  disabled={!!isInCart || item.remaining === 0}
                                  className={cn(
                                    "h-9 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                    isInCart ? "bg-emerald-50 text-emerald-500 border-none" : "bg-primary text-white"
                                  )}
                                >
                                  {item.remaining === 0 ? (locale === 'th' ? 'หมด' : 'OUT') : (isInCart ? <Check className="h-4 w-4" /> : t('borrow.pick'))}
                                </Button>
                              </div>
                            );
                          })}
                       </div>
                    </div>
              </div>

              <div className="space-y-4 lg:border-l lg:pl-6 border-border flex flex-col">
                 <div className="flex-1 space-y-4">
                   <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">2. {t('borrow.manage_selection')} ({cart.length})</p>
                   <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                     {cart.length === 0 ? (
                       <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl text-[10px] font-black text-accent uppercase tracking-widest bg-secondary/10">{t('borrow.no_items_selected')}</div>
                     ) : (
                       cart.map(cartItem => (
                       <div key={cartItem.id} className="p-4 bg-surface border border-border rounded-xl shadow-sm space-y-4 group">
                          <div className="flex items-center justify-between gap-3">
                             <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-primary truncate uppercase tracking-tight">{cartItem.item?.equipmentEntry?.list}</p>
                                <div className="flex items-center bg-secondary w-fit px-2.5 py-1 rounded-lg border border-border mt-2 gap-3">
                                   <button type="button" onClick={() => updateCartQuantity(cartItem.id, Math.max(1, cartItem.quantity - 1))} className="text-primary font-black hover:text-accent transition-colors">-</button>
                                   <span className="text-[11px] font-black min-w-[20px] text-center">{cartItem.quantity}</span>
                                   <button type="button" onClick={() => updateCartQuantity(cartItem.id, Math.min(cartItem.item?.remaining || 99, cartItem.quantity + 1))} className="text-primary font-black hover:text-accent transition-colors">+</button>
                                </div>
                             </div>
                             <button type="button" onClick={() => removeFromCart(cartItem.id)} className="p-2 rounded-lg text-accent hover:text-danger hover:bg-danger/5 transition-all"><X className="h-4 w-4" /></button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-secondary">
                             <div className="space-y-1">
                                <p className="text-[8px] font-black text-accent uppercase tracking-widest ml-1">{t('borrow.borrow_type')}</p>
                                <select 
                                   className="w-full bg-secondary/50 border border-border rounded-lg px-2 py-2 text-[9px] font-black uppercase outline-none focus:ring-2 focus:ring-primary/5 transition-all"
                                   value={cartItem.borrow_type}
                                   onChange={(e) => updateCartItemDetails(cartItem.id, 'borrow_type', e.target.value as any)}
                                >
                                   <option value="NEW">{locale === 'th' ? 'เบิกใหม่' : 'NEW'}</option>
                                   <option value="BROKEN">{locale === 'th' ? 'ชำรุด' : 'BROKEN'}</option>
                                   <option value="OTHER">{locale === 'th' ? 'อื่นๆ' : 'OTHER'}</option>
                                </select>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[8px] font-black text-accent uppercase tracking-widest ml-1">{t('borrow.remarks')}</p>
                                <input 
                                   className="w-full bg-secondary/50 border border-border rounded-lg px-2 py-2 text-[10px] font-bold outline-none focus:bg-surface focus:ring-2 focus:ring-primary/5 transition-all"
                                   placeholder={t('borrow.remarks')}
                                   value={cartItem.remarks}
                                   onChange={(e) => updateCartItemDetails(cartItem.id, 'remarks', e.target.value)}
                                />
                             </div>
                          </div>
                       </div>
                     )))}
                   </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-border mt-auto">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">3. {t('borrow.request_info_step')}</p>
                       <textarea 
                          required
                          className="w-full bg-secondary/20 border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none min-h-[90px] focus:bg-surface transition-all placeholder:text-accent/50"
                          placeholder={t('borrow.describe_purpose')}
                          value={formData.reason}
                          onChange={(e) => setFormData({...formData, reason: e.target.value})}
                       />
                    </div>
                    {cart.some(i => ["MAIN", "SOFTWARE"].includes(i.item?.equipmentEntry?.item_type || "")) && (
                       <div className="space-y-2">
                           <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">4. {t('borrow.approver')}</p>
                           <EmployeeSearchSelect 
                              value={formData.approval}
                              onChange={(val) => {
                                 setFormData({...formData, approval: val});
                                 if (val) setFormError(null);
                              }}
                              employees={employees}
                              placeholder={t('borrow.search_approver')}
                           />
                           {formError && <p className="text-[9px] font-black text-danger uppercase tracking-widest mt-1">! {formError}</p>}
                       </div>
                    )}
                    <Button 
                      type="submit" 
                      disabled={isSaving || cart.length === 0}
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white shadow-xl shadow-primary/20 text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                       {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ClipboardCheck className="h-5 w-5" /> {t('borrow.confirm_request')}</>}
                    </Button>
                 </div>
              </div>
        </form>
      </Drawer>

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
        <div className="h-[75vh] w-full rounded-2xl overflow-hidden border border-border bg-secondary/20 shadow-inner">
          {viewGroup && (
            <PDFViewer width="100%" height="100%" showToolbar={true}>
              <BorrowRequisitionPDF data={viewGroup} />
            </PDFViewer>
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
