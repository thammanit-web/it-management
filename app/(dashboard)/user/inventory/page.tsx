"use client";

import React, { useState, useEffect } from "react";
import { Search, CheckCircle2, Box, Image as ImageIcon, ChevronUp, ChevronDown, ShoppingBag } from "lucide-react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface InventoryItem {
  id: string;
  equipment_entry_id: string;
  eq_code: string;
  payout_amount: number;
  remaining: number;
  status: string;
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

export default function UserInventoryPage() {
  const { t, locale } = useTranslation();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);

  // Filters & Sorting logic states
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'item_name',
    direction: 'asc'
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
      const listName = (item.equipmentEntry?.purchaseOrder?.list || "").toLowerCase();
      
      const matchesSearch = itemName.includes(searchTerm) || brand.includes(searchTerm) || listName.includes(searchTerm);
      const matchesStatus = filterStatus === "ALL" || 
                           (filterStatus === "OUT_OF_STOCK" && item.remaining === 0) || 
                           (filterStatus === "AVAILABLE" && item.remaining > 0);
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

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'MAIN': return t('receiving.main_hw');
      case 'PERIPHERAL': return t('receiving.peripheral');
      case 'CONSUMABLE': return t('receiving.consumable');
      case 'SOFTWARE':
      case 'SOFTWARE_LICENSE': return t('receiving.software_license');
      case 'OTHER': return t('receiving.other');
      default: return type;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F1059] tracking-tight uppercase flex items-center gap-3">
             <div className="h-10 w-10 rounded-lg bg-[#0F1059] flex items-center justify-center text-white shadow-sm border border-[#0F1059]/10">
                <Box className="h-5 w-5" />
             </div>
             {t('sidebar.inventory')}
          </h1>
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest mt-1">
            {locale === 'th' ? "ตรวจสอบอุปกรณ์ในคลังที่พร้อมเบิก" : "View and check available items in stock"}
          </p>
        </div>
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         <Card className="p-4 flex items-center gap-4 border-zinc-100 bg-white/50 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
               <Box className="h-6 w-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">{t('common.total')}</p>
               <p className="text-xl font-black text-[#0F1059]">{inventory.length}</p>
            </div>
         </Card>
         <Card className="p-4 flex items-center gap-4 border-zinc-100 bg-white/50 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
               <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">{t('inventory.available')}</p>
               <p className="text-xl font-black text-emerald-600">{inventory.filter(i => i.remaining > 0).length}</p>
            </div>
         </Card>
         <Card className="p-4 flex items-center gap-4 border-zinc-100 bg-white/50 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
               <ImageIcon className="h-6 w-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">{t('inventory.out_of_stock')}</p>
               <p className="text-xl font-black text-rose-600">{inventory.filter(i => i.remaining === 0).length}</p>
            </div>
         </Card>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center p-4 rounded-xl border border-zinc-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100 group focus-within:border-[#0F1059]/30 transition-all col-span-1 lg:col-span-2">
             <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-xs font-black uppercase w-full placeholder:text-zinc-300"
                placeholder={t('inventory.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">{t('inventory.all_status')}</option>
          <option value="AVAILABLE">{t('inventory.available')}</option>
          <option value="OUT_OF_STOCK">{t('inventory.out_of_stock')}</option>
        </select>

        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="ALL">{t('inventory.all_categories')}</option>
          <option value="MAIN">{t('receiving.main_hw')}</option>
          <option value="PERIPHERAL">{t('receiving.peripheral')}</option>
          <option value="CONSUMABLE">{t('receiving.consumable')}</option>
          <option value="SOFTWARE_LICENSE">{t('receiving.software_license')}</option>
        </select>
      </div>

      <Card className="rounded-xl border-zinc-100 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full text-left">
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none">
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest w-24">{t('inventory.asset')}</TableHead>
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
                   className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors text-center"
                   onClick={() => handleSort('remaining')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t('inventory.stock_count')}
                    {sortConfig.key === 'remaining' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest text-center">{t('common.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-24 animate-pulse bg-zinc-50/20" />
                  </TableRow>
                ))
              ) : filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-20 text-center text-zinc-400 italic font-black uppercase tracking-widest">
                      {t('inventory.empty_warehouse')}
                  </TableCell>
                </TableRow>
              ) : filteredInventory.map((item) => (
                <TableRow key={item.id} onClick={() => setViewingItem(item)} className="hover:bg-zinc-50/50 transition-colors group cursor-pointer">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                      {item.equipmentEntry?.purchaseOrder?.picture ? (
                         <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-sm transition-transform duration-500 group-hover:scale-105">
                            <img src={item.equipmentEntry.purchaseOrder.picture} alt="" className="w-full h-full object-cover" />
                         </div>
                      ) : (
                         <div className="w-14 h-14 rounded-xl bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-200 text-zinc-300"><ImageIcon className="w-6 h-6" /></div>
                      )}
                    </TableCell>
                  <TableCell className="px-6 py-4 min-w-[250px]">
                     <div className="space-y-1">
                        <div className="space-y-0.5">
                           <span className="text-[9px] font-black text-[#0F1059] uppercase tracking-widest opacity-60">{item.equipmentEntry?.brand_name || t('borrow.generic_brand')}</span>
                           <div className="font-black text-[#0F1059] uppercase tracking-tight text-sm leading-none">
                              {item.equipmentEntry?.item_name}
                           </div>
                        </div>
                        {item.equipmentEntry?.purchaseOrder?.list && (
                          <p className="text-[10px] font-bold text-zinc-400 uppercase leading-none mt-1 line-clamp-1">{item.equipmentEntry.purchaseOrder.list}</p>
                        )}
                     </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-zinc-500 uppercase">
                      {getItemTypeLabel(item.equipmentEntry?.item_type || '')}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                         <span className={cn("text-lg font-black tracking-tighter leading-none", item.remaining > 5 ? "text-emerald-600" : item.remaining > 0 ? "text-amber-500" : "text-rose-500")}>
                            {item.remaining}
                         </span>
                         <span className="text-[8px] font-black text-zinc-300 uppercase mt-0.5">{item.equipmentEntry?.unit || 'UNIT'}</span>
                      </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                     <Badge variant={item.remaining > 0 ? "success" : "danger"} className="rounded-lg px-2.5 py-1 text-[8px] font-black uppercase tracking-widest">
                        {item.remaining > 0 ? t('inventory.available') : t('inventory.out_of_stock')}
                     </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Equipment Specs Modal (Reuse from borrow page logic) */}
      <Modal 
        isOpen={!!viewingItem} 
        onClose={() => setViewingItem(null)} 
        title={t('borrow.technical_spec')}
        size="lg"
      >
        <div className="space-y-4">
           {viewingItem?.equipmentEntry?.purchaseOrder?.picture ? (
              <div className="w-full h-64 rounded-xl overflow-hidden bg-secondary/30 border border-zinc-100 flex items-center justify-center shadow-inner">
                 <img src={viewingItem.equipmentEntry.purchaseOrder.picture} alt="" className="max-w-full max-h-full object-contain" />
              </div>
           ) : (
              <div className="w-full h-48 rounded-xl bg-secondary/20 flex items-center justify-center border border-dashed border-zinc-200 text-accent">
                 <ShoppingBag className="h-10 w-10 opacity-20" />
              </div>
           )}

           <div className="space-y-3">
              <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{viewingItem?.equipmentEntry?.brand_name || t('borrow.generic_brand')}</span>
                    <Badge variant="secondary" className="rounded-lg text-[9px] font-black uppercase bg-primary/5 text-primary border-none">
                       {viewingItem?.equipmentEntry?.item_type && getItemTypeLabel(viewingItem.equipmentEntry.item_type)}
                    </Badge>
                 </div>
                 <h3 className="text-xl font-black text-[#0F1059] uppercase tracking-tight">{viewingItem?.equipmentEntry?.item_name}</h3>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 min-h-[100px] shadow-sm">
                 <p className="text-[14px] font-medium text-zinc-600 leading-relaxed italic whitespace-pre-line">
                    {viewingItem?.equipmentEntry?.purchaseOrder?.detail || t('borrow.no_additional_specs')}
                 </p>
              </div>

              <div className="flex items-center gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                 <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <Box className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase leading-none mb-1">{t('inventory.stock_count')}</p>
                    <p className="text-xl font-black text-[#0F1059] leading-none">
                       {viewingItem?.remaining} <span className="text-[11px] uppercase font-bold text-zinc-400 ml-1">{viewingItem?.equipmentEntry?.unit || 'Units'}</span>
                    </p>
                 </div>
              </div>
           </div>

           <div className="pt-2">
              <Button onClick={() => setViewingItem(null)} variant="ghost" className="w-full h-12 rounded-xl text-zinc-500 text-[11px] font-black uppercase tracking-widest bg-zinc-100 active:scale-95 transition-all">
                {t('common.close')}
              </Button>
           </div>
        </div>
      </Modal>
    </div>
  );
}
