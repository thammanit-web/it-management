"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, ClipboardCheck, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { EmployeeSearchSelect } from "@/components/employee-search-select";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface InventoryItem {
  id: string;
  remaining: number;
  equipmentEntry?: {
    item_name: string;
    item_type: string;
    brand_name?: string;
    unit?: string;
    list?: string;
  }
}

interface NewBorrowDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (id: string, approvalNeeded: boolean) => void;
}

export function NewBorrowDrawer({
  isOpen,
  onClose,
  onSuccess
}: NewBorrowDrawerProps) {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
const [viewingItem, setViewingItem] = useState<any | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [invSearch, setInvSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    reason: "",
    approval: "",
    date_needed: new Date().toISOString().split('T')[0]
  });

  const [cart, setCart] = useState<{
    id: string,
    item?: InventoryItem,
    quantity: number,
    borrow_type: 'NEW' | 'BROKEN' | 'OTHER' | 'PURCHASE',
    remarks: string
  }[]>([]);

  useEffect(() => {
    if (isOpen && session) {
      fetchData();
      fetchEmployees();
    }
  }, [isOpen, session]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/equipment-lists");
      const data = await res.json();
      if (Array.isArray(data)) setInventory(data);
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

  const addToCart = (item: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: Math.min(i.quantity + 1, item.remaining) } : i);
      }
      return [...prev, {
        id: item.id,
        item,
        quantity: 1,
        borrow_type: 'NEW',
        remarks: ''
      }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateCartQuantity = (id: string, qty: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const updateCartItemDetails = (id: string, field: 'borrow_type' | 'remarks', value: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const needsApproval = cart.some(i => ["MAIN", "SOFTWARE"].includes(i.item?.equipmentEntry?.item_type || ""));
    if (needsApproval && !formData.approval) {
      setFormError(locale === 'th' ? "กรุณาระบุผู้อนุมัติ (หัวหน้างาน/ผู้จัดการแผนก)" : "Please specify an approver (Manager).");
      return;
    }
    setFormError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/equipment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({
            equipmentListId: i.item?.id || null,
            quantity: i.quantity,
            borrow_type: i.borrow_type,
            remarks: i.remarks
          })),
          reason: formData.reason,
          approval: formData.approval,
          date_needed: formData.date_needed
        })
      });

      if (res.ok) {
        const result = await res.json();
        onClose();
        if (onSuccess) {
          onSuccess(result.id, !!formData.approval);
        }
        setCart([]);
        setFormData({ reason: "", approval: "", date_needed: new Date().toISOString().split('T')[0] });
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'MAIN': return t('receiving.main_hw');
      case 'PERIPHERAL': return t('receiving.peripheral');
      case 'CONSUMABLE': return t('receiving.consumable');
      case 'SOFTWARE':
      case 'SOFTWARE_LICENSE': return t('receiving.software_license');
      case 'OTHER': return t('receiving.other');
      default: return type;
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('borrow.request_equipment')}
      size="5xl"
    >
      <form onSubmit={handleBorrow} className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full pb-6">
        <div className="space-y-4">
          <div className="bg-secondary/20 p-4 rounded-2xl border border-border/50 h-full flex flex-col">
            <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-4">1. {t('borrow.select_items')}</p>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-accent" />
              <input
                className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-3 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground shadow-sm"
                placeholder={t('borrow.search_store')}
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[400px]">
              {isLoading ? (
                <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : inventory
                .filter(item => {
                  const searchLow = invSearch.toLowerCase();
                  return (item.equipmentEntry?.list || "").toLowerCase().includes(searchLow) ||
                    (item.equipmentEntry?.brand_name || "").toLowerCase().includes(searchLow);
                })
                .map(item => {
                  const isInCart = cart.find(i => i.id === item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border shadow-sm group hover:border-primary/30 transition-all">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-black text-primary truncate uppercase">{item.equipmentEntry?.list}</p>
                          <Badge variant="outline" className="text-[7px] h-3.5 px-1 font-black uppercase bg-primary/5 text-primary border-primary/10">
                            {getItemTypeLabel(item.equipmentEntry?.item_type || "")}
                          </Badge>
                        </div>
                        <p className="text-[9px] font-bold text-accent uppercase tracking-tighter">{item.equipmentEntry?.brand_name} • {t('inventory.stock')}: {item.remaining}</p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => addToCart(item)}
                        disabled={!!isInCart || item.remaining === 0}
                        className={cn(
                          "h-9 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest",
                          isInCart ? "bg-emerald-50 text-emerald-500 border-none" : "bg-primary text-white"
                        )}
                      >
                        {item.remaining === 0 ? (locale === 'th' ? 'หมด' : 'OUT') : (isInCart ? <Check className="h-4 w-4" /> : t('borrow.pick'))}
                      </Button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:border-l lg:pl-6 border-border flex flex-col">
          <div className="flex-1 space-y-4">
            <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">2. {t('borrow.manage_selection')} ({cart.length})</p>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl text-[10px] font-black text-accent uppercase tracking-widest bg-secondary/10">{t('borrow.no_items_selected')}</div>
              ) : (
                cart.map(cartItem => (
                  <div key={cartItem.id} className="p-4 bg-surface border border-border rounded-xl shadow-sm space-y-4 group">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <p className="text-sm font-black text-primary truncate uppercase tracking-tight">{cartItem.item?.equipmentEntry?.list}</p>
                           <Badge variant="outline" className="text-[7px] h-3.5 px-1 font-black uppercase bg-primary/5 text-primary border-primary/10">
                              {getItemTypeLabel(cartItem.item?.equipmentEntry?.item_type || "")}
                           </Badge>
                        </div>
                        <div className="flex items-center bg-secondary w-fit px-2.5 py-1 rounded-lg border border-border mt-2 gap-3">
                          <button type="button" onClick={() => updateCartQuantity(cartItem.id, Math.max(1, cartItem.quantity - 1))} className="text-primary font-black hover:text-accent transition-colors">-</button>
                          <span className="text-[11px] font-black min-w-[20px] text-center">{cartItem.quantity}</span>
                          <button type="button" onClick={() => updateCartQuantity(cartItem.id, Math.min(cartItem.item?.remaining || 99, cartItem.quantity + 1))} className="text-primary font-black hover:text-accent transition-colors">+</button>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFromCart(cartItem.id)} className="p-2 rounded-lg text-accent hover:text-danger hover:bg-danger/5 transition-all"><X className="h-4 w-4" /></button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-secondary">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-accent uppercase tracking-widest ml-1">{t('borrow.borrow_type')}</p>
                        <select
                          className="w-full bg-secondary/50 border border-border rounded-lg px-2 py-2 text-[9px] font-black uppercase outline-none focus:ring-2 focus:ring-primary/5 transition-all"
                          value={cartItem.borrow_type}
                          onChange={(e) => updateCartItemDetails(cartItem.id, 'borrow_type', e.target.value as any)}
                        >
                          <option value="NEW">{locale === 'th' ? 'เบิกใหม่' : 'NEW'}</option>
                          <option value="BROKEN">{locale === 'th' ? 'ชำรุด' : 'BROKEN'}</option>
                          <option value="OTHER">{locale === 'th' ? 'อื่นๆ' : 'OTHER'}</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-accent uppercase tracking-widest ml-1">{t('borrow.remarks')}</p>
                        <input
                          className="w-full bg-secondary/50 border border-border rounded-lg px-2 py-2 text-[10px] font-bold outline-none focus:bg-surface focus:ring-2 focus:ring-primary/5 transition-all"
                          placeholder={t('borrow.remarks')}
                          value={cartItem.remarks}
                          onChange={(e) => updateCartItemDetails(cartItem.id, 'remarks', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border mt-auto">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">3. {t('borrow.request_info_step')}</p>
              <textarea
                required
                className="w-full bg-secondary/20 border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none min-h-[90px] focus:bg-surface transition-all placeholder:text-accent/50"
                placeholder={t('borrow.describe_purpose')}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>
            {cart.some(i => ["MAIN", "SOFTWARE"].includes(i.item?.equipmentEntry?.item_type || "")) && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">4. {t('borrow.approver')}</p>
                <EmployeeSearchSelect
                  value={formData.approval}
                  onChange={(val) => {
                    setFormData({ ...formData, approval: val });
                    if (val) setFormError(null);
                  }}
                  employees={employees}
                  placeholder={t('borrow.search_approver')}
                />
                {formError && <p className="text-[9px] font-black text-danger uppercase tracking-widest mt-1">! {formError}</p>}
              </div>
            )}
            <Button
              type="submit"
              disabled={isSaving || cart.length === 0}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white shadow-xl shadow-primary/20 text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ClipboardCheck className="h-5 w-5" /> {t('borrow.confirm_request')}</>}
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
