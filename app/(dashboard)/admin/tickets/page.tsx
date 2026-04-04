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
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { exportToExcel } from "@/lib/export-utils";
import { ITRequestPDF } from "@/lib/pdf/ITRequestPDF";
import { EmployeeSearchSelect } from "@/components/employee-search-select";
import { PDFViewer } from "@react-pdf/renderer";
import { useTranslation } from "@/lib/i18n/LanguageContext";

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

interface Employee {
  id: string;
  employee_name_th: string;
  employee_code: string;
  department?: string | null;
  position?: string | null;
}

export default function TicketsPage() {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [tickets, setTickets] = useState<RequestTicket[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof RequestTicket; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });

  // Export states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportDateStart, setExportDateStart] = useState("");
  const [exportDateEnd, setExportDateEnd] = useState("");

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
    it_approval_comment: ""
  });

  // Store the full ticket being edited for read-only info display
  const [editingTicket, setEditingTicket] = useState<RequestTicket | null>(null);

  useEffect(() => {
    fetchTickets();
    fetchEmployees();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/requests");
      const data = await res.json();
      if (Array.isArray(data)) setTickets(data);
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

  const handleSort = (key: keyof RequestTicket) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredTickets = tickets
    .filter(t => {
      const searchLow = search.toLowerCase();
      const matchesSearch =
        t.description.toLowerCase().includes(searchLow) ||
        (t.request_code || "").toLowerCase().includes(searchLow) ||
        (t.employee?.employee_name_th || "").toLowerCase().includes(searchLow) ||
        (t.employee?.department || "").toLowerCase().includes(searchLow) ||
        (t.employee?.position || "").toLowerCase().includes(searchLow) ||
        (t.user?.username || "").toLowerCase().includes(searchLow) ||
        (t.type_request || "").toLowerCase().includes(searchLow) ||
        t.category.toLowerCase().includes(searchLow);

      const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
      const matchesPriority = filterPriority === "ALL" || t.priority === filterPriority;
      const matchesCategory = filterCategory === "ALL" || t.category === filterCategory;
      const matchesTypeRequest = filterTypeRequest === "ALL" || (t.type_request || "") === filterTypeRequest;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesTypeRequest;
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
    let dataToExport = filteredTickets;

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
      "Dept Status": t.approval_status,
      "IT Status": t.it_approval_status,
      "Final Status": t.status
    }));

    await exportToExcel(worksheetData, `Support_Tickets_${new Date().toISOString().split('T')[0]}`, "Tickets");
    setIsExportModalOpen(false);
  };

  const openModal = (ticket?: any) => {
    if (ticket) {
      const isPredefined = ["SUPPORT", "PASSWORD_ACCOUNT", "BORROW_ACC", "REPAIR", "PURCHASE", "LICENSE", "ACCESS", "CHANGE"].includes(ticket.type_request);
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
        it_approval_comment: ticket.it_approval_comment || ""
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
        it_approval_comment: ""
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

      const payload = {
        ...formData,
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
        fetchTickets();
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
        fetchTickets();
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
      if (res.ok) fetchTickets();
    } catch (error) {
      console.error("Quick status update error:", error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight uppercase flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#0F1059] flex items-center justify-center text-white border border-slate-200 dark:border-slate-700 shadow-sm">
              <Ticket className="h-5 w-5" />
            </div>
            {t('admin_tickets.title')}
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">{t('admin_tickets.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleExportExcel()}
            variant="outline"
            className="rounded-lg border-slate-200 dark:border-slate-700 hover:border-[#0F1059] hover:text-[#0F1059] h-10 px-4 font-bold uppercase tracking-widest text-[12px] transition-all"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> {t('admin_tickets.export_excel')}
          </Button>
          <Button onClick={() => openModal()} className="rounded-lg bg-[#0F1059] hover:bg-black h-10 px-4 font-bold uppercase tracking-widest text-[12px] transition-all">
            <Ticket className="mr-2 h-4 w-4" /> {t('admin_tickets.create_ticket')}
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <div className="xl:col-span-2 flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 group focus-within:border-[#0F1059]/30 transition-all">
          <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#0F1059] shrink-0" />
          <input
            className="bg-transparent border-none outline-none text-sm font-bold uppercase w-full placeholder:text-slate-400"
            placeholder={t('employees.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-bold uppercase outline-none text-slate-600 dark:text-slate-300 focus:border-[#0F1059]/30 transition-all"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">{t('admin_tickets.all_status')}</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>

        <select
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-bold uppercase outline-none text-slate-600 dark:text-slate-300 focus:border-[#0F1059]/30 transition-all"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="ALL">{t('admin_tickets.all_priority')}</option>
          <option value="LOW">{t('priorities.low')}</option>
          <option value="MEDIUM">{t('priorities.medium')}</option>
          <option value="HIGH">{t('priorities.high')}</option>
          <option value="URGENT">{t('priorities.urgent')}</option>
        </select>

        <select
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-bold uppercase outline-none text-slate-600 dark:text-slate-300 focus:border-[#0F1059]/30 transition-all"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="ALL">{t('admin_tickets.all_categories')}</option>
          <option value="SOFTWARE">{t('categories.software')}</option>
          <option value="HARDWARE">{t('categories.hardware')}</option>
          <option value="NETWORK">{t('categories.network')}</option>
          <option value="GENERAL">{t('categories.general')}</option>
        </select>

        <select
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-bold uppercase outline-none text-slate-600 dark:text-slate-300 focus:border-[#0F1059]/30 transition-all"
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
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          {locale === 'th' ? `แสดง ${filteredTickets.length} จาก ${tickets.length} รายการ` : `Showing ${filteredTickets.length} of ${tickets.length} tickets`}
        </p>
      </div>

      {/* Desktop View: Table */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <Table className="w-full text-left min-w-[1400px]">
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <TableRow>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest cursor-pointer" onClick={() => handleSort('request_code')}>
                  <div className="flex items-center gap-1">
                    {t('admin_tickets.request_info')}
                    {sortConfig.key === 'request_code' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest cursor-pointer" onClick={() => handleSort('employeeId')}>
                   <div className="flex items-center gap-1">
                     {locale === 'th' ? 'ผู้ร้อง / แผนก' : 'Requester / Dept'}
                     {sortConfig.key === 'employeeId' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                   </div>
                </TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{t('requests.request_type')}</TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{t('common.category')}</TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{t('common.priority')}</TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{locale === 'th' ? 'สถานะ (แผนก)' : 'Dept Status'}</TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{locale === 'th' ? 'สถานะ (IT)' : 'IT Status'}</TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{t('admin_tickets.progress')}</TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={9} className="py-8 animate-pulse bg-slate-50/50" /></TableRow>
                ))
              ) : filteredTickets.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="py-20 text-center text-slate-400 italic font-bold uppercase tracking-widest">{t('admin_tickets.no_tickets_found')}</TableCell></TableRow>
              ) : filteredTickets.map((t_item) => (
                <TableRow key={t_item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-colors group">
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1 max-w-[250px]">{t_item.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-[10px] text-primary bg-primary/5 px-1.5 py-0.5 rounded uppercase">{t_item.request_code || 'N/A'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(t_item.createdAt).toLocaleDateString('en-GB')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{t_item.employee?.employee_name_th || t_item.user?.username || '-'}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{t_item.employee?.department || '-'}</div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <Badge variant="outline" className="rounded text-[9px] font-bold uppercase tracking-wider py-0.5 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      {t_item.type_request || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <Badge variant="outline" className={cn(
                      "rounded text-[9px] font-bold uppercase tracking-wider py-0.5 border-none",
                      t_item.category === "HARDWARE" ? "text-orange-600 bg-orange-50" :
                      t_item.category === "SOFTWARE" ? "text-sky-600 bg-sky-50" : "text-slate-500 bg-slate-50"
                    )}>
                      {t_item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <Badge variant="outline" className={cn(
                      "rounded text-[9px] font-bold uppercase tracking-wider py-0.5 border-none",
                      t_item.priority === "URGENT" || t_item.priority === "HIGH" ? "text-rose-600 bg-rose-50" :
                      t_item.priority === "MEDIUM" ? "text-amber-600 bg-amber-50" : "text-sky-600 bg-sky-50"
                    )}>
                      {t_item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <select
                        value={t_item.approval_status || "PENDING"}
                        onChange={(e) => updateStatusInline(t_item.id, 'approval_status', e.target.value)}
                        className={cn(
                          "rounded px-2 py-1 text-[10px] font-black uppercase tracking-tight border-none outline-none cursor-pointer",
                          t_item.approval_status === "APPROVED" ? "bg-emerald-50 text-emerald-600" :
                          t_item.approval_status === "REJECTED" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                        )}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <select
                        value={t_item.it_approval_status || "PENDING"}
                        onChange={(e) => updateStatusInline(t_item.id, 'it_approval_status', e.target.value)}
                        className={cn(
                          "rounded px-2 py-1 text-[10px] font-black uppercase tracking-tight border-none outline-none cursor-pointer",
                          t_item.it_approval_status === "APPROVED" ? "bg-primary text-white" :
                          t_item.it_approval_status === "REJECTED" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <select
                        value={t_item.status || "OPEN"}
                        onChange={(e) => updateStatusInline(t_item.id, 'status', e.target.value)}
                        className={cn(
                          "rounded px-2 py-1 text-[10px] font-black uppercase tracking-widest border-none outline-none cursor-pointer",
                          t_item.status === "RESOLVED" || t_item.status === "CLOSED" ? "bg-emerald-50 text-emerald-600" :
                          t_item.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                        )}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setPreviewData(t_item); setIsPreviewModalOpen(true); }} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-all"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openModal(t_item)} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-all"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(t_item.id)} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 transition-all"><Trash2 className="h-4 w-4" /></button>
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
            <div key={i} className="h-32 bg-slate-50 dark:bg-slate-800 animate-pulse rounded-xl" />
          ))
        ) : filteredTickets.length === 0 ? (
          <div className="py-10 text-center text-slate-400 italic">{t('admin_tickets.no_tickets_found')}</div>
        ) : filteredTickets.map((t_item) => (
          <Card key={t_item.id} className="p-4 shadow-sm rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 bg-white dark:bg-slate-900">
             <div className="flex justify-between items-start">
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t_item.request_code || 'N/A'}</p>
                 <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{t_item.description}</h3>
               </div>
               <Badge className={cn(
                  "rounded text-[9px] font-bold uppercase px-2 py-0.5",
                  t_item.status === "RESOLVED" || t_item.status === "CLOSED" ? "bg-emerald-50 text-emerald-600" :
                  t_item.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
               )}>
                 {t_item.status}
               </Badge>
             </div>
             <div className="grid grid-cols-2 gap-3 text-[12px] pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{locale === 'th' ? 'ผู้ส่ง' : 'Requester'}</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{t_item.employee?.employee_name_th || '-'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{t('common.category')}</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{t_item.category}</p>
                </div>
             </div>
             <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
               <span className="text-[10px] text-slate-400 font-bold">{new Date(t_item.createdAt).toLocaleDateString('en-GB')}</span>
               <div className="flex gap-1">
                 <button onClick={() => { setPreviewData(t_item); setIsPreviewModalOpen(true); }} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400"><Eye className="h-4 w-4" /></button>
                 <button onClick={() => openModal(t_item)} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400"><Edit2 className="h-4 w-4" /></button>
                 <button onClick={() => handleDelete(t_item.id)} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400"><Trash2 className="h-4 w-4" /></button>
               </div>
             </div>
          </Card>
        ))}
      </div>


      <Drawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? t('admin_tickets.process_ticket_title') : t('admin_tickets.create_ticket_title')}
        size="2xl"
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
            </div>
          )}

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
              <select
                required
                disabled={!!editingId}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none disabled:opacity-60"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              >
                <option value="">{t('requests.select_employee')}</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.employee_name_th}</option>)}
              </select>
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
              {editingTicket && editingTicket.approval_date && (
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
                  employees={employees}
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
              {editingTicket && editingTicket.it_approval_date && (
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
                  employees={employees}
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
              <option value="CLOSED">{locale === 'th' ? 'ปิดงาน' : 'CLOSED'}</option>
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
      </Drawer>

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
