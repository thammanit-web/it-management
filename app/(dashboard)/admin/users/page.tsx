"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Users, Plus, Edit2, Trash2, User as UserIcon, ChevronUp, ChevronDown } from "lucide-react";
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
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface User {
  id: string;
  username: string;
  role: string;
  employee?: {
    employee_name_th: string;
    employee_code: string;
    employee_name_en: string;
  }
}

interface Employee {
  id: string;
  employee_name_th: string;
}

export default function UsersPage() {
  const { t, locale } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters & Sorting logic states
  const [filterRole, setFilterRole] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' }>({
    key: 'username',
    direction: 'asc'
  });

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "user",
    employeeId: ""
  });

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (error) {
      console.error("Fetch users error:", error);
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

  const handleSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredUsers = users
    .filter(user => {
      const searchLow = search.toLowerCase();
      const matchesSearch = user.username.toLowerCase().includes(searchLow) ||
                           (user.employee?.employee_name_th || "").toLowerCase().includes(searchLow);
      
      const matchesRole = filterRole === "ALL" || user.role === filterRole;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aValue: any = "";
      let bValue: any = "";

      if (sortConfig.key === 'username') {
        aValue = a.username || "";
        bValue = b.username || "";
      } else if (sortConfig.key === 'role') {
        aValue = a.role || "";
        bValue = b.role || "";
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const openModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        username: user.username,
        password: "", 
        role: user.role,
        employeeId: (user as any).employeeId || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        username: "",
        password: "",
        role: "user",
        employeeId: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingId ? `/api/users/${editingId}` : "/api/users";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to save user");
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
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#0F1059] tracking-tighter uppercase leading-none flex items-center gap-3">
             <div className="h-12 w-12 rounded-2xl bg-[#0F1059] flex items-center justify-center text-white border border-[#0F1059]/10 shadow-sm">
                <Users className="h-6 w-6" />
             </div>
             {t('users.title')}
          </h1>
          <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-widest mt-2">{t('users.subtitle')}</p>
        </div>
        <Button onClick={() => openModal()} className="rounded-2xl bg-[#0F1059] hover:bg-black h-14 px-8 font-black uppercase tracking-widest text-[13px] transition-all shadow-xl shadow-[#0F1059]/10">
          <Plus className="mr-2 h-4 w-4" /> {t('users.create_user')}
        </Button>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center p-4 rounded-3xl border border-zinc-100 bg-white/50 shadow-sm font-sans uppercase">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-2xl border border-zinc-100 group focus-within:border-[#0F1059]/30 transition-all lg:col-span-3">
             <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase w-full"
                placeholder={t('users.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-2.5 text-[12px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30 font-sans cursor-pointer transition-all"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="ALL">{t('users.all_roles')}</option>
          <option value="user">{t('users.role_user')}</option>
          <option value="admin">{t('users.role_admin')}</option>
        </select>
      </div>

      <Card className="rounded-[40px] border-zinc-100 overflow-hidden bg-white/90">
        <div className="overflow-x-auto">
          <Table className="w-full text-left font-sans">
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none">
                <TableHead 
                   className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('username')}
                >
                  <div className="flex items-center gap-1">
                    {t('users.username')}
                    {sortConfig.key === 'username' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('users.linked_identity')}</TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{locale === 'th' ? 'รหัสพนักงาน' : 'EMP CODE'}</TableHead>
                <TableHead 
                   className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-1">
                    {t('users.system_authority')}
                    {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{locale === 'th' ? 'วันที่สร้าง' : 'CREATED'}</TableHead>
                <TableHead className="p-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-24 animate-pulse bg-zinc-50/20" />
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-20 text-center text-zinc-400 italic font-bold uppercase tracking-widest">
                      {t('users.no_users_found')}
                  </TableCell>
                </TableRow>
              ) : filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 group-hover:bg-white transition-colors shadow-sm">
                           <UserIcon className="h-5 w-5 text-zinc-400" />
                        </div>
                        <div className="flex flex-col">
                           <span className="font-black text-[#0F1059] uppercase tracking-tight text-sm">{user.username}</span>
                           <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-none mt-1">UID: {user.id.slice(-8).toUpperCase()}</span>
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <div className="text-[11px] font-black text-zinc-700 uppercase">{user.employee?.employee_name_th || t('users.no_linked_identity')}</div>
                    <div className="text-[9px] text-zinc-400 font-medium uppercase mt-0.5">{user.employee?.employee_name_en || '-'}</div>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-[#0F1059]/60 bg-[#0F1059]/5 px-2 py-0.5 rounded uppercase">
                      {user.employee?.employee_code || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                     <Badge 
                       className={cn("rounded-lg text-[10px] font-black uppercase tracking-widest px-3 py-1 border-none shadow-none", 
                         user.role === "admin" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                       )}
                     >
                        {user.role === 'admin' ? t('users.role_admin') : t('users.role_user')}
                     </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-zinc-400">
                      {(user as any).createdAt ? new Date((user as any).createdAt).toLocaleDateString('en-GB') : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                        <button onClick={() => openModal(user)} className="p-2.5 rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-[#0F1059] transition-all shadow-sm">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-2.5 rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-rose-600 transition-all shadow-sm">
                          <Trash2 className="w-4 h-4" />
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
        title={editingId ? t('users.update_title') : t('users.new_title')}
      >
        <form onSubmit={handleSave} className="space-y-6 font-sans">
           <div className="space-y-1.5">
              <label className="text-[13px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('users.username')}</label>
              <input 
                 required
                 className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/30 transition-all shadow-sm"
                 value={formData.username}
                 onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
           </div>
           
           <div className="space-y-1.5">
              <label className="text-[13px] font-black text-zinc-400 uppercase tracking-widest px-1">
                 {editingId ? t('users.password_reset') : t('users.password_default')}
              </label>
              <input 
                 required={!editingId}
                 type="password"
                 className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/30 transition-all shadow-sm"
                 placeholder={editingId ? t('users.password_placeholder') : "••••••••"}
                 value={formData.password}
                 onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-[13px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('users.system_authority')}</label>
                 <select 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-black text-[#0F1059] uppercase outline-none focus:border-[#0F1059]/30 shadow-sm transition-all cursor-pointer"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                 >
                    <option value="user">{t('users.role_user')}</option>
                    <option value="admin">{t('users.role_admin')}</option>
                 </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[13px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('users.linked_identity')}</label>
                 <select 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#0F1059]/30 shadow-sm transition-all cursor-pointer"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                 >
                    <option value="">{t('users.no_linked_identity')}</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.employee_name_th}</option>)}
                 </select>
              </div>
           </div>

           <div className="flex items-center gap-3 pt-4 border-t border-zinc-50">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl text-[13px] font-black uppercase tracking-widest">
                 {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-black text-white text-[13px] font-black uppercase tracking-widest transition-all shadow-xl shadow-[#0F1059]/20"
              >
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
              </Button>
           </div>
        </form>
      </Modal>
    </div>
  );
}
