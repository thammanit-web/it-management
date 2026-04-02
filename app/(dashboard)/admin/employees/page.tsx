"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Loader2, User, ChevronUp, ChevronDown } from "lucide-react";
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
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface Employee {
  id: string;
  employee_code: string;
  employee_name_th: string;
  employee_name_en?: string | null;
  gender?: string | null;
  department?: string | null;
  position?: string | null;
  work_location?: string | null;
  supervisor_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
}

export default function EmployeesPage() {
  const { t, locale } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters & Sorting logic states
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Employee; direction: 'asc' | 'desc' }>({
    key: 'employee_name_th',
    direction: 'asc'
  });

  // Form State
  const [formData, setFormData] = useState({
    employee_code: "",
    employee_name_th: "",
    employee_name_en: "",
    gender: "MALE",
    department: "",
    position: "",
    work_location: "",
    supervisor_name: "",
    start_date: "",
    end_date: "",
    status: "ACTIVE"
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: keyof Employee) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredEmployees = employees
    .filter(emp => {
      const searchLow = search.toLowerCase();
      const matchesSearch = emp.employee_name_th.toLowerCase().includes(searchLow) ||
                           (emp.employee_name_en || "").toLowerCase().includes(searchLow) ||
                           emp.employee_code.toLowerCase().includes(searchLow);
      
      const matchesStatus = filterStatus === "ALL" || emp.status === filterStatus;
      const matchesDepartment = filterDepartment === "ALL" || emp.department === filterDepartment;
      
      return matchesSearch && matchesStatus && matchesDepartment;
    })
    .sort((a, b) => {
      const aValue = (a as any)[sortConfig.key] || "";
      const bValue = (b as any)[sortConfig.key] || "";
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const openDrawer = (employee: Employee | null = null) => {
    if (employee) {
      setSelectedEmployee(employee);
      setFormData({
        employee_code: employee.employee_code || "",
        employee_name_th: employee.employee_name_th || "",
        employee_name_en: employee.employee_name_en || "",
        gender: employee.gender || "MALE",
        department: employee.department || "",
        position: employee.position || "",
        work_location: employee.work_location || "",
        supervisor_name: employee.supervisor_name || "",
        start_date: employee.start_date ? new Date(employee.start_date).toISOString().split('T')[0] : "",
        end_date: employee.end_date ? new Date(employee.end_date).toISOString().split('T')[0] : "",
        status: employee.status || "ACTIVE"
      });
    } else {
      setSelectedEmployee(null);
      setFormData({
        employee_code: "",
        employee_name_th: "",
        employee_name_en: "",
        gender: "MALE",
        department: "",
        position: "",
        work_location: "",
        supervisor_name: "",
        start_date: "",
        end_date: "",
        status: "ACTIVE"
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = selectedEmployee 
        ? `/api/employees/${selectedEmployee.id}` 
        : "/api/employees";
      const method = selectedEmployee ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsDrawerOpen(false);
        fetchEmployees();
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/employees/${employeeToDelete}`, { method: "DELETE" });
      fetchEmployees();
      setIsDeleteModalOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  return (
    <div className="p-4 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase flex items-center gap-3">
             <div className="h-10 w-10 rounded-lg bg-[#0F1059] flex items-center justify-center text-white border border-slate-200 shadow-sm">
                <User className="h-5 w-5" />
             </div>
             {t('employees.title')}
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">{t('employees.subtitle')}</p>
        </div>
        <Button onClick={() => openDrawer()} className="rounded-lg bg-[#0F1059] hover:bg-black h-10 px-4 font-bold uppercase tracking-widest text-[12px] transition-all shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> {t('employees.add_employee')}
        </Button>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 group focus-within:border-[#0F1059]/30 transition-all md:col-span-2">
             <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-sm font-bold uppercase w-full placeholder:text-slate-400"
                placeholder={t('employees.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <select 
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold uppercase outline-none text-slate-600 focus:border-[#0F1059]/30 transition-all cursor-pointer"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">{t('employees.all_status')}</option>
          <option value="ACTIVE">{t('employees.status_active')}</option>
          <option value="RESIGNED">{t('employees.status_resigned')}</option>
        </select>

        <select 
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold uppercase outline-none text-slate-600 focus:border-[#0F1059]/30 transition-all cursor-pointer"
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
        >
          <option value="ALL">{t('employees.all_depts')}</option>
          {departments.map(dept => (
            <option key={dept} value={dept || ""}>{dept}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          {locale === 'th' ? `แสดง ${filteredEmployees.length} จาก ${employees.length} รายการ` : `Showing ${filteredEmployees.length} of ${employees.length} employees`}
        </p>
      </div>

      {/* Desktop View: Table */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full text-left">
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead 
                   className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                   onClick={() => handleSort('employee_name_th')}
                >
                  <div className="flex items-center gap-1">
                    {t('employees.employee_info')}
                    {sortConfig.key === 'employee_name_th' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                   className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                   onClick={() => handleSort('department')}
                >
                  <div className="flex items-center gap-1">
                    {t('employees.department')}
                    {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('employees.position')}</TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('employees.supervisor')}</TableHead>
                <TableHead 
                   className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                   onClick={() => handleSort('start_date')}
                >
                  <div className="flex items-center gap-1">
                    {t('employees.start_date')}
                    {sortConfig.key === 'start_date' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
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
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center text-slate-400 italic font-bold uppercase tracking-widest">
                      {t('employees.no_employees_found')}
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <div className="font-bold text-slate-900 text-sm">{emp.employee_name_th}</div>
                     <div className="flex items-center gap-2 mt-1">
                       <span className="font-bold text-[10px] text-[#0F1059] bg-[#0F1059]/5 px-1.5 py-0.5 rounded uppercase tracking-wide">{emp.employee_code}</span>
                       {emp.employee_name_en && <span className="text-[10px] text-slate-400 uppercase font-medium">{emp.employee_name_en}</span>}
                     </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <div className="text-sm font-bold text-slate-800">{emp.department || '-'}</div>
                     <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{emp.work_location || '-'}</div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <Badge variant="outline" className="rounded text-[9px] font-bold uppercase tracking-wider py-0.5 border-slate-200 bg-slate-50 text-slate-500">
                       {emp.position || '-'}
                     </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <span className="text-sm font-medium text-slate-600">{emp.supervisor_name || '-'}</span>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <span className="text-sm font-medium text-slate-600">
                       {emp.start_date ? new Date(emp.start_date).toLocaleDateString('en-GB') : '-'}
                     </span>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <Badge className={cn("rounded text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border-none", emp.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                        {emp.status === "ACTIVE" ? t('employees.status_active') : t('employees.status_resigned')}
                     </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap text-right">
                     <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                           onClick={() => openDrawer(emp)}
                           className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#0F1059] transition-all"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                           onClick={() => { setEmployeeToDelete(emp.id); setIsDeleteModalOpen(true); }}
                           className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 transition-all"
                        >
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
        ) : filteredEmployees.length === 0 ? (
          <div className="py-10 text-center text-slate-400 italic">{t('employees.no_employees_found')}</div>
        ) : filteredEmployees.map((emp) => (
          <Card key={emp.id} className="p-4 shadow-sm rounded-xl border border-slate-200 space-y-3 bg-white">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{emp.employee_code}</p>
                <h3 className="text-sm font-bold text-slate-900">{emp.employee_name_th}</h3>
              </div>
              <Badge className={cn("rounded text-[9px] font-bold uppercase px-2 py-0.5", emp.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                {emp.status === "ACTIVE" ? t('employees.status_active') : t('employees.status_resigned')}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px] pt-3 border-t border-slate-100">
               <div className="space-y-0.5">
                 <p className="text-[9px] font-bold text-slate-400 uppercase">{t('employees.department')}</p>
                 <p className="font-bold text-slate-700 truncate">{emp.department || '-'}</p>
               </div>
               <div className="space-y-0.5">
                 <p className="text-[9px] font-bold text-slate-400 uppercase">{t('employees.position')}</p>
                 <p className="font-bold text-slate-700 truncate">{emp.position || '-'}</p>
               </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold">{emp.start_date ? new Date(emp.start_date).toLocaleDateString('en-GB') : '-'}</span>
              <div className="flex gap-1">
                <button onClick={() => openDrawer(emp)} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-400"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => { setEmployeeToDelete(emp.id); setIsDeleteModalOpen(true); }} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title={selectedEmployee ? t('employees.edit_title') : t('employees.new_title')}
        size="xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('employees.employee_code')}</label>
              <input 
                required
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-[#0F1059] outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
                value={formData.employee_code}
                onChange={(e) => setFormData({...formData, employee_code: e.target.value})}
              />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('employees.gender')}</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#0F1059]/30 shadow-sm cursor-pointer transition-all"
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="MALE">{t('employees.gender_male')}</option>
                <option value="FEMALE">{t('employees.gender_female')}</option>
                <option value="OTHER">{t('employees.gender_other')}</option>
              </select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('employees.name_th')}</label>
              <input 
                required
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
                value={formData.employee_name_th}
                onChange={(e) => setFormData({...formData, employee_name_th: e.target.value})}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('employees.name_en')}</label>
              <input 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
                value={formData.employee_name_en}
                onChange={(e) => setFormData({...formData, employee_name_en: e.target.value})}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('employees.department')}</label>
              <input 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('employees.position')}</label>
              <input 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('employees.location')}</label>
              <input 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
                value={formData.work_location}
                onChange={(e) => setFormData({...formData, work_location: e.target.value})}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('employees.supervisor')}</label>
              <input 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
                value={formData.supervisor_name}
                onChange={(e) => setFormData({...formData, supervisor_name: e.target.value})}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('employees.start_date')}</label>
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('employees.end_date')}</label>
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('employees.employment_status')}</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-[#0F1059] uppercase outline-none shadow-sm cursor-pointer transition-all"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="ACTIVE">{t('employees.status_active')}</option>
                <option value="RESIGNED">{t('employees.status_resigned')}</option>
              </select>
          </div>
          
          <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsDrawerOpen(false)} className="flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest">
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#0F1059]/10"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={locale === 'th' ? "ยืนยันการลบข้อมูลพนักงาน" : "Confirm Delete Employee"}
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
                ? "ข้อมูลนี้จะถูกลบถาวร ไม่สามารถกู้คืนได้" 
                : "This action cannot be undone. All data for this employee will be permanently removed."}
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
