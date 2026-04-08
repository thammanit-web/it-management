"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Edit2, Trash2, Box, Image as ImageIcon, ChevronUp, ChevronDown, FileSpreadsheet, Clock, Square, CheckSquare, CheckCircle2 } from "lucide-react";
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
import { bulkDeleteInventory, bulkUpdateInventoryStatus } from "@/lib/actions/bulk-actions";
import { useToast } from "@/components/ui/toast";

interface InventoryItem {
  id: string;
  equipment_entry_id: string;
  eq_code: string;
  payout_amount: number;
  remaining: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  equipmentEntry?: {
    list: string;
    item_type: string;
    brand_name?: string;
    unit?: string;
    date_received?: string;
    purchaseOrder?: {
      po_code: string;
      picture?: string;
      list?: string;
      detail?: string;
    }
  }
}

export default function InventoryPage() {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("AVAILABLE");
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Filters & Sorting logic states
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'eq_code',
    direction: 'asc'
  });

  // Export states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDateStart, setExportDateStart] = useState("");
  const [exportDateEnd, setExportDateEnd] = useState("");

  // Form
  const [formData, setFormData] = useState({
    remaining: 0,
    status: "AVAILABLE",
    payout_amount: 0
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/equipment-lists");
      const data = await res.json();
      if (Array.isArray(data)) setInventory(data);
    } catch (error) {
      console.error("Fetch error:", error);
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

  const filteredInventory = inventory
    .filter(item => {
      const searchTerm = search.toLowerCase();
      const itemName = (item.equipmentEntry?.list || "").toLowerCase();
      const brand = (item.equipmentEntry?.brand_name || "").toLowerCase();
      const poCode = (item.equipmentEntry?.purchaseOrder?.po_code || "").toLowerCase();
      const eqCode = (item.eq_code || "").toLowerCase();
      
      const matchesSearch = itemName.includes(searchTerm) || brand.includes(searchTerm) || poCode.includes(searchTerm) || eqCode.includes(searchTerm);
      const matchesStatus = filterStatus === "ALL" || item.status === filterStatus;
      const matchesCategory = filterCategory === "ALL" || item.equipmentEntry?.item_type === filterCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      let aValue: any = "";
      let bValue: any = "";

      if (sortConfig.key === 'eq_code') {
        aValue = a.eq_code || "";
        bValue = b.eq_code || "";
      } else if (sortConfig.key === 'item_name') {
        aValue = a.equipmentEntry?.list || "";
        bValue = b.equipmentEntry?.list || "";
      } else if (sortConfig.key === 'remaining') {
        aValue = a.remaining || 0;
        bValue = b.remaining || 0;
      } else if (sortConfig.key === 'item_type') {
        aValue = a.equipmentEntry?.item_type || "";
        bValue = b.equipmentEntry?.item_type || "";
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInventory.length && filteredInventory.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInventory.map(item => item.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(t('common.confirm_delete') + ` (${selectedIds.length} items)`)) return;

    setIsProcessingBulk(true);
    try {
      const res = await bulkDeleteInventory(selectedIds);
      if (res.success) {
        toast({ message: "Deleted successfully", variant: "success" });
        setSelectedIds([]);
        fetchInventory();
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
      const res = await bulkUpdateInventoryStatus(selectedIds, bulkStatus);
      if (res.success) {
        toast({ message: "Updated successfully", variant: "success" });
        setIsBulkEditModalOpen(false);
        setSelectedIds([]);
        fetchInventory();
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
    let dataToExport = filteredInventory;

    if (exportDateStart || exportDateEnd) {
      dataToExport = dataToExport.filter(item => {
        const receivedDate = item.equipmentEntry?.date_received ? new Date(item.equipmentEntry.date_received) : null;
        if (!receivedDate) return false;

        const start = exportDateStart ? new Date(exportDateStart) : null;
        const end = exportDateEnd ? new Date(exportDateEnd) : null;
        
        if (start && receivedDate < start) return false;
        if (end) {
          const endAdjusted = new Date(end);
          endAdjusted.setHours(23, 59, 59);
          if (receivedDate > endAdjusted) return false;
        }
        return true;
      });
    }

    if (dataToExport.length === 0) {
      alert("No data to export for the selected criteria.");
      return;
    }

    const worksheetData = dataToExport.map(item => ({
      "Asset Name": item.equipmentEntry?.list,
      "Brand": item.equipmentEntry?.brand_name,
      "Type": item.equipmentEntry?.item_type,
      "PO Number": item.equipmentEntry?.purchaseOrder?.po_code,
      "Remaining": item.remaining,
      "Unit": item.equipmentEntry?.unit,
      "Issued": item.payout_amount,
      "Status": item.status,
      "Received Date": item.equipmentEntry?.date_received ? new Date(item.equipmentEntry.date_received).toLocaleDateString('en-GB') : '-'
    }));

    await exportToExcel(worksheetData, `Inventory_Stock_${new Date().toISOString().split('T')[0]}`, "Stock");
    setIsExportModalOpen(false);
  };

  const openModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      remaining: item.remaining || 0,
      status: item.status || "AVAILABLE",
      payout_amount: item.payout_amount || 0
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/equipment-lists/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchInventory();
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
      const res = await fetch(`/api/equipment-lists/${id}`, { method: "DELETE" });
      if (res.ok) fetchInventory();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-3">
             <div className="h-10 w-10 rounded-lg bg-[#0F1059] flex items-center justify-center text-white shadow-sm border border-[#0F1059]/10">
                <Box className="h-5 w-5" />
             </div>
             {t('inventory.title')}
          </h1>
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest mt-1">{t('inventory.subtitle')}</p>
        </div>
        <Button 
             onClick={() => handleExportExcel()} 
             variant="outline"
             className="rounded-lg border-zinc-200 hover:border-[#0F1059] hover:text-[#0F1059] py-5 px-6 font-black uppercase tracking-widest text-[11px] transition-all"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> {t('admin_tickets.export_excel')}
          </Button>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center p-4 rounded-xl border border-zinc-100 bg-white/50 shadow-sm font-sans uppercase">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-lg border border-zinc-100 group focus-within:border-[#0F1059]/30 transition-all col-span-1 lg:col-span-2">
             <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-xs font-black uppercase w-full"
                placeholder={t('inventory.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-2.5 text-[10px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">{t('inventory.all_status')}</option>
          <option value="AVAILABLE">{t('inventory.available')}</option>
          <option value="LOW_STOCK">{t('inventory.low_stock')}</option>
          <option value="OUT_OF_STOCK">{t('inventory.out_of_stock')}</option>
          <option value="MAINTENANCE">{t('inventory.maintenance')}</option>
        </select>

        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-2.5 text-[10px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="ALL">{t('inventory.all_categories')}</option>
          <option value="Software">{t('categories.software') || 'Software'}</option>
          <option value="Hardware">{t('categories.hardware') || 'Hardware'}</option>
          <option value="Network">{t('categories.network') || 'Network'}</option>
          <option value="Printer">Printer</option>
          <option value="Mobile">Mobile</option>
        </select>
      </div>

      <Card className="rounded-xl border-zinc-100 overflow-hidden bg-white/90">
        <div className="overflow-x-auto">
          <Table className="w-full text-left font-sans">
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none">
                <TableHead className="w-12 px-4 py-5">
                   <button 
                     onClick={toggleSelectAll}
                     className="text-zinc-400 hover:text-[#0F1059] transition-colors"
                   >
                     {selectedIds.length === filteredInventory.length && filteredInventory.length > 0 ? (
                       <CheckSquare className="h-4 w-4 text-[#0F1059]" />
                     ) : (
                       <Square className="h-4 w-4" />
                     )}
                   </button>
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest w-24">{t('inventory.asset')}</TableHead>
                <TableHead 
                   className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('eq_code')}
                >
                  <div className="flex items-center gap-1">
                    {t('inventory.code') || 'CODE'}
                    {sortConfig.key === 'eq_code' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                   className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('item_name')}
                >
                  <div className="flex items-center gap-1">
                    {t('inventory.specifications')}
                    {sortConfig.key === 'item_name' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                   className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('item_type')}
                >
                  <div className="flex items-center gap-1">
                    {t('inventory.classification')}
                    {sortConfig.key === 'item_type' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                   className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('remaining')}
                >
                  <div className="flex items-center gap-1">
                    {t('inventory.stock_metrics')}
                    {sortConfig.key === 'remaining' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('common.status')}</TableHead>
                <TableHead className="p-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="h-24 animate-pulse bg-zinc-50/20" />
                  </TableRow>
                ))
              ) : filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-20 text-center text-zinc-400 italic font-bold uppercase tracking-widest">
                      {t('inventory.empty_warehouse')}
                  </TableCell>
                </TableRow>
              ) : filteredInventory.map((item) => (
                <TableRow key={item.id} className={cn("hover:bg-zinc-50/50 transition-colors group", selectedIds.includes(item.id) && "bg-[#0F1059]/5")}>
                  <TableCell className="px-4 py-4">
                     <button 
                       onClick={() => toggleSelect(item.id)}
                       className="text-zinc-400 hover:text-[#0F1059] transition-colors"
                     >
                       {selectedIds.includes(item.id) ? (
                         <CheckSquare className="h-4 w-4 text-[#0F1059]" />
                       ) : (
                         <Square className="h-4 w-4" />
                       )}
                     </button>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                      {item.equipmentEntry?.purchaseOrder?.picture ? (
                         <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shadow-sm">
                            <img src={item.equipmentEntry.purchaseOrder.picture} alt="" className="w-full h-full object-cover hover:scale-125 transition-transform duration-700" />
                         </div>
                      ) : (
                         <div className="w-14 h-14 rounded-lg bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-200 text-zinc-300"><ImageIcon className="w-6 h-6" /></div>
                      )}
                    </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-[9px] font-black text-[#0F1059] uppercase bg-[#0F1059]/5 px-2 py-1 rounded-lg w-fit border border-[#0F1059]/10 shadow-sm">
                         <Box className="h-2.5 w-2.5" /> {item.eq_code || 'NO-CODE'}
                      </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 min-w-[300px]">
                     <div className="space-y-1">
                        <div className="space-y-0.5">
                           <span className="text-[10px] font-black text-[#0F1059] uppercase tracking-wider">{item.equipmentEntry?.purchaseOrder?.list || 'General'}</span>
                           <div className="font-black text-zinc-900 uppercase tracking-tight text-sm leading-none">
                              {item.equipmentEntry?.list}
                           </div>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase mt-2">
                           <span>PO: {item.equipmentEntry?.purchaseOrder?.po_code}</span>
                           {item.equipmentEntry?.date_received && (
                              <div className="flex items-center gap-1">
                                 <Clock className="h-2.5 w-2.5" /> {new Date(item.equipmentEntry.date_received).toLocaleDateString('en-GB')}
                              </div>
                           )}
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-zinc-500 uppercase">
                      {item.equipmentEntry?.item_type}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                     <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                           <span className={cn("text-xl font-black tracking-tighter", item.remaining > 5 ? "text-emerald-600" : item.remaining > 0 ? "text-amber-500" : "text-rose-500")}>
                              {item.remaining}
                           </span>
                           <span className="text-[9px] font-black text-zinc-300 uppercase">/ {item.equipmentEntry?.unit || 'UNIT'}</span>
                        </div>
                        <div className="text-[8px] font-bold text-blue-500/60 uppercase">{t('inventory.issued')}: {item.payout_amount || 0}</div>
                     </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                     <Badge variant="outline" className={cn("rounded-lg px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border-zinc-200", item.remaining > 0 ? "text-emerald-600" : "text-rose-500")}>
                        {item.status === 'AVAILABLE' ? t('inventory.available') : 
                         item.status === 'LOW_STOCK' ? t('inventory.low_stock') :
                         item.status === 'OUT_OF_STOCK' ? t('inventory.out_of_stock') :
                         item.status === 'MAINTENANCE' ? t('inventory.maintenance') :
                         item.status === 'RESERVED' ? t('inventory.reserved') : (item.remaining > 0 ? t('inventory.available') : t('inventory.out_of_stock'))}
                     </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                     <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                        <button onClick={() => openModal(item)} className="p-2.5 rounded-lg bg-white border border-zinc-100 text-zinc-400 hover:text-[#0F1059] transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2.5 rounded-lg bg-white border border-zinc-100 text-zinc-400 hover:text-rose-600 transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={t('inventory.adjust_stock_title')}
      >
        <form onSubmit={handleSave} className="space-y-6 font-sans">
           <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100 shadow-sm">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{t('inventory.stock_item')}</p>
              <p className="text-sm font-bold text-[#0F1059]">{selectedItem?.equipmentEntry?.list}</p>
              
              {selectedItem && (
                 <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-zinc-200/50">
                    <div>
                       <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'วันที่สร้าง' : 'Created At'}</p>
                       <p className="text-[10px] font-bold text-zinc-600">{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB') : '-'}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'อัพเดตล่าสุด' : 'Updated At'}</p>
                       <p className="text-[10px] font-bold text-zinc-600">{selectedItem.updatedAt ? new Date(selectedItem.updatedAt).toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB') : '-'}</p>
                    </div>
                 </div>
              )}
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('inventory.remaining_stock')}</label>
                 <input 
                    type="number" 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/30 transition-all shadow-sm"
                     value={formData.remaining}
                     onChange={(e) => setFormData({...formData, remaining: parseInt(e.target.value) || 0})}
                  />
              </div>
               <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('inventory.amount_issued')}</label>
                  <input 
                     type="number" 
                     className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/30 transition-all shadow-sm"
                     value={formData.payout_amount}
                     onChange={(e) => setFormData({...formData, payout_amount: parseInt(e.target.value) || 0})}
                  />
               </div>
              <div className="space-y-1.5 col-span-2">
                 <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('inventory.status_override')}</label>
                 <select 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none cursor-pointer focus:border-[#0F1059]/30 transition-all shadow-sm"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                 >
                    <option value="AVAILABLE">{t('inventory.available')}</option>
                    <option value="LOW_STOCK">{t('inventory.low_stock')}</option>
                    <option value="OUT_OF_STOCK">{t('inventory.out_of_stock')}</option>
                    <option value="RESERVED">{t('inventory.reserved')}</option>
                    <option value="MAINTENANCE">{t('inventory.maintenance')}</option>
                 </select>
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
                disabled={isSaving}
                className="flex-1 h-12 rounded-lg bg-[#0F1059] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#0F1059]/10"
              >
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('inventory.verify_adjustments')}
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
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{locale === 'th' ? 'เลือกหัวข้อรายงานที่คุณต้องการ' : 'Select filters for your report'}</p>
             </div>
          </div>

          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{locale === 'th' ? 'วันที่เริ่ม (รับเข้า)' : 'Start Date (Received)'}</label>
                   <input 
                      type="date" 
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none shadow-sm"
                      value={exportDateStart}
                      onChange={(e) => setExportDateStart(e.target.value)}
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{locale === 'th' ? 'วันที่สิ้นสุด (รับเข้า)' : 'End Date (Received)'}</label>
                   <input 
                      type="date" 
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none shadow-sm"
                      value={exportDateEnd}
                      onChange={(e) => setExportDateEnd(e.target.value)}
                   />
                </div>
             </div>

             <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100 space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase">{t('admin_tickets.active_filters')}</p>
                <div className="flex flex-wrap gap-2">
                   <Badge variant="outline" className="bg-white text-[#0F1059] border-zinc-100 text-[10px] uppercase rounded-lg">Status: {filterStatus}</Badge>
                   <Badge variant="outline" className="bg-white text-[#0F1059] border-zinc-100 text-[10px] uppercase rounded-lg">Category: {filterCategory}</Badge>
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

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0F1059] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
           <div className="flex items-center gap-3 pr-6 border-r border-white/20">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-black text-xs">
                 {selectedIds.length}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Items Selected</span>
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
        title="Bulk Update Status"
      >
        <div className="space-y-6 font-sans">
           <div className="p-4 rounded-lg bg-[#0F1059]/5 border border-[#0F1059]/10 space-y-2">
              <p className="text-[10px] font-black text-[#0F1059] uppercase tracking-widest">Targeting {selectedIds.length} items</p>
              <p className="text-xs font-medium text-zinc-500 italic">Select a new status to apply to all selected records.</p>
           </div>

           <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('inventory.status_override')}</label>
              <select 
                 className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none cursor-pointer focus:border-[#0F1059]/30 transition-all shadow-sm"
                 value={bulkStatus}
                 onChange={(e) => setBulkStatus(e.target.value)}
              >
                 <option value="AVAILABLE">{t('inventory.available')}</option>
                 <option value="LOW_STOCK">{t('inventory.low_stock')}</option>
                 <option value="OUT_OF_STOCK">{t('inventory.out_of_stock')}</option>
                 <option value="RESERVED">{t('inventory.reserved')}</option>
                 <option value="MAINTENANCE">{t('inventory.maintenance')}</option>
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
    </div>
  );
}
