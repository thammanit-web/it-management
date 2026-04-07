"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Package, User2, Edit2, Trash2, ChevronUp, ChevronDown, FileSpreadsheet } from "lucide-react";
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
import { exportToExcel } from "@/lib/export-utils";
import { PDFViewer } from "@react-pdf/renderer";
import { BorrowRequisitionPDF } from "@/lib/pdf/BorrowRequisitionPDF";
import { Eye } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { EmployeeSearchSelect } from "@/components/employee-search-select";

interface BorrowGroup {
  id: string;
  group_code: string;
  reason?: string;
  approval?: string;
  approval_status: string;
  approval_comment?: string;
  it_approval?: string;
  it_approval_status: string;
  it_approval_comment?: string;
  approval_date?: string;
  it_approval_date?: string;
  date_needed?: string;
  createdAt: string;
  requests: Array<{
    id: string;
    equipment_code: string;
    quantity: number;
    borrow_type: string;
    remarks: string;
    equipmentList?: {
      equipmentEntry?: {
        list: string;
        item_name: string;
        item_type: string;
      }
    }
  }>;
  user?: {
    username: string;
    employee?: {
      employee_name_th: string;
      employee_code: string;
    }
  }
}

interface Equipment {
  id: string;
  remaining: number;
  equipmentEntry?: {
    list: string;
    item_name?: string;
  }
}

interface User {
  id: string;
  username: string;
}

interface Employee {
  id: string;
  employee_name_th: string;
  employee_code: string;
  department?: string;
  position?: string;
}

export default function AdminEquipmentRequestsPage() {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [requests, setRequests] = useState<BorrowGroup[]>([]);
  const [inventory, setInventory] = useState<Equipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<BorrowGroup | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<BorrowGroup | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filters & Sorting logic states
  const [filterItStatus, setFilterItStatus] = useState("ALL");
  const [filterDeptStatus, setFilterDeptStatus] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof BorrowGroup; direction: 'asc' | 'desc' }>({
    key: 'group_code',
    direction: 'asc'
  });

  // Export states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDateStart, setExportDateStart] = useState("");
  const [exportDateEnd, setExportDateEnd] = useState("");

  const [formData, setFormData] = useState({
    userId: "",
    equipment_list_id: "",
    quantity: 1,
    reason: "",
    approval: "",
    approval_status: "PENDING",
    approval_comment: "",
    it_approval: "",
    it_approval_status: "PENDING",
    it_approval_comment: ""
  });

  useEffect(() => {
    fetchRequests();
    fetchInventory();
    fetchUsers();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/equipment-requests");
      const data = await res.json();
      if (Array.isArray(data)) setRequests(data);
    } catch (error) {
      console.error("Fetch requests error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/equipment-lists");
      const data = await res.json();
      if (Array.isArray(data)) setInventory(data);
    } catch (error) {
       console.error("Fetch inventory error:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (error) {
       console.error("Fetch users error:", error);
    }
  };



  const handleSort = (key: keyof BorrowGroup) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredRequests = requests
    .filter(g => {
      const searchLow = search.toLowerCase();
      const matchesSearch = (g.user?.username || "").toLowerCase().includes(searchLow) ||
                           (g.user?.employee?.employee_name_th || "").toLowerCase().includes(searchLow) ||
                           (g.group_code || "").toLowerCase().includes(searchLow) ||
                           g.requests.some(r => 
                              (r.equipmentList?.equipmentEntry?.item_name || "").toLowerCase().includes(searchLow) ||
                              (r.equipmentList?.equipmentEntry?.list || "").toLowerCase().includes(searchLow)
                           );
      
      const matchesItStatus = filterItStatus === "ALL" || g.it_approval_status === filterItStatus;
      const matchesDeptStatus = filterDeptStatus === "ALL" || g.approval_status === filterDeptStatus;
      
      return matchesSearch && matchesItStatus && matchesDeptStatus;
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
    let groupsToExport = filteredRequests;

    if (exportDateStart || exportDateEnd) {
      groupsToExport = groupsToExport.filter(g => {
        const date = new Date(g.createdAt);
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

    if (groupsToExport.length === 0) {
      alert("No data to export for the selected criteria.");
      return;
    }

    const flatRows: any[] = [];
    groupsToExport.forEach(g => {
       g.requests.forEach(r => {
          flatRows.push({
            "Group Code": g.group_code,
            "Date": new Date(g.createdAt).toLocaleDateString('en-GB'),
            "Requester": g.user?.employee?.employee_name_th || g.user?.username,
            "Item": r.equipmentList?.equipmentEntry?.list || r.equipmentList?.equipmentEntry?.item_name,
            "Code": r.equipment_code,
            "Qty": r.quantity,
            "Type": r.borrow_type,
            "Dept Status": g.approval_status,
            "Dept Approver": g.approval,
            "IT Status": g.it_approval_status,
            "IT Auditor": g.it_approval,
            "Group Reason": g.reason,
            "Item Remarks": r.remarks
          });
       });
    });

    await exportToExcel(flatRows, `Batch_Borrowing_Requests_${new Date().toISOString().split('T')[0]}`, "Requests");
    setIsExportModalOpen(false);
  };

  const openModal = (group?: BorrowGroup) => {
    if (group) {
      setEditingId(group.id);
      setSelectedGroup(group);
      setFormData({
        userId: group.user?.username || "", 
        equipment_list_id: "BATCH",
        quantity: group.requests.reduce((acc, r) => acc + r.quantity, 0),
        reason: group.reason || "",
        approval: group.approval || "",
        approval_status: group.approval_status || "PENDING",
        approval_comment: group.approval_comment || "",
        it_approval: group.it_approval || "",
        it_approval_status: group.it_approval_status || "PENDING",
        it_approval_comment: group.it_approval_comment || ""
      } as any);
    } else {
      setEditingId(null);
      setSelectedGroup(null);
      setFormData({
        userId: "",
        equipment_list_id: "",
        quantity: 1,
        reason: "",
        approval: "",
        approval_status: "PENDING",
        approval_comment: "",
        it_approval: "",
        it_approval_status: "PENDING",
        it_approval_comment: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingId ? `/api/equipment-requests/${editingId}` : "/api/equipment-requests";
      const method = editingId ? "PATCH" : "POST";
      
      let payload: any;
      if (editingId) {
        payload = {
          approval_status: formData.approval_status,
          approval_comment: formData.approval_comment,
          it_approval_status: formData.it_approval_status,
          it_approval_comment: formData.it_approval_comment,
          approval: formData.approval || (session?.user?.name || "Dept Reviewer"),
          it_approval: formData.it_approval || (session?.user?.name || "IT Admin")
        };
      } else {
        payload = {
          reason: formData.reason,
          approval: formData.approval || "Admin Internal",
          items: [
            {
              equipmentListId: formData.equipment_list_id,
              quantity: formData.quantity,
              borrow_type: "NEW",
              remarks: "Manual entry by Admin"
            }
          ]
        };
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchRequests();
      } else {
         const err = await res.json();
         alert(err.error || "Failed to save request");
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatusInline = async (id: string, field: string, status: string) => {
    try {
      const payload: any = {};
      payload[field] = status;
      if (field === 'it_approval_status') {
         payload.it_approval = session?.user?.name || "IT Admin";
      } else {
         payload.approval = session?.user?.name || "Supervisor";
      }

      const res = await fetch(`/api/equipment-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) fetchRequests();
    } catch (error) {
      console.error("Quick status update error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm_delete'))) return;
    try {
      const res = await fetch(`/api/equipment-requests/${id}`, { method: "DELETE" });
      if (res.ok) fetchRequests();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#0F1059] tracking-tighter uppercase leading-none flex items-center gap-3">
             <div className="h-12 w-12 rounded-lg bg-[#0F1059] flex items-center justify-center text-white border border-[#0F1059]/10 shadow-sm">
                <Package className="h-6 w-6" />
             </div>
             {t('borrowing.title')}
          </h1>
          <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-widest mt-2">{t('borrowing.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
             onClick={() => handleExportExcel()} 
             variant="outline"
             className="rounded-lg border-zinc-200 hover:border-[#0F1059] hover:text-[#0F1059] py-5 px-6 font-black uppercase tracking-widest text-[11px] h-12 transition-all shadow-sm"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> {t('admin_tickets.export_excel')}
          </Button>
          <Button onClick={() => openModal()} className="rounded-lg bg-[#0F1059] hover:bg-black py-5 px-8 h-12 font-black uppercase tracking-widest text-[11px] transition-all shadow-sm">
            <Package className="mr-2 h-4 w-4" /> {t('borrowing.create_request')}
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center p-4 rounded-xl border border-zinc-100 bg-white/50 shadow-sm font-sans uppercase">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-lg border border-zinc-100 group focus-within:border-[#0F1059]/30 transition-all lg:col-span-2">
             <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase w-full"
                placeholder={t('borrowing.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-2.5 text-[10px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30 cursor-pointer transition-all"
          value={filterDeptStatus}
          onChange={(e) => setFilterDeptStatus(e.target.value)}
        >
          <option value="ALL">{t('borrowing.dept_status')}: ALL</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>

        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-2.5 text-[10px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30 cursor-pointer transition-all"
          value={filterItStatus}
          onChange={(e) => setFilterItStatus(e.target.value)}
        >
          <option value="ALL">{t('borrowing.it_status')}: ALL</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      <Card className="rounded-xl border-zinc-100 overflow-hidden bg-white/90 shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full text-left font-sans">
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none">
                <TableHead 
                   className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('group_code')}
                >
                  <div className="flex items-center gap-1">
                    {t('borrowing.equipment_info')}
                    {sortConfig.key === 'group_code' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('receiving.recipient')}</TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{locale === 'th' ? 'รหัส' : 'EMP CODE'}</TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest text-center">{t('po.quantity')}</TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{locale === 'th' ? 'ประเภท' : 'TYPE'}</TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('borrowing.date_needed')}</TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest text-center">DEPT</TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest text-center">IT FINAL</TableHead>
                <TableHead className="p-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9} className="h-20 animate-pulse bg-zinc-50/20" />
                  </TableRow>
                ))
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="px-6 py-20 text-center text-zinc-400 italic font-bold uppercase tracking-widest">
                      {t('borrowing.no_requests_found')}
                  </TableCell>
                </TableRow>
              ) : filteredRequests.map((g: BorrowGroup) => (
                <TableRow key={g.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-[#0F1059] bg-[#0F1059]/5 px-2 py-0.5 rounded-lg border border-[#0F1059]/5">{g.group_code}</span>
                           <div className="font-bold text-[#0F1059] uppercase text-sm">
                               {g.requests.length === 1 
                                 ? (g.requests[0].equipmentList?.equipmentEntry?.list || g.requests[0].equipmentList?.equipmentEntry?.item_name)
                                 : `Batch: ${g.requests.length} Items`}
                           </div>
                        </div>
                        <div className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.2em] mt-0.5">
                           DATE: {new Date(g.createdAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB')}
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <User2 className="h-3.5 w-3.5 text-zinc-300" />
                        <span className="text-[11px] font-black text-zinc-700 uppercase">{g.user?.employee?.employee_name_th || g.user?.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-[#0F1059]/60 bg-[#0F1059]/5 px-2 py-0.5 rounded uppercase">
                      {g.user?.employee?.employee_code || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="text-xl font-black tracking-tighter text-[#0F1059]">
                       {g.requests.reduce((acc, r) => acc + r.quantity, 0)}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <Badge variant="outline" className={cn(
                      "rounded-lg text-[8px] font-black uppercase tracking-widest px-2 py-1",
                      g.requests[0]?.borrow_type === "NEW" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                      g.requests[0]?.borrow_type === "BROKEN" ? "text-rose-600 bg-rose-50 border-rose-200" :
                      "text-amber-600 bg-amber-50 border-amber-200"
                    )}>
                      {g.requests[0]?.borrow_type || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-zinc-500">
                      {g.date_needed ? new Date(g.date_needed).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB') : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                    <select 
                      value={g.approval_status || "PENDING"}
                      onChange={(e) => updateStatusInline(g.id, 'approval_status', e.target.value)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-zinc-100 outline-none cursor-pointer transition-all shadow-sm",
                        g.approval_status === "APPROVED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        g.approval_status === "REJECTED" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100"
                      )}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                    <select 
                      value={g.it_approval_status || "PENDING"}
                      onChange={(e) => updateStatusInline(g.id, 'it_approval_status', e.target.value)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-zinc-100 outline-none cursor-pointer transition-all shadow-sm",
                        g.it_approval_status === "APPROVED" ? "bg-[#0F1059] text-white border-[#0F1059]" :
                        g.it_approval_status === "REJECTED" ? "bg-rose-500 text-white border-rose-500" : "bg-zinc-100 text-zinc-500 border-zinc-200"
                      )}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => {
                            setPreviewData(g);
                            setIsPreviewModalOpen(true);
                          }}
                          className="p-2.5 rounded-lg bg-white border border-zinc-100 text-[#0F1059] hover:bg-[#0F1059]/5 transition-all shadow-sm"
                          title="View PDF"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => openModal(g)} className="p-2.5 rounded-lg bg-white border border-zinc-100 text-zinc-400 hover:text-[#0F1059] transition-all shadow-sm">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(g.id)} className="p-2.5 rounded-lg bg-white border border-zinc-100 text-zinc-400 hover:text-rose-600 transition-all shadow-sm">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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
        title={editingId ? t('borrowing.process_approval') : t('borrowing.new_request')}
      >
        <form onSubmit={handleSave} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 font-sans">
            {selectedGroup ? (
              <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-100 space-y-4 shadow-inner">
                 <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{locale === 'th' ? 'ข้อมูลการเบิก' : 'Borrow Info'}</p>
                    <span className="font-black text-[11px] text-[#0F1059] bg-[#0F1059]/8 px-2.5 py-1 rounded-lg tracking-widest">
                       {selectedGroup.group_code}
                    </span>
                 </div>

                 <div className="grid grid-cols-2 gap-4 pb-3 border-b border-zinc-200/50">
                    <div>
                       <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'ผู้ร้องขอ' : 'Requester'}</p>
                       <p className="text-[11px] font-bold text-zinc-700">{selectedGroup.user?.employee?.employee_name_th || selectedGroup.user?.username || '-'}</p>
                       <p className="text-[9px] text-zinc-400 mt-0.5 font-mono">{selectedGroup.user?.employee?.employee_code || selectedGroup.user?.username || '-'}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'วันที่สร้าง' : 'Created At'}</p>
                       <p className="text-[11px] font-semibold text-zinc-600">
                          {new Date(selectedGroup.createdAt).toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB')}
                       </p>
                    </div>
                 </div>

                 <div className="pb-3 border-b border-zinc-200/50 space-y-1">
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{t('po.reason')}</p>
                    <p className="text-[12px] font-medium text-zinc-600 leading-relaxed max-h-[80px] overflow-y-auto pr-2 custom-scrollbar">
                       {selectedGroup.reason || t('common.no_info')}
                    </p>
                 </div>

                 <p className="text-[10px] font-black text-[#0F1059] uppercase tracking-[0.2em]">{t('borrowing.batch_items')}</p>
                 <div className="space-y-3">
                    {selectedGroup.requests.map(r => (
                       <div key={r.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-zinc-100 shadow-sm">
                          <div className="flex-1">
                             <p className="text-sm font-black text-[#0F1059]">{r.equipmentList?.equipmentEntry?.list || r.equipmentList?.equipmentEntry?.item_name}</p>
                             <div className="flex items-center gap-3 mt-2">
                                <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-zinc-50 border-zinc-100 text-zinc-500 rounded-lg">{r.borrow_type}</Badge>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Qty: {r.quantity}</span>
                             </div>
                             {r.remarks && <p className="text-[9px] text-zinc-400 italic mt-2 border-l-2 border-zinc-100 pl-2">Note: {r.remarks}</p>}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-300 ml-4">{r.equipment_code}</span>
                       </div>
                    ))}
                 </div>
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-200/50">
                     <p className="text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('borrowing.date_needed')}</p>
                     <p className="text-xs font-black text-rose-600 bg-rose-50 px-4 py-1.5 rounded-lg shadow-sm">
                        {selectedGroup.date_needed ? new Date(selectedGroup.date_needed).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB') : t('common.no_info')}
                     </p>
                  </div>
               </div>
            ) : (
             <>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('receiving.recipient')}</label>
                     <select 
                        required
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/30 shadow-sm transition-all"
                        value={formData.userId}
                        onChange={(e) => setFormData({...formData, userId: e.target.value})}
                     >
                        <option value="">-- SELECT USER --</option>
                        {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('receiving.classification')}</label>
                     <select 
                        required
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/30 shadow-sm transition-all"
                        value={formData.equipment_list_id}
                        onChange={(e) => setFormData({...formData, equipment_list_id: e.target.value})}
                     >
                        <option value="">-- SELECT ITEM --</option>
                        {inventory.map((item: any) => (
                          <option key={item.id} value={item.id} disabled={item.remaining <= 0}>
                            {item.equipmentEntry?.list || item.equipmentEntry?.item_name} (Stock: {item.remaining})
                          </option>
                        ))}
                     </select>
                  </div>
               </div>
    
               <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('po.reason')}</label>
                  <textarea 
                     className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm font-medium outline-none min-h-[80px] focus:border-[#0F1059]/30 shadow-sm transition-all"
                     value={formData.reason}
                     onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  />
               </div>
             </>
            )}

           {/* Step 1: Department Approval */}
           <div className="p-5 rounded-xl bg-amber-50/20 border border-amber-100 space-y-4 shadow-sm">
              <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] border-b border-amber-100/50 pb-3">{t('borrowing.dept_step')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('common.status')}</label>
                    <select 
                       className="w-full bg-white border border-amber-100 rounded-lg px-4 py-3 text-xs font-black text-amber-600 uppercase shadow-sm outline-none"
                       value={formData.approval_status}
                       onChange={(e) => setFormData({...formData, approval_status: e.target.value})}
                    >
                       <option value="PENDING">PENDING</option>
                       <option value="APPROVED">APPROVED</option>
                       <option value="REJECTED">REJECTED</option>
                    </select>
                 </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('borrowing.signed_by')}</label>
                     <EmployeeSearchSelect 
                        value={formData.approval || ""}
                        onChange={(val) => setFormData({...formData, approval: val})}
                        placeholder={t('requests.select_employee')}
                     />
                  </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('borrowing.dept_comment')}</label>
                 <textarea 
                    className="w-full bg-white border border-amber-100 rounded-lg px-4 py-3 text-xs font-medium shadow-sm outline-none min-h-[60px]"
                    value={formData.approval_comment}
                    onChange={(e) => setFormData({...formData, approval_comment: e.target.value})}
                 />
              </div>
           </div>

           {/* Step 2: IT Approval */}
           <div className="p-5 rounded-xl bg-[#0F1059]/5 border border-[#0F1059]/10 space-y-4 shadow-sm">
              <h3 className="text-[10px] font-black text-[#0F1059] uppercase tracking-[0.2em] border-b border-[#0F1059]/10 pb-3">{t('borrowing.it_step')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('common.status')}</label>
                    <select 
                       className="w-full bg-white border border-[#0F1059]/10 rounded-lg px-4 py-3 text-xs font-black text-[#0F1059] uppercase shadow-sm outline-none"
                       value={formData.it_approval_status}
                       onChange={(e) => setFormData({...formData, it_approval_status: e.target.value})}
                    >
                       <option value="PENDING">PENDING</option>
                       <option value="APPROVED">APPROVED</option>
                       <option value="REJECTED">REJECTED</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('borrowing.it_auditor')}</label>
                    <EmployeeSearchSelect 
                       value={formData.it_approval || ""}
                       onChange={(val) => setFormData({...formData, it_approval: val})}
                       placeholder={t('requests.select_employee')}
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('borrowing.it_comment')}</label>
                 <textarea 
                    className="w-full bg-white border border-[#0F1059]/10 rounded-lg px-4 py-3 text-xs font-medium shadow-sm outline-none min-h-[60px]"
                    placeholder="Stock check result..."
                    value={formData.it_approval_comment}
                    onChange={(e) => setFormData({...formData, it_approval_comment: e.target.value})}
                 />
              </div>
           </div>

           <div className="flex items-center gap-3 pt-6 border-t border-zinc-100">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-lg text-[11px] font-black uppercase tracking-widest">
                 {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 h-12 rounded-lg bg-[#0F1059] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#0F1059]/10"
              >
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('borrowing.save_result')}
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
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{locale === 'th' ? 'เลือกข้อมูลที่คุณต้องการรายงาน' : 'Select filters for your report'}</p>
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

             <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2 shadow-sm">
                <p className="text-[10px] font-black text-zinc-400 uppercase">{t('admin_tickets.active_filters')}</p>
                <div className="flex flex-wrap gap-2">
                   <Badge variant="outline" className="bg-white text-[#0F1059] border-zinc-100 text-[10px] uppercase">Dept: {filterDeptStatus}</Badge>
                   <Badge variant="outline" className="bg-white text-[#0F1059] border-zinc-100 text-[10px] uppercase">IT: {filterItStatus}</Badge>
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

      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={t('borrowing.pdf_preview')}
        size="xl"
      >
        <div className="h-[75vh] w-full rounded-3xl overflow-hidden border border-zinc-100 shadow-xl">
          {previewData && (
            <PDFViewer width="100%" height="100%" showToolbar={true}>
              <BorrowRequisitionPDF data={previewData} locale={locale} />
            </PDFViewer>
          )}
        </div>
      </Modal>
    </div>
  );
}
