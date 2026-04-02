"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Plus, Edit2, Trash2, Truck, UserCheck, Calendar, Image as ImageIcon, ChevronUp, ChevronDown, FileSpreadsheet } from "lucide-react";
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
import { useSession } from "next-auth/react";
import { EmployeeSearchSelect } from "@/components/employee-search-select";

interface Employee {
  id: string;
  employee_name_th: string;
  employee_code: string;
  department?: string;
  position?: string;
}

interface Entry {
  id: string;
  purchase_id: string;
  list?: string;
  brand_name?: string;
  quantity: number;
  unit?: string;
  recipient?: string;
  date_received?: string;
  item_type?: string;
  purchaseOrder?: {
    po_code: string;
    list: string;
    picture?: string;
    status: string;
  }
  createdAt?: string;
  updatedAt?: string;
}

interface PO {
  id: string;
  list: string;
  quantity: number;
  status: string;
}

export default function EquipmentEntriesPage() {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pos, setPos] = useState<PO[]>([]);
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters & Sorting logic states
  const [filterType, setFilterType] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Entry; direction: 'asc' | 'desc' }>({
    key: 'date_received',
    direction: 'desc'
  });

  // Export states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDateStart, setExportDateStart] = useState("");
  const [exportDateEnd, setExportDateEnd] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    purchase_id: "",
    list: "",
    brand_name: "",
    quantity: 1,
    unit: "Unit",
    recipient: "",
    item_type: "MAIN",
    date_received: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchEntries();
    fetchPOs();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (error) {
       console.error("Fetch employees error:", error);
    }
  };

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/equipment-entry-lists");
      const data = await res.json();
      if (Array.isArray(data)) setEntries(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPOs = async () => {
    try {
      const res = await fetch("/api/equipment-purchase-orders");
      const data = await res.json();
      if (Array.isArray(data)) {
        setPos(data.sort((a: any, b: any) => {
           if (a.status === 'RECEIVED' && b.status !== 'RECEIVED') return 1;
           if (a.status !== 'RECEIVED' && b.status === 'RECEIVED') return -1;
           return 0;
        }));
      }
    } catch (error) {
       console.error("Fetch POs error:", error);
    }
  };

  const handlePOChange = (poId: string) => {
    const selectedPO = pos.find(p => p.id === poId);
    if (selectedPO) {
      setFormData({
        ...formData,
        purchase_id: poId,
        list: selectedPO.list,
        quantity: selectedPO.quantity
      });
    } else {
      setFormData({ ...formData, purchase_id: poId });
    }
  };

  const handleSort = (key: keyof Entry) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredEntries = entries
    .filter(entry => {
      const searchLow = search.toLowerCase();
      const matchesSearch = (entry.purchaseOrder?.list?.toLowerCase().includes(searchLow) ||
                           entry.list?.toLowerCase().includes(searchLow) ||
                           entry.recipient?.toLowerCase().includes(searchLow));
      
      const matchesType = filterType === "ALL" || entry.item_type === filterType;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const aValue = (a as any)[sortConfig.key] || "";
      const bValue = (b as any)[sortConfig.key] || "";
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleExportExcel = () => {
    setIsExportModalOpen(true);
  };

  const processExport = async () => {
    let dataToExport = filteredEntries;

    if (exportDateStart || exportDateEnd) {
      dataToExport = dataToExport.filter(e => {
        const date = e.date_received ? new Date(e.date_received) : new Date();
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

    const worksheetData = dataToExport.map(e => ({
      "PO Number": e.purchaseOrder?.po_code || 'INTERNAL',
      "Item Name": e.list || e.purchaseOrder?.list,
      "Brand": e.brand_name || '-',
      "Type": e.item_type,
      "Quantity": e.quantity,
      "Unit": e.unit,
      "Recipient": e.recipient,
      "Date Received": e.date_received ? new Date(e.date_received).toLocaleDateString('en-GB') : '-'
    }));

    await exportToExcel(worksheetData, `Equipment_Reception_${new Date().toISOString().split('T')[0]}`, "Inbound");
    setIsExportModalOpen(false);
  };

  const openDrawer = (entry?: Entry) => {
    if (entry) {
      setEditingId(entry.id);
      setSelectedEntry(entry);
      setFormData({
        purchase_id: entry.purchase_id || "",
        list: entry.list || "",
        brand_name: entry.brand_name || "",
        quantity: entry.quantity,
        unit: entry.unit || "Unit",
        recipient: entry.recipient || "",
        item_type: entry.item_type || "MAIN",
        date_received: entry.date_received ? new Date(entry.date_received).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingId(null);
      setSelectedEntry(null);
      setFormData({
        purchase_id: "",
        list: "",
        brand_name: "",
        quantity: 1,
        unit: "Unit",
        recipient: session?.user?.name || "",
        item_type: "MAIN",
        date_received: new Date().toISOString().split('T')[0]
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingId ? `/api/equipment-entry-lists/${editingId}` : "/api/equipment-entry-lists";
      const method = editingId ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsDrawerOpen(false);
        fetchEntries();
      } else {
         const err = await res.json();
         alert(err.error || "Failed to save entry");
      }
    } catch (error) {
       console.error("Save error:", error);
    } finally {
       setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/equipment-entry-lists/${entryToDelete}`, { method: "DELETE" });
      if (res.ok) fetchEntries();
      setIsDeleteModalOpen(false);
      setEntryToDelete(null);
    } catch (error) {
       console.error("Delete error:", error);
    } finally {
       setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase flex items-center gap-3">
             <div className="h-10 w-10 rounded-lg bg-[#0F1059] flex items-center justify-center text-white border border-slate-200 shadow-sm">
                <Truck className="h-5 w-5" />
             </div>
             {t('receiving.title')}
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">{t('receiving.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <Button 
             onClick={() => handleExportExcel()} 
             variant="outline"
             className="rounded-lg border-slate-200 hover:border-[#0F1059] hover:text-[#0F1059] h-10 px-4 font-bold uppercase tracking-widest text-[11px] transition-all"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> {t('admin_tickets.export_excel')}
          </Button>
          <Button onClick={() => openDrawer()} className="rounded-lg bg-[#0F1059] hover:bg-black h-10 px-4 font-bold uppercase tracking-widest text-[11px] transition-all shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> {t('receiving.new_reception')}
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm font-sans uppercase">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 group focus-within:border-[#0F1059]/30 transition-all md:col-span-3">
             <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-sm font-bold uppercase w-full placeholder:text-slate-400"
                placeholder={t('receiving.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <select 
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold uppercase outline-none text-slate-600 focus:border-[#0F1059]/30 cursor-pointer transition-all"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="ALL">{t('receiving.all_types')}</option>
          <option value="MAIN">{t('receiving.main_hw')}</option>
          <option value="PERIPHERAL">{t('receiving.peripheral')}</option>
          <option value="CONSUMABLE">{t('receiving.consumable')}</option>
          <option value="SOFTWARE">{t('receiving.software_license')}</option>
          <option value="OTHER">{t('receiving.other')}</option>
        </select>
      </div>

      <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full text-left">
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest w-24">{t('po.media')}</TableHead>
                <TableHead 
                  className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('list')}
                >
                  <div className="flex items-center gap-1">
                    {t('receiving.entry_details')}
                    {sortConfig.key === 'list' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('receiving.classification')}</TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('receiving.recipient')}</TableHead>
                <TableHead 
                   className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center cursor-pointer hover:bg-slate-100 transition-colors"
                   onClick={() => handleSort('quantity')}
                >
                   <div className="flex items-center justify-center gap-1">
                      {t('po.quantity')}
                      {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                   </div>
                </TableHead>
                <TableHead 
                   className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                   onClick={() => handleSort('date_received')}
                >
                   <div className="flex items-center gap-1">
                      {t('receiving.received_at')}
                      {sortConfig.key === 'date_received' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                   </div>
                </TableHead>
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
              ) : filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center text-slate-400 italic font-bold uppercase tracking-widest">
                      {t('receiving.no_records_found')}
                  </TableCell>
                </TableRow>
              ) : filteredEntries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="py-3 px-4 whitespace-nowrap text-center">
                    {entry.purchaseOrder?.picture ? (
                       <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-slate-200 shadow-sm mx-auto">
                          <img 
                            src={entry.purchaseOrder.picture} 
                            alt={entry.list || entry.purchaseOrder.list} 
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => window.open(entry.purchaseOrder?.picture, '_blank')}
                          />
                       </div>
                    ) : (
                       <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center border border-dashed border-slate-200 text-slate-300 mx-auto">
                          <ImageIcon className="w-5 h-5" />
                       </div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900 text-sm leading-tight">
                       {entry.list || entry.purchaseOrder?.list}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                       <Badge variant="outline" className="text-[9px] font-bold uppercase px-1.5 py-0 border-slate-200 bg-slate-50 text-slate-400">
                          {entry.purchaseOrder?.po_code || 'INTERNAL'}
                       </Badge>
                       <span className="text-[10px] font-bold text-amber-600 uppercase">
                           {entry.brand_name || '-'}
                       </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <Badge variant="outline" className={cn(
                      "rounded text-[9px] font-bold uppercase tracking-wider px-2 py-0 border-none",
                      entry.item_type === "MAIN" ? "text-blue-600 bg-blue-50" :
                      entry.item_type === "PERIPHERAL" ? "text-purple-600 bg-purple-50" :
                      entry.item_type === "CONSUMABLE" ? "text-amber-600 bg-amber-50" :
                      entry.item_type === "SOFTWARE" ? "text-teal-600 bg-teal-50" :
                      "text-slate-500 bg-slate-50"
                    )}>
                      {entry.item_type || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5 text-slate-300" />
                        <span className="text-sm font-medium text-slate-600">{entry.recipient || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap text-center">
                    <span className="text-sm font-bold text-slate-900">{entry.quantity}</span>
                    <span className="text-[10px] text-slate-400 font-medium ml-1">{entry.unit || t('po.units')}</span>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                       <Calendar className="h-3.5 w-3.5 text-slate-300" />
                       {entry.date_received ? new Date(entry.date_received).toLocaleDateString('en-GB') : '-'}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openDrawer(entry)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#0F1059] transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEntryToDelete(entry.id); setIsDeleteModalOpen(true); }} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
            <div key={i} className="h-28 bg-slate-50 animate-pulse rounded-xl" />
          ))
        ) : filteredEntries.length === 0 ? (
          <div className="py-10 text-center text-slate-400 italic">{t('receiving.no_records_found')}</div>
        ) : filteredEntries.map((entry) => (
          <Card key={entry.id} className="p-4 shadow-sm rounded-xl border border-slate-200 space-y-3 bg-white">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                {entry.purchaseOrder?.picture ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-slate-200 shadow-sm">
                    <img src={entry.purchaseOrder.picture} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center border border-dashed border-slate-200 text-slate-300">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{entry.purchaseOrder?.po_code || 'INTERNAL'}</p>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{entry.list || entry.purchaseOrder?.list}</h3>
                </div>
              </div>
              <Badge variant="outline" className="rounded text-[9px] font-bold uppercase tracking-wider py-0 border-none bg-slate-50 text-slate-500">
                {entry.item_type || '-'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px] pt-3 border-t border-slate-100">
               <div className="space-y-0.5">
                 <p className="text-[9px] font-bold text-slate-400 uppercase">{t('po.quantity')}</p>
                 <p className="font-bold text-slate-700">{entry.quantity} {entry.unit}</p>
               </div>
               <div className="space-y-0.5 text-right">
                 <p className="text-[9px] font-bold text-slate-400 uppercase">{t('receiving.recipient')}</p>
                 <p className="font-bold text-slate-700 truncate">{entry.recipient || '-'}</p>
               </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold">{entry.date_received ? new Date(entry.date_received).toLocaleDateString('en-GB') : '-'}</span>
              <div className="flex gap-1">
                <button onClick={() => openDrawer(entry)} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-400"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => { setEntryToDelete(entry.id); setIsDeleteModalOpen(true); }} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title={editingId ? t('receiving.edit_title') : t('receiving.new_title')}
        size="xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
           {selectedEntry && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{locale === 'th' ? 'วันที่สร้าง' : 'Created At'}</label>
                    <p className="text-xs font-bold text-slate-700">{selectedEntry.createdAt ? new Date(selectedEntry.createdAt).toLocaleString('en-GB') : '-'}</p>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{locale === 'th' ? 'อัพเดตล่าสุด' : 'Updated At'}</label>
                    <p className="text-xs font-bold text-slate-700">{selectedEntry.updatedAt ? new Date(selectedEntry.updatedAt).toLocaleString('en-GB') : '-'}</p>
                 </div>
              </div>
           )}
           <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('receiving.po_source')}</label>
              <select 
                 required
                 className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold text-[#0F1059] uppercase outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm cursor-pointer"
                 value={formData.purchase_id}
                 onChange={(e) => handlePOChange(e.target.value)}
              >
                 <option value="">-- SELECT PURCHASE ORDER --</option>
                  {pos
                    .filter(po => po.status !== 'RECEIVED' || po.id === formData.purchase_id)
                    .map(po => (
                     <option key={po.id} value={po.id}>
                        {po.status === 'RECEIVED' ? '[✓ RECEIVED] ' : `[STATUS: ${po.status}] `} {po.list}
                     </option>
                  ))}
              </select>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 col-span-2">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('receiving.final_item_name')}</label>
                 <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
                    value={formData.list}
                    onChange={(e) => setFormData({...formData, list: e.target.value})}
                    placeholder="Specific name if different from PO..."
                 />
              </div>
              <div className="space-y-1.5 font-sans">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('receiving.brand_name')}</label>
                 <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
                    value={formData.brand_name}
                    onChange={(e) => setFormData({...formData, brand_name: e.target.value})}
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('receiving.classification')}</label>
                 <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 uppercase outline-none focus:border-[#0F1059]/30 shadow-sm"
                    value={formData.item_type}
                    onChange={(e) => setFormData({...formData, item_type: e.target.value})}
                 >
                    <option value="MAIN">{t('receiving.main_hw')}</option>
                    <option value="PERIPHERAL">{t('receiving.peripheral')}</option>
                    <option value="CONSUMABLE">{t('receiving.consumable')}</option>
                    <option value="SOFTWARE">{t('receiving.software_license')}</option>
                    <option value="OTHER">{t('receiving.other')}</option>
                 </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('po.quantity')}</label>
                 <input 
                    type="number"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold text-[#0F1059] outline-none focus:border-[#0F1059]/30 shadow-sm"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('receiving.unit_of_measure')}</label>
                 <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/30 shadow-sm"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="Each, Set, Unit..."
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('receiving.receiver')}</label>
                 <EmployeeSearchSelect 
                    value={formData.recipient}
                    employees={employees}
                    onChange={(val) => setFormData({...formData, recipient: val})}
                    placeholder={t('requests.select_employee') || 'Search receiver...'}
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('receiving.inbound_date')}</label>
                 <input 
                    type="date"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/30 shadow-sm"
                    value={formData.date_received}
                    onChange={(e) => setFormData({...formData, date_received: e.target.value})}
                 />
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
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('receiving.complete_reception')}
              </Button>
           </div>
        </form>
      </Drawer>

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={t('admin_tickets.export_report_title')}
      >
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
             <div className="h-12 w-12 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <FileSpreadsheet className="h-6 w-6" />
             </div>
             <div>
                <h3 className="text-sm font-bold text-emerald-900 uppercase">{t('admin_tickets.export_settings')}</h3>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{locale === 'th' ? 'เลือกข้อมูลที่คุณต้องการรายงาน' : 'Select filters for your report'}</p>
             </div>
          </div>

          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{locale === 'th' ? 'วันที่เริ่ม' : 'Start Date'}</label>
                   <input 
                      type="date" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none"
                      value={exportDateStart}
                      onChange={(e) => setExportDateStart(e.target.value)}
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{locale === 'th' ? 'วันที่สิ้นสุด' : 'End Date'}</label>
                   <input 
                      type="date" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none"
                      value={exportDateEnd}
                      onChange={(e) => setExportDateEnd(e.target.value)}
                   />
                </div>
             </div>

             <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">{t('admin_tickets.active_filters')}</p>
                <div className="flex flex-wrap gap-2">
                   <Badge variant="outline" className="bg-white text-[#0F1059] border-slate-200 text-[9px] uppercase font-bold tracking-wider">Type: {filterType}</Badge>
                   {search && <Badge variant="outline" className="bg-white text-[#0F1059] border-slate-200 text-[9px] uppercase font-bold tracking-wider">Search: {search}</Badge>}
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
        title={locale === 'th' ? "ยืนยันการลบข้อมูลการรับของ" : "Confirm Delete Reception Record"}
        size="sm"
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-[24px] bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 mb-2">
            <Trash2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              {locale === 'th' ? "ยอมรับการลบข้อมูล?" : "Are you sure?"}
            </h3>
            <p className="text-[13px] font-bold text-slate-400 mt-2 leading-relaxed uppercase tracking-widest">
              {locale === 'th' 
                ? "ข้อมูลการรับอุปกรณ์นี้จะถูกลบลบถาวร" 
                : "This action cannot be undone. This reception record will be permanently removed."}
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
