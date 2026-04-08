"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Laptop, 
  ChevronUp, 
  ChevronDown, 
  Calendar,
  MapPin,
  User as UserIcon,
  Filter
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
import { AssetDrawer } from "@/components/assets/asset-drawer";
import { getAssets, upsertAsset, deleteAsset } from "@/lib/actions/asset-actions";
import { AssetInput } from "@/lib/validations/asset";
import { useToast } from "@/components/ui/toast";
import {CardSkeleton } from "@/components/ui/skeleton";
import { NoResultsState } from "@/components/ui/empty-state";

export default function AssetsPage() {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [equipmentEntries, setEquipmentEntries] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<AssetInput | null>(null);
  
  // Pagination, Filters & Sorting logic states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'asset_code',
    direction: 'desc'
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssetsList();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterType, filterStatus, sortConfig, page]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterType, filterStatus, sortConfig]);

  const fetchInitialData = async () => {
    try {
      const [empRes, equipRes] = await Promise.all([
        fetch("/api/employees?limit=1000").then(res => res.json()),
        fetch("/api/equipment-entry-lists?limit=1000").then(res => res.json())
      ]);

      // API returns { data: [...] } for employees and { entries: [...] } for equipment
      if (empRes && Array.isArray(empRes.data)) {
        setEmployees(empRes.data);
      } else if (Array.isArray(empRes)) {
        setEmployees(empRes);
      }

      if (equipRes && Array.isArray(equipRes.entries)) {
        setEquipmentEntries(equipRes.entries);
      } else if (Array.isArray(equipRes)) {
        setEquipmentEntries(equipRes);
      }
    } catch (error) {
      console.error("Initial fetch error:", error);
    }
  };

  const fetchAssetsList = async () => {
    setIsLoading(true);
    try {
      const result = await getAssets({
        page,
        limit,
        search,
        type: filterType,
        status: filterStatus,
        sortField: sortConfig.key,
        sortOrder: sortConfig.direction
      });

      if (result.success) {
        setAssets(result.data);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 1);
      }
    } catch (error) {
      console.error("Fetch assets error:", error);
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

  const handleUpsert = async (data: AssetInput) => {
    const result = await upsertAsset(data);
    if (result.success) {
      toast({
        title: "Success",
        message: "Asset saved successfully",
        variant: "success"
      });
      fetchAssetsList();
      setIsDrawerOpen(false);
    } else {
      toast({
        title: "Error",
        message: result.error,
        variant: "error"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm_delete'))) return;
    const result = await deleteAsset(id);
    if (result.success) {
      toast({
        message: "Asset deleted successfully",
        variant: "success"
      });
      fetchAssetsList();
    }
  };

  const openDrawer = (asset: any = null) => {
    if (asset) {
      setSelectedAsset(asset);
    } else {
      setSelectedAsset(null);
    }
    setIsDrawerOpen(true);
  };

  const getWarrantyStatus = (expireDate: string | null) => {
    if (!expireDate) return { label: "N/A", color: "bg-slate-50 text-slate-400" };
    const expire = new Date(expireDate);
    const today = new Date();
    const diffTime = expire.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: t("assets.expired"), color: "bg-rose-50 text-rose-600" };
    if (diffDays <= 30) return { label: t("assets.expiring_soon"), color: "bg-amber-50 text-amber-600" };
    return { label: t("assets.active"), color: "bg-emerald-50 text-emerald-600" };
  };

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 mb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Laptop className="h-5 w-5 text-primary" />
              {t('assets.title')}
           </h1>
           <p className="text-sm font-medium text-slate-500">{t('assets.subtitle')}</p>
        </div>
        <Button onClick={() => openDrawer()} size="lg" className="rounded-lg bg-primary hover:bg-primary/90 font-bold shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> {t('assets.add_asset')}
        </Button>
      </header>

      {/* Filter Bar */}
      <Card className="p-4 rounded-xl border-slate-200 shadow-sm bg-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div className="md:col-span-2 relative group focus-within:border-primary transition-all">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary" />
               <input 
                  className="w-full pl-10 pr-4 py-2 text-sm font-medium border border-slate-200 rounded-lg outline-none focus:border-primary/50 transition-colors"
                  placeholder={t('assets.search_placeholder')}
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
              <option value="ALL">{t('assets.all_types')}</option>
              <option value="NOTEBOOK">NOTEBOOK</option>
              <option value="PC">PC / DESKTOP</option>
              <option value="SCREEN">SCREEN / MONITOR</option>
              <option value="PRINTER">PRINTER</option>
            </select>
          </div>

          <select 
            className="w-full px-4 py-2 appearance-none text-sm font-semibold border border-slate-200 rounded-lg outline-none text-slate-600 focus:border-primary/50 cursor-pointer transition-all bg-white"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">{t('assets.all_status')}</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="IN_USE">IN USE</option>
            <option value="REPAIR">REPAIR</option>
            <option value="SCRAP">SCRAP</option>
          </select>
        </div>
      </Card>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-200">
                <TableHead 
                   className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors"
                   onClick={() => handleSort('asset_code')}
                >
                  <div className="flex items-center gap-1">
                    {t('assets.asset_info')}
                    {sortConfig.key === 'asset_code' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('assets.location')}</TableHead>
                <TableHead className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('assets.holder')}</TableHead>
                <TableHead 
                  className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('warranty_expire')}
                >
                  <div className="flex items-center gap-1">
                    {t('assets.warranty_expire')}
                    {sortConfig.key === 'warranty_expire' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('assets.status')}</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="h-16 py-4 px-4 bg-slate-50/5">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-slate-100 animate-pulse" />
                            <div className="space-y-2 flex-1">
                               <div className="h-4 w-1/3 bg-slate-100 animate-pulse rounded" />
                               <div className="h-3 w-1/4 bg-slate-50 animate-pulse rounded" />
                            </div>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                      <NoResultsState query={search} onClear={() => setSearch("")} />
                  </TableCell>
                </TableRow>
              ) : assets.map((asset) => (
                <TableRow key={asset.id} className="hover:bg-slate-50 transition-colors group">
                  <TableCell className="py-3 px-4">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                           <Laptop className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{asset.name}</div>
                          <div className="text-[12px] text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                            <span className="text-primary/70 font-semibold">{asset.asset_code}</span>
                            <span className="text-slate-200">|</span>
                            <span>{asset.type}</span>
                          </div>
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                     <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-slate-300" />
                        {asset.location || '-'}
                     </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    {asset.employee ? (
                      <div className="flex flex-col">
                        <div className="text-[13px] font-semibold text-slate-900 flex items-center gap-1.5">
                          <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                          {asset.employee.employee_name_th}
                        </div>
                        <div className="text-[11px] font-medium text-slate-400 ml-5">{asset.employee.employee_code}</div>
                      </div>
                    ) : (
                      <span className="text-[12px] font-medium text-slate-300 italic">{t('assets.unassigned')}</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="text-[12px] font-medium text-slate-600 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-300" />
                        {asset.warranty_expire ? new Date(asset.warranty_expire).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB') : '-'}
                      </div>
                      {asset.warranty_expire && (
                        <div className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit", getWarrantyStatus(asset.warranty_expire).color)}>
                          {getWarrantyStatus(asset.warranty_expire).label}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                      <Badge className={cn(
                        "rounded-lg text-[10px] font-bold uppercase tracking-tight border-none shadow-none px-2.5 py-1", 
                        asset.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" : 
                        asset.status === "IN_USE" ? "bg-blue-100 text-blue-700" :
                        asset.status === "REPAIR" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                      )}>
                         {asset.status}
                      </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap text-right">
                     <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button 
                           variant="ghost" 
                           size="icon"
                           onClick={() => openDrawer(asset)}
                           className="h-8 w-8 rounded-lg hover:text-primary hover:bg-primary/5 transition-all"
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                           variant="ghost" 
                           size="icon"
                           onClick={() => handleDelete(asset.id)}
                           className="h-8 w-8 rounded-lg hover:text-rose-600 hover:bg-rose-50 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
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
                 {t('common.total')} {total} {t('assets.entry_count') || 'ASSETS'}
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
        ) : assets.length === 0 ? (
          <NoResultsState query={search} onClear={() => setSearch("")} />
        ) : (
          assets.map((asset) => (
            <Card key={asset.id} className="p-4 rounded-xl border-slate-200 shadow-sm space-y-3 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">{asset.name}</div>
                    <div className="text-[12px] text-slate-400 font-medium">#{asset.asset_code} • {asset.type}</div>
                  </div>
                </div>
                <Badge className={cn(
                  "rounded-lg text-[10px] font-bold uppercase border-none px-2 py-0.5 shadow-none", 
                  asset.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" : 
                  asset.status === "IN_USE" ? "bg-blue-100 text-blue-700" :
                  asset.status === "REPAIR" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                )}>
                  {asset.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-y-2 py-2 border-y border-slate-50">
                <div className="flex flex-col gap-0.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('assets.holder')}</div>
                  <div className="text-xs font-semibold text-slate-700 truncate">
                    {asset.employee?.employee_name_th || t('assets.unassigned')}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                   <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('assets.location')}</div>
                   <div className="text-xs font-semibold text-slate-700 truncate">{asset.location || '-'}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                 <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Calendar className="h-3.5 w-3.5 text-slate-300" />
                    {asset.warranty_expire ? new Date(asset.warranty_expire).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB') : '-'}
                 </div>
                 <div className="flex gap-2">
                    <Button 
                       variant="outline" 
                       size="sm" 
                       onClick={() => openDrawer(asset)}
                       className="rounded-lg h-9 px-4 border-slate-200"
                    >
                       <Edit2 className="w-3.5 h-3.5 mr-2" /> {t('common.edit')}
                    </Button>
                    <Button 
                       variant="outline" 
                       size="sm" 
                       onClick={() => handleDelete(asset.id)}
                       className="rounded-lg h-9 px-4 border-slate-200 text-rose-600 hover:bg-rose-50"
                    >
                       <Trash2 className="w-3.5 h-3.5 mr-2" /> {t('common.delete')}
                    </Button>
                 </div>
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

      <AssetDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleUpsert}
        initialData={selectedAsset}
        employees={employees}
        equipmentEntries={equipmentEntries}
      />
    </div>
  );
}
