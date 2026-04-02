"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Clock, Check, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Drawer } from "@/components/ui/drawer";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { EmployeeSearchSelect } from "@/components/employee-search-select";
import { cn } from "@/lib/utils";

interface NewRequestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (id: string, approvalNeeded: boolean) => void;
  initialType?: string;
  initialDescription?: string;
}

export function NewRequestDrawer({
  isOpen,
  onClose,
  onSuccess,
  initialType = "REPAIR",
  initialDescription = ""
}: NewRequestDrawerProps) {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  
  const [isSaving, setIsSaving] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [invSearch, setInvSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    description: initialDescription,
    reason: "",
    category: "GENERAL",
    priority: "LOW",
    type_request: initialType,
    type_request_other: "",
    employeeId: (session?.user as any)?.employeeId || "",
    approval: ""
  });

  useEffect(() => {
    if (isOpen && session) {
      fetchEmployees();
      fetchInventory();
      setFormData(prev => ({ 
        ...prev, 
        employeeId: (session.user as any).employeeId,
        description: initialDescription,
        type_request: initialType 
      }));
    }
  }, [isOpen, session, initialType, initialDescription]);

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/equipment-lists");
      const data = await res.json();
      if (Array.isArray(data)) setInventory(data);
    } catch (error) {
      console.error("Fetch inventory error:", error);
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

  const isStandard = ["SUPPORT", "PASSWORD_ACCOUNT", "BORROW_ACC", "REPAIR"].includes(formData.type_request);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStandard && !formData.approval) {
      setFormError(locale === 'th' ? "กรุณาระบุผู้อนุมัติ (หัวหน้างาน/ผู้จัดการแผนก)" : "Please specify an approver (Manager).");
      return;
    }
    setFormError(null);
    setIsSaving(true);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          approval_status: isStandard ? "APPROVED" : "PENDING",
          type_request: formData.type_request === "OTHER" ? formData.type_request_other : formData.type_request
        })
      });

      if (res.ok) {
        const data = await res.json();
        onClose();
        if (onSuccess) {
          onSuccess(data.id, !!(formData.approval && !isStandard));
        }
        setFormData({ ...formData, description: "", reason: "", approval: "", type_request: "REPAIR", type_request_other: "" });
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('requests.new_ticket_title')}
      size="2xl"
    >
      <form onSubmit={handleCreate} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('requests.request_type')}</label>
            <select
              required
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/20 transition-all font-sans"
              value={formData.type_request}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, type_request: val });
              }}
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

            {formData.type_request !== "" && (
              <div className={cn(
                "mt-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300",
                isStandard
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-amber-50 text-amber-600 border border-amber-100"
              )}>
                {isStandard ? (
                  <><Check className="h-3 w-3" /> {t('requests.standard_indicator')}</>
                ) : (
                  <><Clock className="h-3 w-3" /> {t('requests.approval_required_indicator')}</>
                )}
              </div>
            )}
          </div>

          {formData.type_request === "OTHER" && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
              <label className="text-[11px] font-black text-[#0F1059] uppercase tracking-widest">{t('requests.please_specify')}</label>
              <input
                required
                className="w-full bg-zinc-50 border border-[#0F1059]/30 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                placeholder={t('requests.please_specify') + "..."}
                value={formData.type_request_other}
                onChange={(e) => setFormData({ ...formData, type_request_other: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
              {formData.type_request === "PURCHASE" ? t('requests.purchase_items') : t('requests.problem_desc')}
            </label>

            {formData.type_request === "PURCHASE" && (
              <div className="mb-4 p-4 rounded-2xl bg-[#0F1059]/5 border border-[#0F1059]/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('requests.check_stock')}</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    className="w-full bg-white border border-zinc-100 rounded-xl pl-9 pr-4 py-2.5 text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-[#0F1059]/5"
                    placeholder={t('requests.search_available')}
                    value={invSearch}
                    onChange={(e) => setInvSearch(e.target.value)}
                  />
                </div>

                {invSearch.length > 0 && (
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                    {inventory
                      .filter(item => {
                        const s = invSearch.toLowerCase();
                        return (item.equipmentEntry?.list || "").toLowerCase().includes(s) ||
                          (item.equipmentEntry?.brand_name || "").toLowerCase().includes(s);
                      })
                      .slice(0, 5)
                      .map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, description: `${item.equipmentEntry?.list} [${item.equipmentEntry?.brand_name}]` });
                            setInvSearch("");
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-[#0F1059] hover:text-white border border-zinc-50 transition-all text-left group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black truncate">{item.equipmentEntry?.list}</p>
                            <p className="text-[8px] font-bold opacity-60 uppercase">{item.equipmentEntry?.brand_name} • {t('inventory.stock_count')}: {item.remaining}</p>
                          </div>
                          <Check className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            <textarea
              required
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[80px] focus:border-[#0F1059]/20 transition-all font-sans"
              placeholder={formData.type_request === "PURCHASE" ? t('requests.specify_details') : t('requests.fault_details')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('requests.reason_urgency')}</label>
            <textarea
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[80px] focus:border-[#0F1059]/20 transition-all font-sans"
              placeholder={t('requests.urgent_reason')}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>
        </div>

        {!isStandard && (
          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
            <label className="text-[11px] font-black text-[#0F1059] uppercase tracking-widest">{t('requests.approver')}</label>
            <EmployeeSearchSelect
              value={formData.approval}
              employees={employees}
              onChange={(val) => {
                setFormData({ ...formData, approval: val });
                if (val) setFormError(null);
              }}
              placeholder={t('requests.no_approval_option')}
            />
            {formError && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">! {formError}</p>}
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">* {t('requests.supervisor_needed_hint')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('common.category')}</label>
            <select
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none cursor-pointer focus:border-[#0F1059]/20 font-sans"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="HARDWARE">{t('categories.hardware')}</option>
              <option value="SOFTWARE">{t('categories.software')}</option>
              <option value="NETWORK">{t('categories.network')}</option>
              <option value="GENERAL">{t('categories.general')}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('common.priority')}</label>
            <select
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none cursor-pointer focus:border-[#0F1059]/20 font-sans"
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

        <div className="flex items-center gap-3 pt-4 border-t border-zinc-50">
          <Button
            type="submit"
            disabled={isSaving}
            className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest transition-all"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.submit')}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
