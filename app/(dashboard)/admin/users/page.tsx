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
import { Drawer } from "@/components/ui/drawer";
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const openDrawer = (user?: User) => {
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
    setIsDrawerOpen(true);
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
        setIsDrawerOpen(false);
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

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${userToDelete}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-none flex items-center gap-3">
             <div className="h-10 w-10 rounded-lg bg-[#0F1059] flex items-center justify-center text-white border border-slate-200 shadow-sm">
                <Users className="h-5 w-5" />
             </div>
             {t('users.title')}
          </h1>
          <p className="text-[12px] font-medium text-slate-500 uppercase tracking-widest mt-1">{t('users.subtitle')}</p>
        </div>
        <Button onClick={() => openDrawer()} className="rounded-lg bg-[#0F1059] hover:bg-black h-10 px-4 font-bold uppercase tracking-widest text-[11px] transition-all shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> {t('users.create_user')}
        </Button>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm font-sans uppercase">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 group focus-within:border-[#0F1059]/30 transition-all md:col-span-3">
             <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-sm font-bold uppercase w-full placeholder:text-slate-400"
                placeholder={t('users.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <select 
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold uppercase outline-none text-slate-600 focus:border-[#0F1059]/30 cursor-pointer transition-all"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="ALL">{t('users.all_roles')}</option>
          <option value="user">{t('users.role_user')}</option>
          <option value="admin">{t('users.role_admin')}</option>
        </select>
      </div>

      <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full text-left">
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead 
                   className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                   onClick={() => handleSort('username')}
                >
                  <div className="flex items-center gap-1">
                    {t('users.username')}
                    {sortConfig.key === 'username' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('users.linked_identity')}</TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('employees.code')}</TableHead>
                <TableHead 
                   className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                   onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-1">
                    {t('users.system_authority')}
                    {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="py-3 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="py-8 animate-pulse bg-slate-50/50" />
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-slate-400 italic font-bold uppercase tracking-widest">
                      {t('users.no_users_found')}
                  </TableCell>
                </TableRow>
              ) : filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                           <UserIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                           <span className="font-bold text-slate-900 text-sm">{user.username}</span>
                           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">UID: {user.id.slice(-8).toUpperCase()}</span>
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <div className="text-[11px] font-bold text-slate-700 uppercase">{user.employee?.employee_name_th || t('users.no_linked_identity')}</div>
                    <div className="text-[9px] text-slate-400 font-medium uppercase">{user.employee?.employee_name_en || '-'}</div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap text-[11px] font-bold text-slate-500">
                    {user.employee?.employee_code || '-'}
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <Badge 
                       className={cn("rounded text-[9px] font-bold uppercase tracking-wider px-2 py-0 border-none shadow-none", 
                         user.role === "admin" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                       )}
                     >
                        {user.role === 'admin' ? t('users.role_admin') : t('users.role_user')}
                     </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openDrawer(user)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#0F1059] transition-all shadow-sm">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setUserToDelete(user.id); setIsDeleteModalOpen(true); }} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 transition-all shadow-sm">
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
        ) : filteredUsers.length === 0 ? (
          <div className="py-10 text-center text-slate-400 italic">{t('users.no_users_found')}</div>
        ) : filteredUsers.map((user) => (
          <Card key={user.id} className="p-4 shadow-sm rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 shrink-0">
                  <UserIcon className="h-5 w-5 text-slate-400" />
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-bold text-slate-900 truncate">{user.username}</h3>
                     <Badge className={cn("text-[8px] font-bold uppercase py-0 border-none", 
                        user.role === "admin" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                     )}>
                        {user.role}
                     </Badge>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 truncate">{user.employee?.employee_name_th || t('users.no_linked_identity')}</p>
               </div>
               <div className="flex gap-1 shrink-0">
                  <button onClick={() => openDrawer(user)} className="p-1.5 text-slate-400 hover:text-[#0F1059]"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { setUserToDelete(user.id); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
               </div>
            </div>
          </Card>
        ))}
      </div>

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title={editingId ? t('users.update_title') : t('users.new_title')}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-6">
           <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('users.username')}</label>
              <input 
                 required
                 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:border-[#0F1059]/30 transition-all shadow-smplaceholder:text-slate-400"
                 value={formData.username}
                 onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
           </div>
           
           <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
                 {editingId ? t('users.password_reset') : t('users.password_default')}
              </label>
              <input 
                 required={!editingId}
                 type="password"
                 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:border-[#0F1059]/30 transition-all shadow-sm"
                 placeholder={editingId ? t('users.password_placeholder') : "••••••••"}
                 value={formData.password}
                 onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('users.system_authority')}</label>
                 <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-[#0F1059] uppercase outline-none focus:border-[#0F1059]/30 shadow-sm transition-all cursor-pointer"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                 >
                    <option value="user">{t('users.role_user')}</option>
                    <option value="admin">{t('users.role_admin')}</option>
                 </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('users.linked_identity')}</label>
                 <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-[#0F1059]/30 shadow-sm transition-all cursor-pointer"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                 >
                    <option value="">{t('users.no_linked_identity')}</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.employee_name_th}</option>)}
                 </select>
              </div>
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
        title={locale === 'th' ? "ยืนยันการลบผู้ใช้งาน" : "Confirm Delete User"}
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
                 ? "ข้อมูลบัญชีผู้ใช้งานนี้จะถูกลบลบถาวร" 
                 : "This action cannot be undone. This user account will be permanently removed from the system."}
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
