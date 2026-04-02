"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Edit2, Trash2, Box, Image as ImageIcon, ChevronUp, ChevronDown, FileSpreadsheet, Clock } from "lucide-react";
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
import { exportToExcel } from "@/lib/export-utils";
import { useTranslation } from "@/lib/i18n/LanguageContext";

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
    item_name: string;
    item_type: string;
    brand_name?: string;
    unit?: string;
    date_received?: string;
    purchaseOrder?: {
      po_number: string;
      picture?: string;
      list?: string;
      detail?: string;
    }
  }
}

export default function InventoryPage() {
  const { t, locale } = useTranslation();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters & Sorting logic states
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'item_name',
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
      const itemName = (item.equipmentEntry?.item_name || "").toLowerCase();
      const brand = (item.equipmentEntry?.brand_name || "").toLowerCase();
      const poNumber = (item.equipmentEntry?.purchaseOrder?.po_number || "").toLowerCase();
      
      const matchesSearch = itemName.includes(searchTerm) || brand.includes(searchTerm) || poNumber.includes(searchTerm);
      const matchesStatus = filterStatus === "ALL" || item.status === filterStatus;
      const matchesCategory = filterCategory === "ALL" || item.equipmentEntry?.item_type === filterCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      let aValue: any = "";
      let bValue: any = "";

      if (sortConfig.key === 'item_name') {
        aValue = a.equipmentEntry?.item_name || "";
        bValue = b.equipmentEntry?.item_name || "";
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
      "Asset Name": item.equipmentEntry?.item_name,
      "Brand": item.equipmentEntry?.brand_name,
      "Type": item.equipmentEntry?.item_type,
      "PO Number": item.equipmentEntry?.purchaseOrder?.po_number,
      "Remaining": item.remaining,
      "Unit": item.equipmentEntry?.unit,
      "Issued": item.payout_amount,
      "Status": item.status,
      "Received Date": item.equipmentEntry?.date_received ? new Date(item.equipmentEntry.date_received).toLocaleDateString('en-GB') : '-'
    }));

    await exportToExcel(worksheetData, `Inventory_Stock_${new Date().toISOString().split('T')[0]}`, "Stock");
    setIsExportModalOpen(false);
  };

  const openDrawer = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      remaining: item.remaining || 0,
      status: item.status || "AVAILABLE",
      payout_amount: item.payout_amount || 0
    });
    setIsDrawerOpen(true);
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
        setIsDrawerOpen(false);
        fetchInventory();
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/equipment-lists/${itemToDelete}`, { method: "DELETE" });
      if (res.ok) fetchInventory();
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase flex items-center gap-3">
             <div className="h-10 w-10 rounded-lg bg-[#0F1059] flex items-center justify-center text-white border border-slate-200 shadow-sm">
                <Box className="h-5 w-5" />
             </div>
             {t('inventory.title')}
          </h1>
          <p className="text-[12px] font-medium text-slate-500 uppercase tracking-widest mt-1">{t('inventory.subtitle')}</p>
        </div>
        <Button 
             onClick={() => handleExportExcel()} 
             variant="outline"
             className="rounded-lg border-slate-200 hover:border-[#0F1059] hover:text-[#0F1059] h-10 px-4 font-bold uppercase tracking-widest text-[11px] transition-all"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> {t('admin_tickets.export_excel')}
          </Button>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm font-sans uppercase">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 group focus-within:border-[#0F1059]/30 transition-all md:col-span-2">
             <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-sm font-bold uppercase w-full placeholder:text-slate-400"
                placeholder={t('inventory.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <select 
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold uppercase outline-none text-slate-600 focus:border-[#0F1059]/30 cursor-pointer"
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
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold uppercase outline-none text-slate-600 focus:border-[#0F1059]/30 cursor-pointer"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="ALL">{t('inventory.all_categories')}</option>
          <option value="Software">Software</option>
          <option value="Hardware">Hardware</option>
          <option value="Network">Network</option>
          <option value="Printer">Printer</option>
          <option value="Mobile">Mobile</option>
        </select>
      </div>

      <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full text-left">
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest w-24">{t('inventory.asset')}</TableHead>
                <TableHead 
                   className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                   onClick={() => handleSort('eq_code')}
                >
                  <div className="flex items-center gap-1">
                    {t('inventory.code') || 'CODE'}
                    {sortConfig.key === 'eq_code' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                   className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                   onClick={() => handleSort('item_name')}
                >
                  <div className="flex items-center gap-1">
                    {t('inventory.specifications')}
                    {sortConfig.key === 'item_name' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                   className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                   onClick={() => handleSort('item_type')}
                >
                  <div className="flex items-center gap-1">
                    {t('inventory.classification')}
                    {sortConfig.key === 'item_type' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                   className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                   onClick={() => handleSort('remaining')}
                >
                  <div className="flex items-center gap-1">
                    {t('inventory.stock_metrics')}
                    {sortConfig.key === 'remaining' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('common.status')}</TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="py-8 animate-pulse bg-slate-50/50" />
                  </TableRow>
                ))
              ) : filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center text-slate-400 italic font-bold uppercase tracking-widest">
                      {t('inventory.empty_warehouse')}
                  </TableCell>
                </TableRow>
              ) : filteredInventory.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                      {item.equipmentEntry?.purchaseOrder?.picture ? (
                         <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                            <img src={item.equipmentEntry.purchaseOrder.picture} alt="" className="w-full h-full object-cover" />
                         </div>
                      ) : (
                         <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center border border-dashed border-slate-200 text-slate-300"><ImageIcon className="w-5 h-5" /></div>
                      )}
                    </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-[#0F1059] uppercase bg-[#0F1059]/5 px-2 py-0.5 rounded border border-[#0F1059]/10">
                          {item.eq_code || 'NO-CODE'}
                      </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 min-w-[250px]">
                     <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{item.equipmentEntry?.purchaseOrder?.list || 'General'}</span>
                        <div className="font-bold text-slate-900 text-sm">{item.equipmentEntry?.item_name || '-'}</div>
                        <div className="text-[9px] text-slate-400 font-medium">PO: {item.equipmentEntry?.purchaseOrder?.po_number || '-'}</div>
                     </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap text-[11px] font-medium text-slate-500 uppercase">
                      {item.equipmentEntry?.item_type}
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <div className="flex items-baseline gap-1">
                        <span className={cn("text-lg font-bold", item.remaining > 5 ? "text-slate-900" : item.remaining > 0 ? "text-amber-600" : "text-rose-600")}>
                           {item.remaining}
                        </span>
                        <span className="text-[9px] font-bold text-slate-300 uppercase">/ {item.equipmentEntry?.unit || 'UNIT'}</span>
                     </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <Badge variant="outline" className={cn(
                       "rounded text-[9px] font-bold uppercase tracking-wider px-2 py-0 border-none",
                       item.remaining > 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                     )}>
                        {item.status === 'AVAILABLE' ? t('inventory.available') : 
                         item.status === 'LOW_STOCK' ? t('inventory.low_stock') :
                         item.status === 'OUT_OF_STOCK' ? t('inventory.out_of_stock') :
                         item.status === 'MAINTENANCE' ? t('inventory.maintenance') :
                         item.status === 'RESERVED' ? t('inventory.reserved') : (item.remaining > 0 ? t('inventory.available') : t('inventory.out_of_stock'))}
                     </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap text-right">
                     <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openDrawer(item)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#0F1059] transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { setItemToDelete(item.id); setIsDeleteModalOpen(true); }} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
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
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-xl" />
          ))
        ) : filteredInventory.length === 0 ? (
          <div className="py-10 text-center text-slate-400 italic">{t('inventory.empty_warehouse')}</div>
        ) : filteredInventory.map((item) => (
          <Card key={item.id} className="p-4 shadow-sm rounded-xl border border-slate-200 space-y-3 bg-white">
            <div className="flex gap-4">
              {item.equipmentEntry?.purchaseOrder?.picture ? (
                 <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                    <img src={item.equipmentEntry.purchaseOrder.picture} alt="" className="w-full h-full object-cover" />
                 </div>
              ) : (
                 <div className="w-20 h-20 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-dashed border-slate-200 text-slate-300"><ImageIcon className="w-8 h-8" /></div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                 <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                       <Badge variant="outline" className="text-[8px] font-bold uppercase py-0 border-slate-200 bg-slate-50 text-slate-500">{item.eq_code || 'NO-CODE'}</Badge>
                       <div className="flex gap-1">
                          <button onClick={() => openDrawer(item)} className="p-1.5 text-slate-400 hover:text-[#0F1059]"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setItemToDelete(item.id); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                       </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{item.equipmentEntry?.item_name || '-'}</h3>
                 </div>
                 <div className="flex items-end justify-between">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-medium text-slate-400 uppercase">{item.equipmentEntry?.item_type}</span>
                       <Badge className={cn("text-[8px] font-bold uppercase w-fit", item.remaining > 0 ? "bg-emerald-500" : "bg-rose-500")}>
                          {item.status === 'AVAILABLE' ? t('inventory.available') : item.status}
                       </Badge>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">{t('inventory.remaining_stock')}</p>
                       <p className="text-lg font-black text-[#0F1059] leading-none mt-1">{item.remaining} <span className="text-[9px] font-bold text-slate-300">/ {item.equipmentEntry?.unit || 'UNIT'}</span></p>
                    </div>
                 </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title={t('inventory.adjust_stock_title')}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-6">
           <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('inventory.stock_item')}</p>
              <p className="text-sm font-bold text-[#0F1059]">{selectedItem?.equipmentEntry?.item_name}</p>
              
              {selectedItem && (
                 <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200">
                    <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'วันที่สร้าง' : 'Created At'}</p>
                       <p className="text-[10px] font-bold text-slate-600">{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString('en-GB') : '-'}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'อัพเดตล่าสุด' : 'Updated At'}</p>
                       <p className="text-[10px] font-bold text-slate-600">{selectedItem.updatedAt ? new Date(selectedItem.updatedAt).toLocaleDateString('en-GB') : '-'}</p>
                    </div>
                 </div>
              )}
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('inventory.remaining_stock')}</label>
                 <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:border-[#0F1059]/30 transition-all"
                     value={formData.remaining}
                     onChange={(e) => setFormData({...formData, remaining: parseInt(e.target.value) || 0})}
                  />
              </div>
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('inventory.amount_issued')}</label>
                  <input 
                     type="number" 
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:border-[#0F1059]/30 transition-all"
                     value={formData.payout_amount}
                     onChange={(e) => setFormData({...formData, payout_amount: parseInt(e.target.value) || 0})}
                  />
               </div>
              <div className="space-y-1.5 col-span-1 sm:col-span-2">
                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('inventory.status_override')}</label>
                 <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none cursor-pointer focus:border-[#0F1059]/30 transition-all"
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

           <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
              <Button 
                 type="button" 
                 variant="ghost" 
                 onClick={() => setIsDrawerOpen(false)}
                 className="flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest"
              >
                 {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#0F1059]/10"
              >
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('inventory.verify_adjustments')}
              </Button>
           </div>
        </form>
      </Drawer>

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={t('admin_tickets.export_report_title')}
      >
        <div className="space-y-6 font-sans">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4 shadow-sm">
             <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
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
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                      value={exportDateStart}
                      onChange={(e) => setExportDateStart(e.target.value)}
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{locale === 'th' ? 'วันที่สิ้นสุด (รับเข้า)' : 'End Date (Received)'}</label>
                   <input 
                      type="date" 
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                      value={exportDateEnd}
                      onChange={(e) => setExportDateEnd(e.target.value)}
                   />
                </div>
             </div>

             <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase">{t('admin_tickets.active_filters')}</p>
                <div className="flex flex-wrap gap-2">
                   <Badge variant="outline" className="bg-white text-[#0F1059] border-zinc-100 text-[10px] uppercase">Status: {filterStatus}</Badge>
                   <Badge variant="outline" className="bg-white text-[#0F1059] border-zinc-100 text-[10px] uppercase">Category: {filterCategory}</Badge>
                   {search && <Badge variant="outline" className="bg-white text-[#0F1059] border-zinc-100 text-[10px] uppercase">Search: {search}</Badge>}
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
             <Button variant="ghost" onClick={() => setIsExportModalOpen(false)} className="flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest">
                {t('common.cancel')}
             </Button>
             <Button 
                onClick={processExport}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
             >
                {t('admin_tickets.download_excel')}
             </Button>
          </div>
        </div>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={locale === 'th' ? "ยืนยันการลบสินค้า" : "Confirm Delete Stock Item"}
        size="sm"
      >
        <div className="space-y-6 text-center shadow-none">
          <div className="mx-auto w-16 h-16 rounded-[24px] bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 mb-2">
            <Trash2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
               {locale === 'th' ? "ยอมรับการลบข้อมูล?" : "Are you sure?"}
            </h3>
            <p className="text-[13px] font-bold text-slate-400 mt-2 leading-relaxed uppercase tracking-widest">
               {locale === 'th' 
                 ? "ข้อมูลสินค้าในสต็อกนี้จะถูกลบลบถาวร" 
                 : "This action cannot be undone. This stock item will be permanently removed from inventory."}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="w-full h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-rose-500/20"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : (locale === 'th' ? "ยืนยันการลบ" : "Delete Permanently")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="w-full h-12 rounded-xl text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[11px]"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
