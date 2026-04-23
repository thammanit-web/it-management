"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  ExternalLink,
  Info,
  Ticket,
  Wrench,
  AlertTriangle,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from "recharts";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  userId: string | null;
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  employee?: {
    employee_name_th: string;
  }
}

export default function NotificationManagementPage() {
  const { t, locale } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  
  // New States for Sorting and Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Notification; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "INFO",
    userId: "",
    link: "",
  });

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications?adminView=true");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users?limit=1000");
      const result = await res.json();
      if (result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  };

  const openModal = (notification?: Notification) => {
    if (notification) {
      setEditingId(notification.id);
      setFormData({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        userId: notification.userId || "",
        link: notification.link || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        message: "",
        type: "INFO",
        userId: "",
        link: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingId ? `/api/notifications/${editingId}` : "/api/notifications";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: formData.userId === "" ? null : formData.userId,
          link: formData.link === "" ? null : formData.link,
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchNotifications();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save notification");
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
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) fetchNotifications();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`${t('common.confirm_delete')} (${selectedIds.length} ${t('common.items')})`)) return;
    
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchNotifications();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete notifications");
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
    }
  };

  const handleSort = (key: keyof Notification) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "TICKET": return <Ticket className="h-4 w-4" />;
      case "EQUIPMENT": return <Wrench className="h-4 w-4" />;
      case "ALERT": return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "TICKET": return "bg-blue-50 text-blue-600";
      case "EQUIPMENT": return "bg-purple-50 text-purple-600";
      case "ALERT": return "bg-rose-50 text-rose-600";
      default: return "bg-zinc-50 text-zinc-600";
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                         n.message.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "ALL" || n.type === filterType;
    return matchesSearch && matchesType;
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const valA = a[sortConfig.key];
    const valB = b[sortConfig.key];
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Calculate Chart Data
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const readCount = notifications.filter(n => n.isRead).length;
  const pieData = [
    { name: t('notifications.unread') || 'Unread', value: unreadCount, color: '#EF4444' },
    { name: t('notifications.read') || 'Read', value: readCount, color: '#10B981' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#0F1059] tracking-tighter uppercase leading-none flex items-center gap-3">
             <div className="h-12 w-12 rounded-lg bg-[#0F1059] flex items-center justify-center text-white border border-[#0F1059]/10 shadow-sm">
                <Bell className="h-6 w-6" />
             </div>
             {t('notifications.title')}
          </h1>
          <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-widest mt-2">{t('notifications.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button 
              variant="danger" 
              onClick={handleBulkDelete}
              className="rounded-lg h-12 px-6 font-black uppercase tracking-widest text-[13px] transition-all"
            >
              <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')} ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => openModal()} className="rounded-lg bg-[#0F1059] hover:bg-black h-12 px-8 font-black uppercase tracking-widest text-[13px] transition-all shadow-xl shadow-[#0F1059]/10">
            <Plus className="mr-2 h-4 w-4" /> {t('notifications.create')}
          </Button>
        </div>
      </header>

      {/* Stats and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 rounded-xl border-zinc-100 shadow-sm bg-white/50 flex flex-col items-center justify-center min-h-[300px]">
           <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-4 w-full text-left">{t('notifications.status_overview')}</h3>
           <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 shadow-xl rounded-xl border border-zinc-100">
                            <p className="text-[11px] font-black uppercase text-[#0F1059]">{payload[0].name}</p>
                            <p className="text-[14px] font-black text-zinc-900 mt-1">{payload[0].value} <span className="text-[10px] text-zinc-400 uppercase">{t('notifications.entry_count')}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    content={({ payload }: any) => (
                      <div className="flex justify-center gap-6 mt-4">
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
           </div>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
           <Card className="p-6 rounded-xl border-zinc-100 shadow-sm bg-white/50 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('notifications.unread')}</p>
                <h2 className="text-4xl font-black text-rose-500 mt-2">{unreadCount}</h2>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-100">
                 <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{t('notifications.requires_attention')}</p>
              </div>
           </Card>
           <Card className="p-6 rounded-xl border-zinc-100 shadow-sm bg-white/50 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('notifications.read')}</p>
                <h2 className="text-4xl font-black text-emerald-500 mt-2">{readCount}</h2>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-100">
                 <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{t('notifications.total_processed')}</p>
              </div>
           </Card>
           <Card className="p-6 rounded-xl border-zinc-100 shadow-sm bg-[#0F1059] flex flex-col justify-between text-white sm:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black text-white/50 uppercase tracking-widest">{t('common.total')}</p>
                  <h2 className="text-4xl font-black text-white mt-2">{notifications.length}</h2>
                </div>
                <Bell className="h-12 w-12 text-white/10" />
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                 <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{t('notifications.system_wide_broadcasts')}</p>
              </div>
           </Card>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center p-4 rounded-xl border border-zinc-100 bg-white/50 shadow-sm font-sans uppercase">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-lg border border-zinc-100 group focus-within:border-[#0F1059]/30 transition-all lg:col-span-3">
             <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase w-full"
                placeholder={t('notifications.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-2.5 text-[12px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30 font-sans cursor-pointer transition-all"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="ALL">{t('notifications.all_types')}</option>
          <option value="INFO">{t('notifications.type_info')}</option>
          <option value="TICKET">{t('notifications.type_ticket')}</option>
          <option value="EQUIPMENT">{t('notifications.type_equipment')}</option>
          <option value="ALERT">{t('notifications.type_alert')}</option>
        </select>
      </div>

      <Card className="rounded-xl border-zinc-100 overflow-hidden bg-white/90">
        <div className="overflow-x-auto">
          <Table className="w-full text-left font-sans">
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none">
                <TableHead className="w-[50px] px-6 py-5">
                   <Checkbox 
                      checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                      onCheckedChange={toggleSelectAll}
                   />
                </TableHead>
                <TableHead 
                   className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-1">
                    {t('notifications.title_label')}
                    {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                   className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-1">
                    {t('notifications.type_label')}
                    {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('notifications.target_user')}</TableHead>
                <TableHead 
                   className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    {t('common.date')}
                    {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
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
              ) : sortedNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-20 text-center text-zinc-400 italic font-bold uppercase tracking-widest">
                      {t('notifications.no_notifications_found')}
                  </TableCell>
                </TableRow>
              ) : sortedNotifications.map((notif) => (
                <TableRow key={notif.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <TableCell className="px-6 py-4">
                     <Checkbox 
                        checked={selectedIds.includes(notif.id)}
                        onCheckedChange={() => toggleSelect(notif.id)}
                     />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                     <div className="flex flex-col max-w-md">
                        <span className="font-black text-[#0F1059] uppercase tracking-tight text-sm truncate">{notif.title}</span>
                        <span className="text-[11px] text-zinc-500 font-medium line-clamp-1 mt-1">{notif.message}</span>
                        {notif.link && (
                          <div className="flex items-center gap-1 mt-1 text-blue-500 text-[10px] font-bold">
                            <ExternalLink className="h-3 w-3" />
                            {notif.link}
                          </div>
                        )}
                     </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                     <Badge className={cn("rounded-lg text-[10px] font-black uppercase tracking-widest px-3 py-1 border-none shadow-none", getTypeColor(notif.type))}>
                        <div className="flex items-center gap-1.5">
                          {getTypeIcon(notif.type)}
                          {t(`notifications.type_${notif.type.toLowerCase()}`)}
                        </div>
                     </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    {notif.userId ? (
                      <span className="text-[10px] font-bold text-[#0F1059]/60 bg-[#0F1059]/5 px-2 py-0.5 rounded uppercase">
                        {users.find(u => u.id === notif.userId)?.username || notif.userId}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        {t('notifications.all_users')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-zinc-400">
                      {new Date(notif.createdAt).toLocaleDateString('en-GB')}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                        <button onClick={() => openModal(notif)} className="p-2.5 rounded-lg bg-white border border-zinc-100 text-zinc-400 hover:text-[#0F1059] transition-all shadow-sm">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(notif.id)} className="p-2.5 rounded-lg bg-white border border-zinc-100 text-zinc-400 hover:text-rose-600 transition-all shadow-sm">
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
               {t('common.total')} {filteredNotifications.length} {t('notifications.entry_count')}
            </div>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? t('notifications.update_title') : t('notifications.new_title')}
      >
        <form onSubmit={handleSave} className="space-y-6 font-sans">
           <div className="space-y-1.5">
              <Label className="text-[13px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('notifications.title_label')}</Label>
              <Input 
                 required
                 className="h-12 bg-zinc-50 border-zinc-100 font-bold"
                 value={formData.title}
                 onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
           </div>

           <div className="space-y-1.5">
              <Label className="text-[13px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('notifications.message')}</Label>
              <Textarea 
                 required
                 className="bg-zinc-50 border-zinc-100 font-medium min-h-[100px]"
                 value={formData.message}
                 onChange={(e) => setFormData({...formData, message: e.target.value})}
              />
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <Label className="text-[13px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('notifications.type_label')}</Label>
                 <select 
                    className="w-full h-12 bg-zinc-50 border border-zinc-100 rounded-lg px-4 text-sm font-black text-[#0F1059] uppercase outline-none focus:border-[#0F1059]/30 shadow-sm transition-all cursor-pointer"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                 >
                    <option value="INFO">{t('notifications.type_info')}</option>
                    <option value="TICKET">{t('notifications.type_ticket')}</option>
                    <option value="EQUIPMENT">{t('notifications.type_equipment')}</option>
                    <option value="ALERT">{t('notifications.type_alert')}</option>
                 </select>
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[13px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('notifications.target_user')}</Label>
                 <select 
                    className="w-full h-12 bg-zinc-50 border border-zinc-100 rounded-lg px-4 text-sm font-bold outline-none focus:border-[#0F1059]/30 shadow-sm transition-all cursor-pointer"
                    value={formData.userId}
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                 >
                    <option value="">{t('notifications.all_users')}</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username} {u.employee ? `(${u.employee.employee_name_th})` : ''}
                      </option>
                    ))}
                 </select>
              </div>
           </div>

           <div className="space-y-1.5">
              <Label className="text-[13px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('notifications.link_placeholder')}</Label>
              <Input 
                 placeholder="https://..."
                 className="h-12 bg-zinc-50 border-zinc-100 font-medium"
                 value={formData.link}
                 onChange={(e) => setFormData({...formData, link: e.target.value})}
              />
           </div>

           <div className="flex items-center gap-3 pt-4 border-t border-zinc-50">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-lg text-[13px] font-black uppercase tracking-widest">
                 {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 h-12 rounded-lg bg-[#0F1059] hover:bg-black text-white text-[13px] font-black uppercase tracking-widest transition-all shadow-xl shadow-[#0F1059]/20"
              >
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
              </Button>
           </div>
        </form>
      </Modal>
    </div>
  );
}
