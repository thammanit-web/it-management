"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Loader2, Database, Laptop, Calendar as CalendarIcon, MapPin, ClipboardList } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { AssetInput } from "@/lib/validations/asset";
import { EmployeeSearchSelect, Employee } from "@/components/employee-search-select";
import { cn } from "@/lib/utils";

interface AssetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AssetInput) => Promise<void>;
  initialData?: AssetInput | null;
  employees: Employee[];
  equipmentEntries: any[];
}

export function AssetDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  employees,
  equipmentEntries,
}: AssetDrawerProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<AssetInput>({
    serial_number: "",
    type: "NOTEBOOK",
    name: "",
    brand: "",
    model: "",
    specs: "",
    purchase_date: "",
    warranty_expire: "",
    price: 0,
    status: "AVAILABLE",
    location: "Rayong Office",
    employeeId: null,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        purchase_date: initialData.purchase_date ? new Date(initialData.purchase_date).toISOString().split("T")[0] : "",
        warranty_expire: initialData.warranty_expire ? new Date(initialData.warranty_expire).toISOString().split("T")[0] : "",
      });
    } else {
      setFormData({
        serial_number: "",
        type: "NOTEBOOK",
        name: "",
        brand: "",
        model: "",
        specs: "",
        purchase_date: "",
        warranty_expire: "",
        price: 0,
        status: "AVAILABLE",
        location: "Rayong Office",
        employeeId: null,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectEquipEntry = (entryId: string) => {
    const entry = equipmentEntries.find((e) => e.id === entryId);
    if (entry) {
      setFormData((prev) => ({
        ...prev,
        name: entry.list || "",
        brand: entry.brand_name || "",
        purchase_date: entry.date_received ? new Date(entry.date_received).toISOString().split("T")[0] : prev.purchase_date,
      }));
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? t("assets.edit_asset") : t("assets.add_asset")}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-24 font-sans">
        {/* Quick Reference Section */}
        {!initialData && (
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Database className="h-3.5 w-3.5" />
              Quick Fill from Reception Cache
            </div>
            <select
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-primary/50 cursor-pointer"
              onChange={(e) => handleSelectEquipEntry(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>--- Select Received Equipment ---</option>
              {equipmentEntries.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.list} ({e.brand_name}) - {e.date_received ? new Date(e.date_received).toLocaleDateString() : "No Date"}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           {/* Section 1: Basic Info */}
           <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                 <Laptop className="h-4 w-4 text-primary" />
                 <span className="text-sm">Device Identification</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-slate-500">{t("assets.type")}</label>
                   <select
                     required
                     className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-primary/50 transition-all"
                     value={formData.type}
                     onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                   >
                     <option value="NOTEBOOK">NOTEBOOK</option>
                     <option value="PC">PC / DESKTOP</option>
                     <option value="SCREEN">SCREEN / MONITOR</option>
                     <option value="PRINTER">PRINTER</option>
                     <option value="OTHER">OTHER</option>
                   </select>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-slate-500">{t("assets.serial_number")}</label>
                   <input
                     required
                     className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-primary/50 transition-all placeholder:font-normal placeholder:text-slate-300"
                     value={formData.serial_number}
                     onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                     placeholder="SN123456789"
                   />
                 </div>

                 <div className="space-y-1.5 md:col-span-2">
                   <label className="text-xs font-semibold text-slate-500">Asset Name / Tag</label>
                   <input
                     required
                     className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-primary/50 transition-all"
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     placeholder="e.g. Notebook Admin 01"
                   />
                 </div>
              </div>
           </div>

           {/* Section 2: Hardware Specs */}
           <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                 <ClipboardList className="h-4 w-4 text-primary" />
                 <span className="text-sm">Hardware Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">{t("assets.brand")}</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-primary/50 transition-all"
                      value={formData.brand || ""}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. Dell, HP"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">{t("assets.model")}</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-primary/50 transition-all"
                      value={formData.model || ""}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g. Latitude 5420"
                    />
                 </div>
                 <div className="space-y-1.5 md:col-span-2">
                   <label className="text-xs font-semibold text-slate-500">{t("assets.specs")}</label>
                   <textarea
                     rows={2}
                     className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-primary/50 transition-all resize-none"
                     value={formData.specs || ""}
                     onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                     placeholder="CPU, RAM, Storage details..."
                   />
                 </div>
              </div>
           </div>

           {/* Section 3: Purchase & Warranty */}
           <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                 <CalendarIcon className="h-4 w-4 text-primary" />
                 <span className="text-sm">Timeline & Warranty</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-slate-500">{t("assets.purchase_date")}</label>
                   <input
                     type="date"
                     className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-primary/50 transition-all"
                     value={formData.purchase_date || ""}
                     onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-slate-500">{t("assets.warranty_expire")}</label>
                   <input
                     type="date"
                     className={cn(
                       "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-primary/50 transition-all",
                       formData.warranty_expire && new Date(formData.warranty_expire) < new Date() ? "text-rose-500 border-rose-200 bg-rose-50/50" : "text-slate-700"
                     )}
                     value={formData.warranty_expire || ""}
                     onChange={(e) => setFormData({ ...formData, warranty_expire: e.target.value })}
                   />
                 </div>
              </div>
           </div>

           {/* Section 4: Assignment & Status */}
           <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                 <MapPin className="h-4 w-4 text-primary" />
                 <span className="text-sm">Location & Assignment</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-slate-500">{t("assets.location")}</label>
                   <input
                     className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-primary/50 transition-all"
                     value={formData.location || ""}
                     onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                     placeholder="e.g. IT Room, Rayong"
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-slate-500">{t("assets.status")}</label>
                   <select
                     className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-primary/50 transition-all"
                     value={formData.status}
                     onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                   >
                     <option value="AVAILABLE">AVAILABLE</option>
                     <option value="IN_USE">IN USE</option>
                     <option value="REPAIR">REPAIR</option>
                     <option value="SCRAP">SCRAP / DISPOSAL</option>
                   </select>
                 </div>
                 <div className="space-y-1.5 md:col-span-2">
                   <label className="text-xs font-semibold text-slate-500">Employee Assignment</label>
                   <EmployeeSearchSelect
                     value={formData.employeeId || ""}
                     onChange={(val) => {
                       const emp = employees.find(e => e.id === val || e.employee_name_th === val || e.employee_name_en === val);
                       setFormData({ 
                         ...formData, 
                         employeeId: emp?.id || null, 
                         status: emp ? "IN_USE" : formData.status 
                       });
                     }}
                     employees={employees}
                     placeholder={t("assets.unassigned")}
                   />
                 </div>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-11 rounded-lg font-bold border border-slate-200">
            {t("common.cancel")}
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving}
            className="flex-1 h-11 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-md active:scale-95"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
