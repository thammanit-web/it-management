"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Key, 
  Mail,
  AlertTriangle,
  Lock as LockIcon,
  Eye,
  ShieldCheck,
  User as UserIcon,
  Filter,
  Server,
  Network,
  Copy,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { CredentialDrawer } from "@/components/credentials/credential-drawer";
import { getCredentials, upsertCredential, deleteCredential, getCredentialDetails } from "@/lib/actions/credential-actions";
import { CredentialInput } from "@/lib/validations/credential";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { TableSkeleton, CardSkeleton } from "@/components/ui/skeleton";
import { NoResultsState } from "@/components/ui/empty-state";

export default function CredentialsPage() {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCredential, setSelectedCredential] = useState<any | null>(null);
  
  // Pagination, Filters & Sorting logic states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // Password decryption modal
  const [viewingPassword, setViewingPassword] = useState<{ isOpen: boolean; data: any | null }>({ isOpen: false, data: null });
  const [isDecrypting, setIsDecrypting] = useState(false);

  const [filterType, setFilterType] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'username',
    direction: 'asc'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchStaticData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCredentialsList();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterType, sortConfig, page]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterType, sortConfig]);

  const fetchStaticData = async () => {
    try {
      const empRes = await fetch("/api/employees?limit=1000").then(res => res.json());
      if (empRes && Array.isArray(empRes.data)) {
        setEmployees(empRes.data);
      } else if (Array.isArray(empRes)) {
        setEmployees(empRes);
      }
    } catch (error) {
       console.error("Static fetch error:", error);
    }
  };

  const fetchCredentialsList = async () => {
    setIsLoading(true);
    try {
      const result = await getCredentials({
        page,
        limit,
        search,
        type: filterType,
        sortField: sortConfig.key,
        sortOrder: sortConfig.direction
      });

      if (result.success) {
        setCredentials(result.data);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 1);
      }
    } catch (error) {
      console.error("Fetch credentials error:", error);
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

  const handleUpsert = async (data: CredentialInput) => {
    const result = await upsertCredential(data);
    if (result.success) {
      toast({
        title: "Success",
        message: "Credential saved and encrypted",
        variant: "success"
      });
      fetchCredentialsList();
      setIsDrawerOpen(false);
    } else {
      toast({ title: "Error", message: result.error || "Failed to save", variant: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm_delete'))) return;
    const result = await deleteCredential(id);
    if (result.success) {
      toast({ message: "Credential revoked successfully", variant: "success" });
      fetchCredentialsList();
    }
  };

  const handleViewPassword = async (id: string) => {
    setIsDecrypting(true);
    const result = await getCredentialDetails(id);
    setIsDecrypting(false);
    if (result.success) {
      setViewingPassword({ isOpen: true, data: result.data });
    } else {
      toast({ title: "Error", message: result.error || "Failed to decrypt", variant: "error" });
    }
  };

  const openDrawer = (cred: any = null) => {
    if (cred) {
      setSelectedCredential(cred);
    } else {
      setSelectedCredential(null);
    }
    setIsDrawerOpen(true);
  };

  const getAccountIcon = (types: string[]) => {
    if (types.includes("EMAIL")) return <Mail className="h-4 w-4" />;
    if (types.includes("VPN")) return <Network className="h-4 w-4" />;
    if (types.includes("FILE_SHARE") || types.includes("ERP")) return <Server className="h-4 w-4" />;
    return <Key className="h-4 w-4" />;
  };

  const getAccountColor = (types: string[]) => {
    if (types.includes("EMAIL")) return "bg-amber-50 text-amber-500 border-amber-100";
    if (types.includes("VPN")) return "bg-blue-50 text-blue-500 border-blue-100";
    if (types.includes("ERP")) return "bg-purple-50 text-purple-500 border-purple-100";
    return "bg-slate-50 text-slate-500 border-slate-100";
  };

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 mb-24 font-sans">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {t('credentials.title')}
           </h1>
           <p className="text-sm font-medium text-slate-500">{t('credentials.subtitle')}</p>
        </div>
        <Button onClick={() => openDrawer()} size="lg" className="rounded-lg bg-primary hover:bg-primary/90 font-bold px-6">
          <Plus className="mr-2 h-4 w-4" /> {t('credentials.add_credential')}
        </Button>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="p-4 rounded-xl border-slate-200 bg-white shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
               <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
               <div className="text-xl font-bold text-slate-900 leading-none">
                  {credentials.filter(c => c.employee?.status === "RESIGNED").length}
               </div>
               <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-1">Pending Revoke</div>
            </div>
         </Card>
         <Card className="p-4 rounded-xl border-slate-200 bg-white shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
               <Mail className="h-5 w-5" />
            </div>
            <div>
               <div className="text-xl font-bold text-slate-900 leading-none">
                  {credentials.filter(c => c.account_type.includes("EMAIL")).length}
               </div>
               <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-1">Email Accounts</div>
            </div>
         </Card>
         <Card className="p-4 rounded-xl border-slate-200 bg-white shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600">
               <Key className="h-5 w-5" />
            </div>
            <div>
               <div className="text-xl font-bold text-slate-900 leading-none">{credentials.length}</div>
               <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-1">Total Managed Access</div>
            </div>
         </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 rounded-xl border-slate-200 shadow-sm bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <div className="md:col-span-2 relative group focus-within:border-primary transition-all">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary" />
               <input 
                  className="w-full pl-10 pr-4 py-2 text-sm font-medium border border-slate-200 rounded-lg outline-none focus:border-primary/50 transition-colors"
                  placeholder={t('credentials.search_placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
               />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <select 
              className="w-full pl-10 pr-4 py-2 appearance-none text-sm font-semibold border border-slate-200 rounded-lg outline-none text-slate-600 focus:border-primary/50 cursor-pointer transition-all bg-white"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">{t('credentials.all_types')}</option>
              <option value="EMAIL">EMAIL / OUTLOOK</option>
              <option value="FILE_SHARE">FILE SERVER</option>
              <option value="VPN">VPN ACCESS</option>
              <option value="ERP">ERP SYSTEM</option>
              <option value="SOFTWARE">SPECIFIC SOFTWARE</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-200">
                <TableHead className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('credentials.employee')}</TableHead>
                <TableHead className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('credentials.account_type')}</TableHead>
                <TableHead 
                   className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors"
                   onClick={() => handleSort('username')}
                >
                  <div className="flex items-center gap-1">
                    {t('credentials.username')}
                    {sortConfig.key === 'username' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('credentials.email_address')}</TableHead>
                <TableHead className="w-[150px] text-right px-4">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                  <TableRow>
                     <TableCell colSpan={5} className="p-0">
                        <TableSkeleton rows={5} cols={5} />
                     </TableCell>
                  </TableRow>
              ) : credentials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                      <NoResultsState query={search} onClear={() => setSearch("")} />
                  </TableCell>
                </TableRow>
              ) : credentials.map((cred) => (
                <TableRow key={cred.id} className={cn("hover:bg-slate-50 transition-colors group", cred.employee?.status === "RESIGNED" && "bg-rose-50/20 hover:bg-rose-50/40")}>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-3">
                       <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <UserIcon className="h-4.5 w-4.5" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">
                            {locale === 'th' ? cred.employee?.employee_name_th : cred.employee?.employee_name_en}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest leading-none mt-0.5">{cred.employee?.employee_code}</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {cred.account_type.map((type: string) => (
                        <span key={type} className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tight border",
                          type === "EMAIL" ? "bg-amber-50 text-amber-600 border-amber-100" :
                          type === "VPN" ? "bg-blue-50 text-blue-600 border-blue-100" :
                          type === "ERP" ? "bg-purple-50 text-purple-600 border-purple-100" :
                          type === "FILE_SHARE" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          "bg-slate-50 text-slate-500 border-slate-100"
                        )}>
                          {t(`credentials.account_types.${type}`)}
                        </span>
                      ))}
                      {cred.employee?.status === "RESIGNED" && (
                         <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[9px] font-bold animate-pulse uppercase tracking-widest shadow-sm">REVOKE REQUIRED</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       <div className={cn(
                          "h-7 w-7 rounded-lg flex items-center justify-center border",
                          getAccountColor(cred.account_type)
                       )}>
                          {getAccountIcon(cred.account_type)}
                       </div>
                       <span className="font-bold text-slate-700 text-sm">{cred.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <span className="text-xs font-medium text-slate-500">{cred.email_address || "-"}</span>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            onClick={() => handleViewPassword(cred.id)}
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 transition-all"
                          >
                             {isDecrypting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button 
                            onClick={() => openDrawer(cred)}
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-all"
                          >
                             <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            onClick={() => handleDelete(cred.id)}
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                          >
                             <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                      </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination UI Desktop */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                 {t('common.total')} {total} {t('credentials.entry_count') || 'ACCOUNTS'}
              </div>
              <div className="flex items-center gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   disabled={page <= 1 || isLoading}
                   onClick={() => setPage(page - 1)}
                   className="h-9 rounded-lg border-slate-200 text-xs font-bold px-4 hover:bg-white transition-all disabled:opacity-30"
                 >
                   {t('common.previous')}
                 </Button>
                 <div className="flex items-center gap-1.5 px-3">
                    <span className="text-[13px] font-bold text-slate-900">{page}</span>
                    <span className="text-xs font-medium text-slate-300">/</span>
                    <span className="text-xs font-medium text-slate-400">{totalPages}</span>
                 </div>
                 <Button
                   variant="outline"
                   size="sm"
                   disabled={page >= totalPages || isLoading}
                   onClick={() => setPage(page + 1)}
                   className="h-9 rounded-lg border-slate-200 text-xs font-bold px-4 hover:bg-white transition-all disabled:opacity-30"
                 >
                   {t('common.next')}
                 </Button>
              </div>
          </div>
        </Card>
      </div>

      {/* Mobile Grid */}
      <div className="lg:hidden grid grid-cols-1 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : credentials.length === 0 ? (
          <NoResultsState query={search} onClear={() => setSearch("")} />
        ) : (
          credentials.map((cred) => (
            <Card key={cred.id} className={cn(
              "p-4 rounded-xl border-slate-200 shadow-sm space-y-3 bg-white",
              cred.employee?.status === "RESIGNED" && "border-rose-200 bg-rose-50/10"
            )}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <UserIcon className="h-5 w-5" />
                   </div>
                   <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">
                        {locale === 'th' ? cred.employee?.employee_name_th : cred.employee?.employee_name_en}
                      </div>
                      <div className="text-[12px] text-slate-400 font-medium leading-none">#{cred.employee?.employee_code}</div>
                   </div>
                </div>
                {cred.employee?.status === "RESIGNED" && (
                  <Badge variant="danger" className="rounded-lg text-[9px] font-bold py-0.5 animate-pulse uppercase tracking-widest shadow-sm">REVOKE</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 py-2">
                 <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span className="text-slate-400">Account</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                       {cred.account_type.map((t: string) => (
                         <span key={t} className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] uppercase">{t}</span>
                       ))}
                    </div>
                 </div>
                 <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span className="text-slate-400">Username</span>
                    <span>{cred.username}</span>
                 </div>
                 <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span className="text-slate-400">Email</span>
                    <span className="max-w-[150px] truncate lowercase">{cred.email_address || "-"}</span>
                 </div>
              </div>

              <div className="flex gap-2 pt-1">
                 <Button 
                   onClick={() => handleViewPassword(cred.id)}
                   className="flex-1 rounded-lg h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                 >
                    <Eye className="h-3.5 w-3.5 mr-2" /> View Pwd
                 </Button>
                 <Button 
                   variant="outline"
                   size="icon"
                   onClick={() => openDrawer(cred)}
                   className="h-9 w-9 rounded-lg border-slate-200"
                 >
                    <Edit2 className="h-3.5 w-3.5" />
                 </Button>
                 <Button 
                   variant="outline"
                   size="icon"
                   onClick={() => handleDelete(cred.id)}
                   className="h-9 w-9 rounded-lg border-slate-200 text-rose-600 hover:bg-rose-50"
                 >
                    <Trash2 className="h-3.5 w-3.5" />
                 </Button>
              </div>
            </Card>
          ))
        )}

        {/* Pagination UI Mobile */}
        {!isLoading && totalPages > 1 && (
           <div className="flex items-center gap-3 justify-center py-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-10 rounded-xl px-4 font-bold border-slate-200 shadow-sm"
              >
                 {t('common.previous')}
              </Button>
              <div className="text-sm font-bold text-slate-400">
                 {page} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="h-10 rounded-xl px-4 font-bold border-slate-200 shadow-sm"
              >
                 {t('common.next')}
              </Button>
           </div>
        )}
      </div>

      <CredentialDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleUpsert}
        initialData={selectedCredential}
        employees={employees}
      />

      <Modal 
        isOpen={viewingPassword.isOpen} 
        onClose={() => setViewingPassword({ isOpen: false, data: null })}
      >
         <div className="space-y-6 pt-4 pb-2">
            <div className="text-center space-y-1">
               <h3 className="text-lg font-bold text-slate-900">Credential Details</h3>
               <p className="text-xs font-medium text-slate-400">Access verified and logged for security.</p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-4 text-center">
               <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <LockIcon className="h-7 w-7" />
               </div>
               <div className="space-y-1 w-full">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Password</div>
                  <div className="text-2xl font-black text-slate-900 tracking-wider select-all font-mono py-2 bg-white rounded-lg border border-slate-200">
                     {viewingPassword.data?.password}
                  </div>
               </div>
               <Button 
                  className="w-full rounded-lg bg-primary text-white hover:bg-primary/90 h-10 text-sm font-bold transition-all"
                  onClick={() => {
                     navigator.clipboard.writeText(viewingPassword.data?.password);
                     toast({ message: "Password copied to clipboard", variant: "success" });
                  }}
               >
                  <Copy className="h-4 w-4 mr-2" /> Copy to Clipboard
               </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Username</div>
                  <div className="text-sm font-semibold text-slate-700">{viewingPassword.data?.username}</div>
               </div>
               <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</div>
                  <div className="text-sm font-semibold text-slate-700 truncate">
                    {Array.isArray(viewingPassword.data?.account_type) ? viewingPassword.data.account_type.join(', ') : viewingPassword.data?.account_type}
                  </div>
               </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 flex items-center justify-between text-white">
               <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <UserIcon className="h-5 w-5" />
                   </div>
                   <div>
                      <div className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Assigned Employee</div>
                      <div className="text-sm font-bold uppercase truncate max-w-[180px]">{viewingPassword.data?.employee?.employee_name_th}</div>
                   </div>
               </div>
               {viewingPassword.data?.employee?.status === "RESIGNED" && (
                  <Badge variant="danger" className="animate-pulse">RESIGNED</Badge>
               )}
            </div>
         </div>
      </Modal>
    </div>
  );
}
