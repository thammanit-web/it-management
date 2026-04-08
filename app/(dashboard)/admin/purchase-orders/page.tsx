"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, ShoppingCart, Plus, Edit2, Trash2, Image as ImageIcon, Upload, ChevronUp, ChevronDown, FileSpreadsheet, Square, CheckSquare, Eye, Printer, Calendar, User, Info, FileText } from "lucide-react";
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
import { exportToExcel } from "@/lib/export-utils";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { EmployeeSearchSelect } from "@/components/employee-search-select";
import { useSession } from "next-auth/react";
import { bulkDeletePurchaseOrders, bulkUpdatePurchaseOrderStatus } from "@/lib/actions/bulk-actions";
import { useToast } from "@/components/ui/toast";

interface PO {
  id: string;
  po_code: string;
  list: string;
  detail?: string;
  quantity: number;
  reason_order?: string;
  picture?: string;
  buyer?: string;
  reviewer?: string;
  approver?: string;
  date_order?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Employee {
  id: string;
  employee_name_th: string;
  employee_code: string;
  department?: string;
  position?: string;
}

export default function PurchaseOrdersPage() {
  const { t, locale } = useTranslation();
  const [orders, setOrders] = useState<PO[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PO | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("PENDING");
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Recommendations
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters & Sorting logic states
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof PO; direction: 'asc' | 'desc' }>({
    key: 'po_code',
    direction: 'asc'
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const { data: session } = useSession();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDateStart, setExportDateStart] = useState("");
  const [exportDateEnd, setExportDateEnd] = useState("");

  // Form
  const [formData, setFormData] = useState({
    list: "",
    detail: "",
    quantity: 1,
    reason_order: "",
    picture: "",
    buyer: "",
    reviewer: "",
    approver: "",
    status: "PENDING",
    date_order: new Date().toISOString().split('T')[0]
  });



  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrdersList();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterStatus, sortConfig, page]);

  // Fetch recommendations
  useEffect(() => {
    if (!formData.list || formData.list.length < 2 || !isModalOpen) {
      setRecommendations([]);
      return;
    }

    const fetchRecs = async () => {
      try {
        const res = await fetch(`/api/equipment-purchase-orders/recommendations?search=${encodeURIComponent(formData.list)}`);
        if (res.ok) {
           const data = await res.json();
           setRecommendations(data || []);
        }
      } catch (err) {
        console.error("Fetch recommendations error:", err);
      }
    };

    const timer = setTimeout(fetchRecs, 300);
    return () => clearTimeout(timer);
  }, [formData.list, isModalOpen]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, sortConfig]);

  const fetchOrdersList = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status: filterStatus,
        sortField: sortConfig.key as string,
        sortOrder: sortConfig.direction
      });
      const res = await fetch(`/api/equipment-purchase-orders?${params.toString()}`);
      const result = await res.json();
      if (result.data) {
        setOrders(result.data);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 1);
      }
    } catch (error) {
      console.error("Fetch PO error:", error);
    } finally {
      setIsLoading(false);
    }
  };




  const handleSort = (key: keyof PO) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length && orders.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map(o => o.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(t('common.confirm_delete') + ` (${selectedIds.length} items)`)) return;

    setIsProcessingBulk(true);
    try {
      const res = await bulkDeletePurchaseOrders(selectedIds);
      if (res.success) {
        toast({ message: "Deleted successfully", variant: "success" });
        setSelectedIds([]);
        fetchOrdersList();
      } else {
        toast({ message: res.error || "Failed to delete", variant: "error" });
      }
    } catch (error) {
      toast({ message: "An error occurred", variant: "error" });
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkUpdateStatus = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessingBulk(true);
    try {
      const res = await bulkUpdatePurchaseOrderStatus(selectedIds, bulkStatus);
      if (res.success) {
        toast({ message: "Updated successfully", variant: "success" });
        setIsBulkEditModalOpen(false);
        setSelectedIds([]);
        fetchOrdersList();
      } else {
        toast({ message: res.error || "Failed to update", variant: "error" });
      }
    } catch (error) {
      toast({ message: "An error occurred", variant: "error" });
    } finally {
      setIsProcessingBulk(false);
    }
  };


  const handleExportExcel = () => {
    setIsExportModalOpen(true);
  };

  const processExport = async () => {
    let dataToExport = orders;

    if (exportDateStart || exportDateEnd) {
      dataToExport = dataToExport.filter(o => {
        const date = o.date_order ? new Date(o.date_order) : new Date();
        const start = exportDateStart ? new Date(exportDateStart) : null;
        const end = exportDateEnd ? new Date(exportDateEnd) : null;

        if (start && date < start) return false;
        if (end) {
          const endAdjusted = new Date(end);
          endAdjusted.setHours(23, 59, 59);
          if (date > endAdjusted) return false;
        }
        return true;
      });
    }

    if (dataToExport.length === 0) {
      alert("No data to export for the selected criteria.");
      return;
    }

    const worksheetData = dataToExport.map(o => ({
      "ID": o.id,
      "Order Date": o.date_order ? new Date(o.date_order).toLocaleDateString('en-GB') : '-',
      "Item": o.list,
      "Detail": o.detail,
      "Quantity": o.quantity,
      "Status": o.status,
      "Buyer": o.buyer,
      "Reviewer": o.reviewer,
      "Approver": o.approver,
      "Reason": o.reason_order
    }));

    await exportToExcel(worksheetData, `Purchase_Orders_${new Date().toISOString().split('T')[0]}`, "Orders");
    setIsExportModalOpen(false);
  };

  const openModal = (order: PO | null = null) => {
    if (order) {
      setSelectedOrder(order);
      setFormData({
        list: order.list || "",
        detail: order.detail || "",
        quantity: order.quantity || 1,
        reason_order: order.reason_order || "",
        picture: order.picture || "",
        buyer: order.buyer || "",
        reviewer: order.reviewer || "",
        approver: order.approver || "",
        status: order.status || "PENDING",
        date_order: order.date_order ? order.date_order.split('T')[0] : ""
      });
    } else {
      setSelectedOrder(null);
      setFormData({
        list: "",
        detail: "",
        quantity: 1,
        reason_order: "",
        picture: "",
        buyer: session?.user?.name || "",
        reviewer: "",
        approver: "",
        status: "PENDING",
        date_order: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name || 'image.png')}`, {
        method: "POST",
        body: file,
      });

      if (response.ok) {
        const blob = await response.json();
        setFormData((prev) => ({ ...prev, picture: blob.url }));
      } else {
        const error = await response.json();
        alert(error.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred while uploading. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  const removePicture = () => {
    setFormData((prev) => ({ ...prev, picture: "" }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = selectedOrder
        ? `/api/equipment-purchase-orders/${selectedOrder.id}`
        : "/api/equipment-purchase-orders";
      const method = selectedOrder ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchOrdersList();
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm_delete'))) return;
    try {
      const res = await fetch(`/api/equipment-purchase-orders/${id}`, { method: "DELETE" });
      if (res.ok) fetchOrdersList();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#0F1059] tracking-tighter uppercase leading-none flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-[#0F1059] flex items-center justify-center text-white border border-[#0F1059]/10 shadow-sm">
              <ShoppingCart className="h-6 w-6" />
            </div>
            {t('po.title')}
          </h1>
          <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-widest mt-2">{t('po.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleExportExcel()}
            variant="outline"
            className="rounded-lg border-zinc-200 hover:border-[#0F1059] hover:text-[#0F1059] py-5 px-6 font-black uppercase tracking-widest text-[11px] transition-all h-12 shadow-sm"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> {t('admin_tickets.export_excel')}
          </Button>
          <Button
            onClick={() => openModal()}
            className="rounded-lg h-12 px-8 bg-[#0F1059] hover:bg-black text-white transition-all text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#0F1059]/10"
          >
            <Plus className="mr-2 h-4 w-4" /> {t('po.add_new')}
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center p-4 rounded-xl border border-zinc-100 bg-white/50 shadow-sm font-sans">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-lg border border-zinc-100 group focus-within:border-[#0F1059]/30 transition-all lg:col-span-3">
          <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059]" />
          <input
            className="bg-transparent border-none outline-none text-[10px] font-black uppercase w-full"
            placeholder={t('po.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-2.5 text-[10px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30 font-sans transition-all cursor-pointer shadow-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">{t('po.all_status')}</option>
          <option value="PENDING">PENDING / {t('po.pending')}</option>
          <option value="ORDERED">ORDERED / {t('po.ordered')}</option>
          <option value="RECEIVED">RECEIVED / {t('po.received')}</option>
          <option value="CANCELLED">CANCELLED / {t('po.cancelled')}</option>
        </select>
      </div>

      <Card className="rounded-xl border-zinc-100 overflow-hidden bg-white/90 shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full text-left font-sans">
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none">
                <TableHead className="w-12 px-4 py-5">
                   <button 
                     onClick={toggleSelectAll}
                     className="text-zinc-400 hover:text-[#0F1059] transition-colors"
                   >
                     {selectedIds.length === orders.length && orders.length > 0 ? (
                       <CheckSquare className="h-4 w-4 text-[#0F1059]" />
                     ) : (
                       <Square className="h-4 w-4" />
                     )}
                   </button>
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest w-24">{t('po.media')}</TableHead>
                <TableHead
                  className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                  onClick={() => handleSort('po_code')}
                >
                  <div className="flex items-center gap-1">
                    {t('po.code') || 'CODE'}
                    {sortConfig.key === 'po_code' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                  onClick={() => handleSort('list')}
                >
                  <div className="flex items-center gap-1">
                    {t('po.order_details')}
                    {sortConfig.key === 'list' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center gap-1">
                    {t('po.quantity')}
                    {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead
                  className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                  onClick={() => handleSort('date_order')}
                >
                  <div className="flex items-center gap-1">
                    {t('po.order_date')}
                    {sortConfig.key === 'date_order' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('po.buyer')}</TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{locale === 'th' ? 'ผู้ตรวจสอบ' : 'REVIEWER'}</TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{locale === 'th' ? 'ผู้อนุมัติ' : 'APPROVER'}</TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('common.status')}</TableHead>
                <TableHead className="p-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={10} className="h-24 animate-pulse bg-zinc-50/20" />
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="px-6 py-20 text-center text-zinc-400 italic font-bold uppercase tracking-widest">
                    {t('po.no_pos_found')}
                  </TableCell>
                </TableRow>
              ) : orders.map((order) => (
                <TableRow key={order.id} className={cn("hover:bg-zinc-50/50 transition-colors group", selectedIds.includes(order.id) && "bg-[#0F1059]/5")}>
                  <TableCell className="px-4 py-4">
                     <button 
                        onClick={() => toggleSelect(order.id)}
                        className="text-zinc-400 hover:text-[#0F1059] transition-colors"
                     >
                        {selectedIds.includes(order.id) ? (
                          <CheckSquare className="h-4 w-4 text-[#0F1059]" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                     </button>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    {order.picture ? (
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shadow-sm">
                        <img
                          src={order.picture}
                          alt={order.list}
                          className="w-full h-full object-cover cursor-pointer hover:scale-125 transition-transform duration-700"
                          onClick={() => window.open(order.picture, '_blank')}
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-200 text-zinc-300">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="text-[9px] font-black uppercase px-2 py-1 border-zinc-200 text-[#0F1059] bg-[#0F1059]/5">
                      {order.po_code}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <div className="font-bold text-[#0F1059] uppercase text-sm">{order.list}</div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase truncate max-w-[180px] mt-0.5 italic">
                      {order.detail || t('common.no_info')}
                    </div>
                    {order.reason_order && (
                      <div className="text-[9px] text-amber-500 font-medium mt-0.5 truncate max-w-[180px]">
                        {locale === 'th' ? 'เหตุผล' : 'Reason'}: {order.reason_order}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <span className="text-xl font-black tracking-tighter text-[#0F1059]">{order.quantity}</span>
                    <span className="text-[9px] font-black text-zinc-300 uppercase ml-1">{t('po.units')}</span>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap text-xs font-bold text-zinc-600">
                    {order.date_order ? new Date(order.date_order).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB') : '-'}
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap text-[10px] font-black text-[#0F1059] uppercase tracking-tight">
                    {order.buyer || '-'}
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{order.reviewer || '-'}</span>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{order.approver || '-'}</span>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <Badge variant="outline"
                      className={cn("rounded-lg text-[8px] font-black uppercase tracking-widest px-2.5 py-1 border-zinc-200",
                        order.status === "RECEIVED" ? "text-emerald-600 bg-emerald-50" :
                          order.status === "PENDING" ? "text-amber-600 bg-amber-50" :
                            order.status === "CANCELLED" ? "text-rose-600 bg-rose-50" : "text-blue-600 bg-blue-50"
                      )}
                    >
                      {order.status === 'PENDING' ? t('po.pending') :
                        order.status === 'ORDERED' ? t('po.ordered') :
                          order.status === 'RECEIVED' ? t('po.received') :
                            order.status === 'CANCELLED' ? t('po.cancelled') : order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                      <button onClick={() => { setSelectedOrder(order); setIsViewModalOpen(true); }} className="p-2.5 rounded-lg bg-white border border-zinc-100 text-zinc-400 hover:text-blue-500 transition-all shadow-sm" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openModal(order)} className="p-2.5 rounded-lg bg-white border border-zinc-100 text-zinc-400 hover:text-[#0F1059] transition-all shadow-sm">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(order.id)} className="p-2.5 rounded-lg bg-white border border-zinc-100 text-zinc-400 hover:text-rose-600 transition-all shadow-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination UI */}
        <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
               {t('common.total')} {total} {t('po.entry_count') || 'PURCHASE ORDERS'}
            </div>
            <div className="flex items-center gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 disabled={page <= 1 || isLoading}
                 onClick={() => setPage(page - 1)}
                 className="h-9 rounded-lg border-zinc-200 text-[10px] font-black uppercase tracking-widest px-4 hover:bg-white transition-all disabled:opacity-30"
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
                 className="h-9 rounded-lg border-zinc-200 text-[10px] font-black uppercase tracking-widest px-4 hover:bg-white transition-all disabled:opacity-30"
               >
                 {t('common.next')}
               </Button>
            </div>
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0F1059] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
           <div className="flex items-center gap-3 pr-6 border-r border-white/20">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-black text-xs">
                 {selectedIds.length}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Selected</span>
           </div>
           
           <div className="flex items-center gap-2">
              <Button 
                onClick={() => setIsBulkEditModalOpen(true)}
                variant="ghost" 
                className="h-10 rounded-lg hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest gap-2"
              >
                 <Edit2 className="h-3.5 w-3.5" /> {t('common.edit') || 'Edit'}
              </Button>
              <Button 
                onClick={handleBulkDelete}
                disabled={isProcessingBulk}
                variant="ghost" 
                className="h-10 rounded-lg hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest gap-2"
              >
                 {isProcessingBulk ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} {t('common.delete') || 'Delete'}
              </Button>
              <Button 
                onClick={() => setSelectedIds([])}
                variant="ghost" 
                className="h-10 rounded-lg hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest"
              >
                 {t('common.cancel') || 'Cancel'}
              </Button>
           </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      <Modal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        title="Bulk Update PO Status"
      >
        <div className="space-y-6 font-sans">
           <div className="p-4 rounded-lg bg-[#0F1059]/5 border border-[#0F1059]/10 space-y-2">
              <p className="text-[10px] font-black text-[#0F1059] uppercase tracking-widest">Updating {selectedIds.length} orders</p>
              <p className="text-xs font-medium text-zinc-500 italic">This will update the status of all selected purchase orders.</p>
           </div>

           <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('common.status')}</label>
              <select
                 className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-black text-[#0F1059] uppercase outline-none focus:border-[#0F1059]/30 shadow-sm"
                 value={bulkStatus}
                 onChange={(e) => setBulkStatus(e.target.value)}
              >
                 <option value="PENDING">PENDING / {t('po.pending')}</option>
                 <option value="ORDERED">ORDERED / {t('po.ordered')}</option>
                 <option value="RECEIVED">RECEIVED / {t('po.received')}</option>
                 <option value="CANCELLED">CANCELLED / {t('po.cancelled')}</option>
              </select>
           </div>

           <div className="flex items-center gap-3 pt-4 border-t border-zinc-50">
              <Button 
                 variant="ghost" 
                 onClick={() => setIsBulkEditModalOpen(false)}
                 className="flex-1 h-12 rounded-lg text-[11px] font-black uppercase tracking-widest"
              >
                 {t('common.cancel')}
              </Button>
              <Button 
                 onClick={handleBulkUpdateStatus}
                 disabled={isProcessingBulk}
                 className="flex-1 h-12 rounded-lg bg-[#0F1059] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#0F1059]/10"
              >
                 {isProcessingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Selected"}
              </Button>
           </div>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedOrder ? t('po.edit_title') : t('po.new_title')}
      >
        <form onSubmit={handleSave} className="space-y-6 max-h-[85vh] overflow-y-auto pr-2 px-1 font-sans">
          {selectedOrder && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-[#0F1059]/5 border border-[#0F1059]/10 shadow-inner">
              <div>
                <p className="text-[9px] font-black text-[#0F1059]/60 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'วันที่สร้าง' : 'Created At'}</p>
                <p className="text-[11px] font-bold text-[#0F1059]">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB') : '-'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-[#0F1059]/60 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'อัพเดตล่าสุด' : 'Updated At'}</p>
                <p className="text-[11px] font-bold text-[#0F1059]">{selectedOrder.updatedAt ? new Date(selectedOrder.updatedAt).toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB') : '-'}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2 relative">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest flex justify-between items-center w-full">
                 <span>{t('po.item_name')}</span>
                 {recommendations.length > 0 && <span className="text-[9px] text-[#0F1059] italic animate-pulse">Items found in DB</span>}
              </label>
              <input
                required
                className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/30 transition-all shadow-sm"
                value={formData.list}
                onChange={(e) => {
                  setFormData({ ...formData, list: e.target.value });
                  setShowRecommendations(true);
                }}
                onFocus={() => setShowRecommendations(true)}
              />
              {showRecommendations && recommendations.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[300px] overflow-y-auto">
                   <div className="p-2 border-b border-zinc-50 bg-zinc-50/50">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-2">Recommendations from Database</p>
                   </div>
                   {recommendations.map((rec, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            list: rec.name,
                            detail: rec.detail || prev.detail,
                            picture: rec.picture || prev.picture
                          }));
                          setShowRecommendations(false);
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 text-left group"
                      >
                         {rec.picture ? (
                           <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-100 bg-zinc-50 shrink-0">
                              <img src={rec.picture} alt="" className="w-full h-full object-cover" />
                           </div>
                         ) : (
                           <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                              <ImageIcon className="h-4 w-4" />
                           </div>
                         )}
                         <div className="flex-1 overflow-hidden">
                            <p className="text-[11px] font-black uppercase text-[#0F1059] truncate group-hover:text-black">{rec.name}</p>
                            {rec.detail && <p className="text-[9px] text-zinc-400 font-medium truncate italic">{rec.detail}</p>}
                         </div>
                      </button>
                   ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('po.order_details')}</label>
              <textarea
                className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none min-h-[80px] focus:border-[#0F1059]/30 transition-all shadow-sm"
                value={formData.detail}
                onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('  quantity')}</label>
              <input
                type="number"
                className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/30 transition-all shadow-sm"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('po.order_date')}</label>
              <input
                type="date"
                className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/30 transition-all shadow-sm"
                value={formData.date_order}
                onChange={(e) => setFormData({ ...formData, date_order: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('po.reason')}</label>
              <select
                className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/30 transition-all shadow-sm cursor-pointer"
                value={formData.reason_order}
                onChange={(e) => setFormData({ ...formData, reason_order: e.target.value })}
              >
                <option value="">{locale === 'th' ? 'เลือกเหตุผลการจัดซื้อ' : 'Select Reason'}</option>
                <option value={t('po.reasons.deteriorate')}>{t('po.reasons.deteriorate')}</option>
                <option value={t('po.reasons.disappear')}>{t('po.reasons.disappear')}</option>
                <option value={t('po.reasons.lack_of_stock')}>{t('po.reasons.lack_of_stock')}</option>
                <option value={t('po.reasons.new_item')}>{t('po.reasons.new_item')}</option>
                {formData.reason_order && ![
                  t('po.reasons.deteriorate'), 
                  t('po.reasons.disappear'), 
                  t('po.reasons.lack_of_stock'), 
                  t('po.reasons.new_item'),
                  "ชำรุด", "สูญหาย", "ขาดสต๊อก", "ขอซื้อรายการใหม่"
                ].includes(formData.reason_order) && (
                  <option value={formData.reason_order} className="text-zinc-400">
                    {locale === 'th' ? '(อดีต) ' : '(Old) '} {formData.reason_order}
                  </option>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('po.buyer')}</label>
              <EmployeeSearchSelect
                value={formData.buyer}
                onChange={(val) => setFormData({ ...formData, buyer: val })}
                placeholder={t('requests.select_employee')}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{locale === 'th' ? 'ผู้ตรวจสอบ' : 'Reviewer'}</label>
              <EmployeeSearchSelect
                value={formData.reviewer}
                onChange={(val) => setFormData({ ...formData, reviewer: val })}
                placeholder={t('requests.select_employee')}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{locale === 'th' ? 'ผู้อนุมัติ' : 'Approver'}</label>
              <EmployeeSearchSelect
                value={formData.approver}
                onChange={(val) => setFormData({ ...formData, approver: val })}
                placeholder={t('requests.select_employee')}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('common.status')}</label>
              <select
                className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-black text-[#0F1059] uppercase outline-none focus:border-[#0F1059]/30 shadow-sm"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="PENDING">PENDING / {t('po.pending')}</option>
                <option value="ORDERED">ORDERED / {t('po.ordered')}</option>
                <option value="RECEIVED">RECEIVED / {t('po.received')}</option>
                <option value="CANCELLED">CANCELLED / {t('po.cancelled')}</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('po.image_attachment')}</label>
              <div className="flex flex-col gap-3">
                {formData.picture ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 group shadow-sm">
                    <img
                      src={formData.picture}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={removePicture}
                      className="absolute top-4 right-4 p-3 bg-rose-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-zinc-100 flex flex-col items-center justify-center gap-3 hover:bg-zinc-50 hover:border-[#0F1059]/20 transition-all text-zinc-300 group bg-white shadow-sm"
                  >
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-[#0F1059]" />
                    ) : (
                      <>
                        <div className="h-14 w-14 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                          <Upload className="w-6 h-6 group-hover:text-[#0F1059]" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t('po.click_upload')}</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleUpload}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-zinc-50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 h-12 rounded-lg text-[11px] font-black uppercase tracking-widest"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isUploading}
              className="flex-1 h-12 rounded-lg bg-[#0F1059] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#0F1059]/10"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('po.save_order')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={t('admin_tickets.export_report_title')}
      >
        <div className="space-y-6 font-sans">
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-4 shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-emerald-900 uppercase">{t('admin_tickets.export_settings')}</h3>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{locale === 'th' ? 'เลือกข้อมูลที่คุณต้องการดาวน์โหลด' : 'Select filters for your report'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{locale === 'th' ? 'วันที่เริ่ม' : 'Start Date'}</label>
                <input
                  type="date"
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none shadow-sm"
                  value={exportDateStart}
                  onChange={(e) => setExportDateStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{locale === 'th' ? 'วันที่สิ้นสุด' : 'End Date'}</label>
                <input
                  type="date"
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none shadow-sm"
                  value={exportDateEnd}
                  onChange={(e) => setExportDateEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100 space-y-2 shadow-sm">
              <p className="text-[10px] font-black text-zinc-400 uppercase">{t('admin_tickets.active_filters')}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white text-[#0F1059] border-zinc-100 text-[10px] uppercase rounded-lg">Status: {filterStatus}</Badge>
                {search && <Badge variant="outline" className="bg-white text-[#0F1059] border-zinc-100 text-[10px] uppercase rounded-lg">Search: {search}</Badge>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsExportModalOpen(false)} className="flex-1 h-12 rounded-lg text-[11px] font-black uppercase tracking-widest">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={processExport}
              className="flex-1 h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
            >
              {t('admin_tickets.download_excel')}
            </Button>
          </div>
        </div>
      </Modal>
      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={t('po.view_title') || "Purchase Order Details"}
      >
        {selectedOrder && (
          <div className="space-y-6 font-sans">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-zinc-100 pb-4">
               <div className="space-y-1">
                  <Badge variant="outline" className="bg-[#0F1059]/5 text-[#0F1059] border-[#0F1059]/10 font-black text-[10px] uppercase tracking-widest px-3 py-1">
                     {selectedOrder.po_code}
                  </Badge>
                  <h2 className="text-xl font-black text-[#0F1059] uppercase tracking-tight">{selectedOrder.list}</h2>
               </div>
               <Badge variant="outline"
                  className={cn("rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border-zinc-200 shadow-sm",
                    selectedOrder.status === "RECEIVED" ? "text-emerald-600 bg-emerald-50" :
                    selectedOrder.status === "PENDING" ? "text-amber-600 bg-amber-50" :
                    selectedOrder.status === "CANCELLED" ? "text-rose-600 bg-rose-50" : "text-blue-600 bg-blue-50"
                  )}
               >
                 {selectedOrder.status}
               </Badge>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  {/* Image */}
                  <div className="aspect-square rounded-2xl bg-zinc-50 border border-zinc-100 overflow-hidden group relative">
                     {selectedOrder.picture ? (
                        <img src={selectedOrder.picture} alt="" className="w-full h-full object-cover" />
                     ) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-300">
                           <ImageIcon className="h-12 w-12 mb-2" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">No Media Available</span>
                        </div>
                     )}
                     {selectedOrder.picture && (
                        <button onClick={() => window.open(selectedOrder.picture, '_blank')} className="absolute bottom-4 right-4 bg-white/90 backdrop-blur shadow-xl p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                           <Eye className="h-4 w-4 text-[#0F1059]" />
                        </button>
                     )}
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50/50 border border-zinc-100 space-y-3">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#0F1059]">
                           <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Order Date</p>
                           <p className="text-xs font-black text-[#0F1059]">{selectedOrder.date_order ? new Date(selectedOrder.date_order).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB') : '-'}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-amber-500">
                           <ShoppingCart className="h-4 w-4" />
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Quantity</p>
                           <p className="text-xs font-black text-[#0F1059]">{selectedOrder.quantity} <span className="text-[10px] text-zinc-300">UNITS</span></p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-5">
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Info className="h-3 w-3" /> Technical Details
                     </label>
                     <p className="text-sm font-medium text-zinc-700 bg-zinc-50 p-4 rounded-xl border border-zinc-100 min-h-[100px] leading-relaxed italic">
                        {selectedOrder.detail || "No additional technical details provided."}
                     </p>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText className="h-3 w-3" /> Purchase Reason
                     </label>
                     <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                        <p className="text-xs font-bold text-amber-700">{selectedOrder.reason_order || "N/A"}</p>
                     </div>
                  </div>

                  {/* Actors */}
                  <div className="grid grid-cols-1 gap-3 pt-4 border-t border-zinc-100">
                     <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/50 border border-zinc-100">
                        <div className="flex items-center gap-2">
                           <User className="h-3.5 w-3.5 text-zinc-400" />
                           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Buyer</span>
                        </div>
                        <span className="text-xs font-bold text-[#0F1059]">{selectedOrder.buyer || "-"}</span>
                     </div>
                     <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/50 border border-zinc-100">
                        <div className="flex items-center gap-2">
                           <User className="h-3.5 w-3.5 text-zinc-400" />
                           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Reviewer</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-600">{selectedOrder.reviewer || "-"}</span>
                     </div>
                     <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/50 border border-zinc-100">
                        <div className="flex items-center gap-2">
                           <User className="h-3.5 w-3.5 text-zinc-400" />
                           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Approver</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-600">{selectedOrder.approver || "-"}</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50/50 border border-zinc-100 mt-4 border-t-2 border-t-[#0F1059]/10">
               <div>
                 <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Created At</p>
                 <p className="text-[10px] font-bold text-zinc-500 italic">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB') : '-'}</p>
               </div>
               <div>
                 <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Last Updated</p>
                 <p className="text-[10px] font-bold text-zinc-500 italic">{selectedOrder.updatedAt ? new Date(selectedOrder.updatedAt).toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB') : '-'}</p>
               </div>
            </div>

            <div className="pt-6 flex gap-3">
               <Button onClick={() => setIsViewModalOpen(false)} className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-black text-white font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-[#0F1059]/20">
                  Close Details
               </Button>
               <Button onClick={() => { setIsViewModalOpen(false); openModal(selectedOrder); }} variant="outline" className="flex-1 h-12 rounded-xl border-zinc-200 font-black uppercase tracking-widest text-[11px] hover:bg-zinc-50 hover:text-[#0F1059] hover:border-[#0F1059]">
                  Edit Order Info
               </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
