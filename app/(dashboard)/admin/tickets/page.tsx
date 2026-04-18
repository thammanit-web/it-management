"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Ticket, Edit2, Trash2, ChevronUp, ChevronDown, FileSpreadsheet, Eye } from "lucide-react";
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
import { ITRequestPDF } from "@/lib/pdf/ITRequestPDF";
import { EmployeeSearchSelect } from "@/components/employee-search-select";
import { PDFViewer } from "@react-pdf/renderer";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { AICategorizeSuggest, AICategorizeSuggestHandle } from "@/components/ai/AICategorizeSuggest";

interface RequestTicket {
  id: string;
  request_code: string;
  description: string;
  reason?: string | null;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  employeeId?: string | null;
  type_request?: string | null;
  attachment?: string | null;
  approval?: string | null;
  approval_status?: string | null;
  approval_comment?: string | null;
  approval_date?: string | null;
  it_approval?: string | null;
  it_approval_status?: string | null;
  it_approval_comment?: string | null;
  it_approval_date?: string | null;
  employee?: {
    id: string;
    employee_name_th: string;
    employee_code?: string | null;
    department?: string | null;
    position?: string | null;
    supervisor_name?: string | null;
  };
  user?: { username: string; role?: string | null };
}


export default function TicketsPage() {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [tickets, setTickets] = useState<RequestTicket[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewData, setPreviewData] = useState<RequestTicket | null>(null);

  // Filter States
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterTypeRequest, setFilterTypeRequest] = useState("ALL");
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof RequestTicket; direction: 'asc' | 'desc' }>({
    key: 'request_code',
    direction: 'asc'
  });
  
  // Last 12 months generator
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // Export states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportDateStart, setExportDateStart] = useState("");
  const [exportDateEnd, setExportDateEnd] = useState("");
  const aiRef = React.useRef<AICategorizeSuggestHandle>(null);

  const [formData, setFormData] = useState({
    description: "",
    reason: "",
    category: "SOFTWARE",
    priority: "MEDIUM",
    status: "OPEN",
    employeeId: "",
    type_request: "REPAIR",
    type_request_other: "",
    approval: "",
    approval_status: "PENDING",
    approval_comment: "",
    it_approval: "",
    it_approval_status: "PENDING",
    it_approval_comment: "",
    createdAt: ""
  });

  // Store the full ticket being edited for read-only info display
  const [editingTicket, setEditingTicket] = useState<RequestTicket | null>(null);



  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTicketsList();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterStatus, filterPriority, filterCategory, filterTypeRequest, filterMonth, sortConfig, page]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterPriority, filterCategory, filterTypeRequest, filterMonth, sortConfig]);

  const fetchTicketsList = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status: filterStatus,
        priority: filterPriority,
        category: filterCategory,
        type_request: filterTypeRequest,
        month: filterMonth,
        sortField: sortConfig.key as string,
        sortOrder: sortConfig.direction
      });
      const res = await fetch(`/api/requests?${params.toString()}`);
      const result = await res.json();
      if (result.data) {
        setTickets(result.data);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 1);
      }
    } catch (error) {
      console.error("Fetch tickets error:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSort = (key: keyof RequestTicket) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  const handleExportExcel = () => {
    setIsExportModalOpen(true);
  };

  const processExport = async () => {
    let dataToExport = tickets;

    if (exportDateStart || exportDateEnd) {
      dataToExport = dataToExport.filter(t => {
        const date = new Date(t.createdAt);
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

    const worksheetData = dataToExport.map(t => ({
      "ID": t.request_code || t.id,
      "Date": new Date(t.createdAt).toLocaleDateString('en-GB'),
      "Description": t.description,
      "Category": t.category,
      "Priority": t.priority,
      "Requester": t.employee?.employee_name_th || t.user?.username || '-',
      "Dept Approver": t.approval || '-',
      "Dept Status": t.approval_status,
      "IT Approver": t.it_approval || '-',
      "IT Status": t.it_approval_status,
      "Progress": t.status
    }));

    await exportToExcel(worksheetData, `Support_Tickets_${new Date().toISOString().split('T')[0]}`, "Tickets");
    setIsExportModalOpen(false);
  };

  const openModal = (ticket?: any) => {
    if (ticket) {
      const isPredefined = ["SUPPORT", "PASSWORD_ACCOUNT", "BORROW_ACC", "REPAIR", "INSTALLATION", "PURCHASE", "LICENSE", "ACCESS", "CHANGE"].includes(ticket.type_request);
      setEditingId(ticket.id);
      setEditingTicket(ticket);
      setFormData({
        description: ticket.description || "",
        reason: ticket.reason || "",
        category: ticket.category || "SOFTWARE",
        priority: ticket.priority || "MEDIUM",
        status: ticket.status || "OPEN",
        employeeId: ticket.employeeId || "",
        type_request: isPredefined ? ticket.type_request : (ticket.type_request ? "OTHER" : "REPAIR"),
        type_request_other: isPredefined ? "" : (ticket.type_request || ""),
        approval: ticket.approval || "",
        approval_status: ticket.approval_status || "PENDING",
        approval_comment: ticket.approval_comment || "",
        it_approval: ticket.it_approval || "",
        it_approval_status: ticket.it_approval_status || "PENDING",
        it_approval_comment: ticket.it_approval_comment || "",
        createdAt: ticket.createdAt ? new Date(ticket.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingId(null);
      setEditingTicket(null);
      setFormData({
        description: "",
        reason: "",
        category: "SOFTWARE",
        priority: "MEDIUM",
        status: "OPEN",
        employeeId: "",
        type_request: "REPAIR",
        type_request_other: "",
        approval: "",
        approval_status: "PENDING",
        approval_comment: "",
        it_approval: "",
        it_approval_status: "PENDING",
        it_approval_comment: "",
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleExportPDF = () => {
    if (!editingId) return;
    setIsPreviewModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingId ? `/api/requests/${editingId}` : "/api/requests";
      const method = editingId ? "PATCH" : "POST";

      if (formData.approval_status === "APPROVED" && !formData.approval) {
        alert("กรุณาระบุชื่อผู้อนุมัติ (Department Manager)");
        setIsSaving(false);
        return;
      }
      if (formData.it_approval_status === "APPROVED" && !formData.it_approval) {
        alert("กรุณาระบุชื่อผู้อนุมัติ (IT Department)");
        setIsSaving(false);
        return;
      }

      let finalCategory = formData.category;
      let finalPriority = formData.priority;

      // Only run AI when creating NEW ticket
      if (!editingId) {
        const aiResult = await aiRef.current?.runClassify();
        if (aiResult) {
          finalCategory = aiResult.category;
          finalPriority = aiResult.priority;
        }
      }

      const payload = {
        ...formData,
        category: finalCategory,
        priority: finalPriority,
        it_approval: (formData.it_approval_status !== "PENDING" && !formData.it_approval)
          ? (session?.user?.name || "IT Admin")
          : formData.it_approval,
        approval: (formData.approval_status !== "PENDING" && !formData.approval)
          ? (session?.user?.name || "Supervisor")
          : formData.approval
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          type_request: formData.type_request === "OTHER" ? formData.type_request_other : formData.type_request
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchTicketsList();
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/requests/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        fetchTicketsList();
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const updateStatusInline = async (id: string, field: string, status: string) => {
    try {
      const payload: any = {};
      payload[field] = status;

      if (field === 'it_approval_status') {
        payload.it_approval = session?.user?.name || "IT Admin";
      } else if (field === 'approval_status') {
        payload.approval = session?.user?.name || "Supervisor";
      }

      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) fetchTicketsList();
    } catch (error) {
      console.error("Quick status update error:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#0F1059] flex items-center justify-center text-white border border-[#0F1059]/10 shadow-sm">
              <Ticket className="h-5 w-5" />
            </div>
            {t('admin_tickets.title')}
          </h1>
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest mt-1">{t('admin_tickets.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleExportExcel()}
            variant="outline"
            className="rounded-lg border-zinc-100 hover:border-[#0F1059] hover:text-[#0F1059] py-5 px-6 font-black uppercase tracking-widest text-[13px] transition-all hover:scale-105 active:scale-95"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> {t('admin_tickets.export_excel')}
          </Button>
          <Button onClick={() => openModal()} className="rounded-lg bg-[#0F1059] hover:bg-black py-5 px-8 font-black uppercase tracking-widest text-[13px] transition-all hover:scale-105 active:scale-95">
            <Ticket className="mr-2 h-4 w-4" /> {t('admin_tickets.create_ticket')}
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-3 items-center p-4 rounded-xl border border-zinc-100 backdrop-blur-xl bg-white/50 shadow-sm">
        {/* Search */}
        <div className="xl:col-span-2 flex items-center gap-3 px-4 py-2.5 bg-zinc-50 rounded-lg border border-zinc-100 shadow-sm group focus-within:border-[#0F1059]/30 transition-all">
          <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059] shrink-0" />
          <input
            className="bg-transparent border-none outline-none text-xs font-bold uppercase w-full placeholder:text-zinc-300"
            placeholder={locale === 'th' ? 'ค้นหา รหัส, ชื่อ, แผนก, ตำแหน่ง...' : 'Search code, name, dept, position...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status */}
        <select
          className="bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-2.5 text-[11px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30 font-sans"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">{t('admin_tickets.all_status')}</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>

        {/* Priority */}
        <select
          className="bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-2.5 text-[11px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30 font-sans"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="ALL">{t('admin_tickets.all_priority')}</option>
          <option value="LOW">{t('priorities.low')}</option>
          <option value="MEDIUM">{t('priorities.medium')}</option>
          <option value="HIGH">{t('priorities.high')}</option>
          <option value="URGENT">{t('priorities.urgent')}</option>
        </select>

        {/* Category */}
        <select
          className="bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-2.5 text-[11px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30 font-sans"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="ALL">{t('admin_tickets.all_categories')}</option>
          <option value="SOFTWARE">{t('categories.software')}</option>
          <option value="HARDWARE">{t('categories.hardware')}</option>
          <option value="NETWORK">{t('categories.network')}</option>
          <option value="GENERAL">{t('categories.general')}</option>
        </select>

        {/* Type Request */}
        <select
          className="bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-2.5 text-[11px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30 font-sans"
          value={filterTypeRequest}
          onChange={(e) => setFilterTypeRequest(e.target.value)}
        >
          <option value="ALL">{locale === 'th' ? 'ทุกประเภทคำร้อง' : 'All Types'}</option>
          <option value="SUPPORT">{t('types.support')}</option>
          <option value="PASSWORD_ACCOUNT">{t('types.password_reset')}</option>
          <option value="BORROW_ACC">{t('types.borrow_acc')}</option>
          <option value="REPAIR">{t('types.repair')}</option>
          <option value="PURCHASE">{t('types.purchase')}</option>
          <option value="LICENSE">{t('types.license')}</option>
          <option value="ACCESS">{t('types.access')}</option>
          <option value="CHANGE">{t('types.change')}</option>
          <option value="OTHER">{t('types.other')}</option>
        </select>

        {/* Month */}
        <select
          className="bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-2.5 text-[11px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30 font-sans"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          <option value="ALL">{locale === 'th' ? 'ทุกเดือน' : 'All Months'}</option>
          {monthOptions.map(opt => (
            <option key={opt.val} value={opt.val}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          {locale === 'th' ? `แสดงทั้งหมด ${total} รายการ` : `Showing total ${total} tickets`}
        </p>
        {(filterStatus !== 'ALL' || filterPriority !== 'ALL' || filterCategory !== 'ALL' || filterTypeRequest !== 'ALL' || filterMonth !== (new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, '0')) || search) && (
          <button
            onClick={() => { 
                setFilterStatus('ALL'); 
                setFilterPriority('ALL'); 
                setFilterCategory('ALL'); 
                setFilterTypeRequest('ALL'); 
                const now = new Date();
                setFilterMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`); 
                setSearch(''); 
            }}
            className="text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest transition-colors"
          >
            {locale === 'th' ? '× ล้างตัวกรอง' : '× Clear Filters'}
          </button>
        )}
      </div>

      <Card className="rounded-xl border-zinc-100 overflow-hidden bg-white/90 shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full text-left min-w-[1400px]">
            <TableHeader className="bg-zinc-50/80 border-b border-zinc-100">
              <TableRow>
                {/* Request Info */}
                <TableHead
                  className="px-5 py-4 text-[9px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors min-w-[220px]"
                  onClick={() => handleSort('request_code')}
                >
                  <div className="flex items-center gap-1">
                    {t('admin_tickets.request_info')}
                    {sortConfig.key === 'request_code' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                {/* Requester / Employee */}
                <TableHead
                  className="px-4 py-4 text-[9px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors min-w-[160px]"
                  onClick={() => handleSort('employeeId')}
                >
                  <div className="flex items-center gap-1">
                    {locale === 'th' ? 'ผู้ร้อง / แผนก' : 'Requester / Dept'}
                    {sortConfig.key === 'employeeId' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                {/* Type */}
                <TableHead
                  className="px-4 py-4 text-[9px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors min-w-[110px]"
                  onClick={() => handleSort('type_request')}
                >
                  <div className="flex items-center gap-1">
                    {t('requests.request_type')}
                    {sortConfig.key === 'type_request' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                {/* Category */}
                <TableHead
                  className="px-4 py-4 text-[9px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors min-w-[100px]"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    {t('common.category')}
                    {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                {/* Priority */}
                <TableHead
                  className="px-4 py-4 text-[9px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors min-w-[90px]"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center gap-1">
                    {t('common.priority')}
                    {sortConfig.key === 'priority' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                {/* Dept Approver */}
                <TableHead
                  className="px-4 py-4 text-[9px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors min-w-[130px]"
                  onClick={() => handleSort('approval')}
                >
                  <div className="flex items-center gap-1">
                    {locale === 'th' ? 'ผู้อนุมัติ (แผนก)' : 'Dept Approver'}
                    {sortConfig.key === 'approval' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                {/* Dept Status */}
                <TableHead
                  className="px-4 py-4 text-[9px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors min-w-[110px]"
                  onClick={() => handleSort('approval_status')}
                >
                  <div className="flex items-center gap-1">
                    {t('admin_tickets.dept_status')}
                    {sortConfig.key === 'approval_status' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                {/* IT Approver */}
                <TableHead
                  className="px-4 py-4 text-[9px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors min-w-[130px]"
                  onClick={() => handleSort('it_approval')}
                >
                  <div className="flex items-center gap-1">
                    {locale === 'th' ? 'ผู้อนุมัติ (IT)' : 'IT Approver'}
                    {sortConfig.key === 'it_approval' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                {/* IT Status */}
                <TableHead
                  className="px-4 py-4 text-[9px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors min-w-[110px]"
                  onClick={() => handleSort('it_approval_status')}
                >
                  <div className="flex items-center gap-1">
                    {t('admin_tickets.it_status')}
                    {sortConfig.key === 'it_approval_status' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                {/* Progress */}
                <TableHead
                  className="px-4 py-4 text-[9px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors min-w-[120px]"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    {t('admin_tickets.progress')}
                    {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                {/* Updated */}
                <TableHead
                  className="px-4 py-4 text-[9px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors min-w-[100px]"
                  onClick={() => handleSort('updatedAt')}
                >
                  <div className="flex items-center gap-1">
                    {locale === 'th' ? 'อัพเดต' : 'Updated'}
                    {sortConfig.key === 'updatedAt' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                {/* Actions */}
                <TableHead className="px-4 py-4 w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={12} className="h-16 animate-pulse bg-zinc-50/20" />
                  </TableRow>
                ))
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="px-6 py-20 text-center text-zinc-400 italic font-bold uppercase tracking-widest">
                    {t('admin_tickets.no_tickets_found')}
                  </TableCell>
                </TableRow>
              ) : tickets.map((t_item: any) => (
                <TableRow key={t_item.id} className="hover:bg-blue-50/20 transition-colors group">

                  {/* Request Info */}
                  <TableCell className="px-5 py-3.5 whitespace-nowrap">
                    <div className="font-semibold text-zinc-800 line-clamp-1 max-w-[200px] text-[12px]" title={t_item.description}>{t_item.description}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-black text-[9px] text-[#0F1059] bg-[#0F1059]/8 px-1.5 py-0.5 rounded-md tracking-wide">{t_item.request_code || 'N/A'}</span>
                      <span className="text-[9px] text-zinc-300">•</span>
                      <span className="text-[9px] text-zinc-400 font-medium">{new Date(t_item.createdAt).toLocaleDateString('en-GB')}</span>
                    </div>
                    {t_item.reason && (
                      <div className="text-[9px] text-zinc-400 mt-0.5 italic line-clamp-1 max-w-[190px]" title={t_item.reason}>↪ {t_item.reason}</div>
                    )}
                  </TableCell>

                  {/* Requester / Dept */}
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    <div className="text-[11px] font-semibold text-zinc-700 line-clamp-1 max-w-[150px]">{t_item.employee?.employee_name_th || t_item.user?.username || '-'}</div>
                    {t_item.employee?.department && (
                      <div className="text-[9px] text-zinc-400 font-medium mt-0.5 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-300" />
                        {t_item.employee.department}
                      </div>
                    )}
                    {t_item.employee?.position && (
                      <div className="text-[9px] text-zinc-300 italic mt-0.5 line-clamp-1 max-w-[150px]">{t_item.employee.position}</div>
                    )}
                  </TableCell>

                  {/* Type */}
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    <Badge variant="outline" className="rounded-lg text-[8px] font-black uppercase tracking-wide px-2 py-0.5 border-violet-200 text-violet-600 bg-violet-50">
                      {t_item.type_request || '-'}
                    </Badge>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    <Badge variant="outline" className={cn(
                      "rounded-lg text-[8px] font-black uppercase tracking-wide px-2 py-0.5",
                      t_item.category === "HARDWARE" ? "text-orange-600 bg-orange-50 border-orange-200" :
                      t_item.category === "SOFTWARE" ? "text-sky-600 bg-sky-50 border-sky-200" :
                      t_item.category === "NETWORK" ? "text-teal-600 bg-teal-50 border-teal-200" :
                      "text-zinc-500 bg-zinc-50 border-zinc-200"
                    )}>
                      {t_item.category}
                    </Badge>
                  </TableCell>

                  {/* Priority */}
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    <Badge variant="outline" className={cn(
                      "rounded-md text-[8px] font-black uppercase tracking-wide px-2 py-0.5",
                      t_item.priority === "URGENT" ? "text-red-700 bg-red-50 border-red-300" :
                      t_item.priority === "HIGH" ? "text-rose-600 bg-rose-50 border-rose-200" :
                      t_item.priority === "MEDIUM" ? "text-amber-600 bg-amber-50 border-amber-200" :
                      "text-sky-600 bg-sky-50 border-sky-200"
                    )}>
                      {t_item.priority}
                    </Badge>
                  </TableCell>

                  {/* Dept Approver */}
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    <div className="text-[10px] font-medium text-zinc-600 max-w-[120px] truncate" title={t_item.approval || '-'}>
                      {t_item.approval || <span className="text-zinc-300 italic">—</span>}
                    </div>
                    {t_item.approval_date && (
                      <div className="text-[9px] text-zinc-300 mt-0.5">{new Date(t_item.approval_date).toLocaleDateString('en-GB')}</div>
                    )}
                  </TableCell>

                  {/* Dept Status */}
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    <select
                      value={t_item.approval_status || "PENDING"}
                      onChange={(e) => updateStatusInline(t_item.id, 'approval_status', e.target.value)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-tight border-none outline-none cursor-pointer font-sans",
                        t_item.approval_status === "APPROVED" ? "bg-emerald-50 text-emerald-600" :
                          t_item.approval_status === "REJECTED" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                      )}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </TableCell>

                  {/* IT Approver */}
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    <div className="text-[10px] font-medium text-zinc-600 max-w-[120px] truncate" title={t_item.it_approval || '-'}>
                      {t_item.it_approval || <span className="text-zinc-300 italic">—</span>}
                    </div>
                    {t_item.it_approval_date && (
                      <div className="text-[9px] text-zinc-300 mt-0.5">{new Date(t_item.it_approval_date).toLocaleDateString('en-GB')}</div>
                    )}
                  </TableCell>

                  {/* IT Status */}
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    <select
                      value={t_item.it_approval_status || "PENDING"}
                      onChange={(e) => updateStatusInline(t_item.id, 'it_approval_status', e.target.value)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-tight border-none outline-none cursor-pointer font-sans",
                        t_item.it_approval_status === "APPROVED" ? "bg-[#0F1059] text-white" :
                          t_item.it_approval_status === "REJECTED" ? "bg-rose-500 text-white" : "bg-zinc-100 text-zinc-500"
                      )}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </TableCell>

                  {/* Progress/Status */}
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    <select
                      value={t_item.status || "OPEN"}
                      onChange={(e) => updateStatusInline(t_item.id, 'status', e.target.value)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest border-none outline-none cursor-pointer font-sans",
                        t_item.status === "RESOLVED" ? "bg-emerald-50 text-emerald-600" :
                        t_item.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                      )}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                  </TableCell>

                  {/* Updated At */}
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    <div className="text-[10px] font-medium text-zinc-500">
                      {new Date(t_item.updatedAt).toLocaleDateString('en-GB')}
                    </div>
                    <div className="text-[9px] text-zinc-300 mt-0.5">
                      {new Date(t_item.updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="px-4 py-3.5 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setPreviewData(t_item);
                          setIsPreviewModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-white border border-zinc-100 text-zinc-400 hover:text-[#0F1059] hover:border-[#0F1059]/20 transition-all shadow-sm"
                        title="View PDF"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => openModal(t_item)} className="p-2 rounded-lg bg-white border border-zinc-100 text-zinc-400 hover:text-[#0F1059] hover:border-[#0F1059]/20 transition-all shadow-sm">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(t_item.id)} className="p-2 rounded-lg bg-white border border-zinc-100 text-zinc-400 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination UI Desktop */}
        <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between min-w-[1400px]">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
               {t('common.total')} {total} {t('admin_tickets.entry_count') || 'TICKETS'}
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? t('admin_tickets.process_ticket_title') : t('admin_tickets.create_ticket_title')}
        size="xl"
      >
        <form onSubmit={handleSave} className="space-y-5">

          {/* ── READ-ONLY INFO PANEL (edit mode only) ── */}
          {editingId && editingTicket && (
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  {locale === 'th' ? 'ข้อมูลคำร้อง (อ่านอย่างเดียว)' : 'Request Info (Read-Only)'}
                </span>
                <span className="font-black text-[11px] text-[#0F1059] bg-[#0F1059]/8 px-2.5 py-1 rounded-lg tracking-widest">
                  {editingTicket.request_code || 'N/A'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'วันที่สร้าง' : 'Created'}</p>
                  <p className="text-[11px] font-semibold text-zinc-600">{new Date(editingTicket.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'อัพเดตล่าสุด' : 'Updated'}</p>
                  <p className="text-[11px] font-semibold text-zinc-600">{new Date(editingTicket.updatedAt).toLocaleDateString('en-GB')} {new Date(editingTicket.updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'ผู้ใช้ระบบ' : 'System User'}</p>
                  <p className="text-[11px] font-semibold text-zinc-600">{editingTicket.user?.username || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'รหัสพนักงาน' : 'Emp. Code'}</p>
                  <p className="text-[11px] font-semibold text-zinc-600">{editingTicket.employee?.employee_code || '-'}</p>
                </div>
              </div>
              {/* Employee details row */}
              {editingTicket.employee && (
                <div className="pt-2 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'ชื่อ-สกุล' : 'Full Name'}</p>
                    <p className="text-[12px] font-bold text-zinc-700">{editingTicket.employee.employee_name_th}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'แผนก' : 'Department'}</p>
                    <p className="text-[11px] font-semibold text-zinc-600">{editingTicket.employee.department || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{locale === 'th' ? 'ตำแหน่ง' : 'Position'}</p>
                    <p className="text-[11px] font-semibold text-zinc-600">{editingTicket.employee.position || '-'}</p>
                  </div>
                </div>
              )}
              {/* Attachment row */}
              {editingTicket.attachment && (
                <div className="pt-2 border-t border-zinc-100">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">{locale === 'th' ? 'รูปภาพแนบ' : 'Attachment'}</p>
                  <div className="rounded-xl overflow-hidden border border-zinc-200 bg-white shadow-sm flex items-center justify-center p-2">
                    <a href={editingTicket.attachment} target="_blank" rel="noopener noreferrer" className="block text-center hover:opacity-90 transition-opacity">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={editingTicket.attachment} alt="Attachment" className="max-h-[300px] w-auto inline-block rounded-lg" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── REQUEST DATE (Admin Edit) ── */}
          <div className="space-y-1.5 p-4 rounded-xl bg-blue-50/20 border border-blue-100/40">
            <label className="text-[11px] font-black text-[#0F1059] uppercase tracking-widest flex items-center gap-2">
              {locale === 'th' ? 'วันที่ร้องขอ / แจ้งงาน' : 'Request Date'}
              <span className="text-[9px] font-bold text-zinc-400 normal-case tracking-normal">(Admin usage)</span>
            </label>
            <input
              type="date"
              required
              className="w-full bg-white border border-blue-100 rounded-lg px-4 py-2.5 text-sm font-semibold outline-none focus:border-[#0F1059]/40 transition-all font-sans text-blue-900"
              value={formData.createdAt}
              onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
            />
          </div>

          {/* ── REQUEST TYPE ── */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('requests.request_type')}</label>
              <select
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/20 transition-all font-sans"
                value={formData.type_request}
                onChange={(e) => setFormData({ ...formData, type_request: e.target.value })}
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
            </div>
            {formData.type_request === "OTHER" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                <label className="text-[11px] font-black text-[#0F1059] uppercase tracking-widest">{t('requests.please_specify')}</label>
                <input
                  required
                  className="w-full bg-zinc-50 border border-[#0F1059]/30 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                  value={formData.type_request_other}
                  onChange={(e) => setFormData({ ...formData, type_request_other: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* ── DESCRIPTION + REASON ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('requests.problem_desc')}</label>
              <textarea
                required
                readOnly={!!editingId}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[80px] resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                {locale === 'th' ? 'เหตุผล / รายละเอียดเพิ่มเติม' : 'Reason / Additional Details'}
              </label>
              <textarea
                readOnly={!!editingId}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[80px] resize-none"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder={locale === 'th' ? 'ระบุเหตุผลเพิ่มเติม (ถ้ามี)' : 'Optional additional reason...'}
              />
            </div>
          </div>

          {/* ── AI CONTROL (Create mode only) ── */}
          {!editingId && (
            <AICategorizeSuggest
              ref={aiRef}
              type_request={formData.type_request}
              description={formData.description}
              reason={formData.reason}
              onApply={(category, priority) =>
                setFormData({ ...formData, category, priority })
              }
            />
          )}

          {/* ── CATEGORY / EMPLOYEE / PRIORITY ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('common.category')}</label>
              <select
                disabled={!!editingId}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none disabled:opacity-60"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="SOFTWARE">{t('categories.software')}</option>
                <option value="HARDWARE">{t('categories.hardware')}</option>
                <option value="NETWORK">{t('categories.network')}</option>
                <option value="GENERAL">{t('categories.general')}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('requests.requestor')}</label>
              <EmployeeSearchSelect
                value={formData.employeeId}
                valueType="id"
                onChange={(val) => setFormData({ ...formData, employeeId: val })}
                placeholder={t('requests.select_employee')}
                className={cn(!!editingId && "opacity-60 pointer-events-none")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('common.priority')}</label>
              <select
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
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

          {/* ── DEPT APPROVAL ── */}
          <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100/60 space-y-4">
            <h3 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em] border-b border-amber-100 pb-2 flex items-center justify-between">
              {t('admin_tickets.dept_approval_step')}
              {editingTicket?.approval_date && (
                <span className="text-[9px] font-bold text-amber-400 normal-case tracking-normal">
                  {locale === 'th' ? 'อนุมัติเมื่อ: ' : 'Approved: '}
                  {new Date(editingTicket.approval_date).toLocaleDateString('en-GB')}
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-400 uppercase">{t('admin_tickets.dept_status')}</label>
                <select
                  className={cn(
                    "w-full border rounded-lg px-3 py-2 text-xs font-bold uppercase outline-none",
                    formData.approval_status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                    formData.approval_status === 'REJECTED' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                    'bg-white border-zinc-100 text-amber-600'
                  )}
                  value={formData.approval_status}
                  onChange={(e) => setFormData({ ...formData, approval_status: e.target.value })}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-400 uppercase">{t('requests.approved_by')}</label>
                <EmployeeSearchSelect
                  value={formData.approval || ""}
                  onChange={(val) => setFormData({ ...formData, approval: val })}
                  placeholder={t('borrow.search_approver')}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-zinc-400 uppercase">{t('admin_tickets.dept_reviewer_comment')}</label>
              <textarea
                className="w-full bg-white border border-amber-100 rounded-lg px-3 py-2 text-xs resize-none min-h-[56px]"
                value={formData.approval_comment}
                onChange={(e) => setFormData({ ...formData, approval_comment: e.target.value })}
                placeholder={locale === 'th' ? 'ความเห็นจากผู้อนุมัติแผนก...' : 'Department approver comment...'}
              />
            </div>
          </div>

          {/* ── IT APPROVAL ── */}
          <div className="p-4 rounded-2xl bg-[#0F1059]/5 border border-[#0F1059]/10 space-y-4">
            <h3 className="text-[11px] font-black text-[#0F1059] uppercase tracking-[0.2em] border-b border-[#0F1059]/10 pb-2 flex items-center justify-between">
              {t('admin_tickets.it_approval_step')}
              {editingTicket?.it_approval_date && (
                <span className="text-[9px] font-bold text-[#0F1059]/40 normal-case tracking-normal">
                  {locale === 'th' ? 'อนุมัติเมื่อ: ' : 'Approved: '}
                  {new Date(editingTicket.it_approval_date).toLocaleDateString('en-GB')}
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-400 uppercase">{t('admin_tickets.it_status')}</label>
                <select
                  className={cn(
                    "w-full border rounded-lg px-3 py-2 text-xs font-bold uppercase outline-none",
                    formData.it_approval_status === 'APPROVED' ? 'bg-[#0F1059] border-[#0F1059] text-white' :
                    formData.it_approval_status === 'REJECTED' ? 'bg-rose-500 border-rose-500 text-white' :
                    'bg-white border-[#0F1059]/10 text-zinc-500'
                  )}
                  value={formData.it_approval_status}
                  onChange={(e) => setFormData({ ...formData, it_approval_status: e.target.value })}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-400 uppercase">{locale === 'th' ? 'ผู้อนุมัติ IT' : 'IT Approver'}</label>
                <EmployeeSearchSelect
                  value={formData.it_approval || ""}
                  onChange={(val: string) => setFormData({ ...formData, it_approval: val })}
                  placeholder={t('borrow.search_approver')}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-zinc-400 uppercase">{t('admin_tickets.it_auditor_comment')}</label>
              <textarea
                className="w-full bg-white border border-[#0F1059]/10 rounded-lg px-3 py-2 text-xs resize-none min-h-[56px]"
                value={formData.it_approval_comment}
                onChange={(e) => setFormData({ ...formData, it_approval_comment: e.target.value })}
                placeholder={locale === 'th' ? 'ความเห็นจาก IT...' : 'IT approver comment...'}
              />
            </div>
          </div>

          {/* ── WORKFLOW STATUS ── */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('admin_tickets.workflow_status')}</label>
            <select
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-black text-[#0F1059] uppercase outline-none"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="OPEN">{locale === 'th' ? 'รอดำเนินการ' : 'OPEN'}</option>
              <option value="IN_PROGRESS">{locale === 'th' ? 'กำลังดำเนินการ' : 'IN PROGRESS'}</option>
              <option value="RESOLVED">{locale === 'th' ? 'แก้ไขแล้ว' : 'RESOLVED'}</option>
            </select>
          </div>

          {/* ── ACTIONS ── */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 min-w-[120px] h-12 rounded-xl text-[11px] font-black uppercase tracking-widest">
              {t('common.cancel')}
            </Button>
            {editingId && (
              <Button
                type="button"
                onClick={handleExportPDF}
                className="flex-1 min-w-[120px] h-12 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 text-[11px] font-black uppercase tracking-widest"
              >
                <Eye className="mr-2 h-4 w-4" /> {t('admin_tickets.view_pdf')}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-2 min-w-[200px] h-12 rounded-xl bg-[#0F1059] hover:bg-black text-white shadow-xl shadow-[#0F1059]/10 text-[11px] font-black uppercase tracking-widest transition-all"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('admin_tickets.save_changes')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={t('admin_tickets.export_report_title')}
      >
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-emerald-900 uppercase">{t('admin_tickets.export_settings')}</h3>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{locale === 'th' ? 'เลือกตัวกรองสำหรับรายงานของคุณ' : 'Select filters for your report'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{locale === 'th' ? 'วันที่เริ่ม' : 'Start Date'}</label>
                <input
                  type="date"
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                  value={exportDateStart}
                  onChange={(e) => setExportDateStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{locale === 'th' ? 'วันที่สิ้นสุด' : 'End Date'}</label>
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
                <Badge className="bg-white text-[#0F1059] border-zinc-100 text-[10px]">Status: {filterStatus}</Badge>
                <Badge className="bg-white text-[#0F1059] border-zinc-100 text-[10px]">Category: {filterCategory}</Badge>
                {search && <Badge className="bg-white text-[#0F1059] border-zinc-100 text-[10px]">Search: {search}</Badge>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsExportModalOpen(false)} className="flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={processExport}
              className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/20"
            >
              {t('admin_tickets.download_excel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* PDF Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={t('admin_tickets.view_pdf')}
        size="xl"
      >
        <div className="h-[75vh] w-full rounded-2xl overflow-hidden border border-zinc-100">
          {previewData && (
            <PDFViewer width="100%" height="100%" showToolbar={true}>
              <ITRequestPDF data={previewData} locale={locale} />
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={locale === 'th' ? "ยืนยันการลบรายคำร้อง" : "Confirm Delete Ticket"}
        size="sm"
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 mb-2">
            <Trash2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">
              {locale === 'th' ? "คุณแน่ใจหรือไม่?" : "Are you sure?"}
            </h3>
            <p className="text-[13px] font-bold text-zinc-400 mt-2 leading-relaxed uppercase tracking-widest">
              {locale === 'th' 
                ? "การลบรายการนี้จะไม่สามารถกู้คืนข้อมูลได้ คุณต้องการดำเนินการต่อหรือไม่?" 
                : "This action cannot be undone. All data associated with this ticket will be permanently removed."}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="w-full h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-rose-500/20"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : (locale === 'th' ? "ยืนยันการลบข้อมูล" : "Delete Permanently")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="w-full h-12 rounded-2xl text-zinc-400 hover:text-zinc-900 font-black uppercase tracking-widest text-[11px]"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
