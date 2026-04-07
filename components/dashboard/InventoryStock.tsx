import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Package, ImageIcon, ShoppingBag } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface InventoryStockProps {
  inventory: any[];
}

export const InventoryStock: React.FC<InventoryStockProps> = ({ inventory }) => {
  const [viewingItem, setViewingItem] = useState<any | null>(null);
  const { t, locale } = useTranslation();

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
    <>
      <Card className="rounded-xl border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-zinc-50/10">
          <h2 className="text-[14px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <Package className="h-4 w-4 text-indigo-500" /> {locale === 'th' ? 'สต็อกอุปกรณ์ไอที' : 'IT INVENTORY STOCK'}
          </h2>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-50/30 dark:bg-slate-800/20">
          {inventory.filter(item => item.remaining > 0).map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => setViewingItem(item)}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer"
            >
              <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center mb-3 shadow-xs text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all overflow-hidden">
                {item.equipmentEntry?.purchaseOrder?.picture ? (
                  <img src={item.equipmentEntry.purchaseOrder.picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </div>
              <p className="text-[12px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight line-clamp-1 w-full" title={item.equipmentEntry?.list || 'Unknown'}>
                {item.equipmentEntry?.list || 'Unknown'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase w-full truncate">
                {item.equipmentEntry?.brand_name || '-'}
              </p>
              <div className="mt-4 bg-slate-50 dark:bg-slate-800 w-full py-2 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10">
                <p className="text-[11px] font-black text-[#0F1059] dark:text-indigo-400">
                  <span className="text-slate-400 font-bold mr-1">{locale === 'th' ? 'คงเหลือ:' : 'STOCK:'}</span>{item.remaining}
                </p>
              </div>
            </div>
          ))}
          {inventory.filter(item => item.remaining > 0).length === 0 && (
            <div className="col-span-full py-10 text-center flex flex-col items-center gap-2">
              <Package className="h-8 w-8 text-zinc-300" />
              <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">ไม่พบอุปกรณ์ในคลัง / No stock found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Equipment Specs Modal */}
      <Modal 
        isOpen={!!viewingItem} 
        onClose={() => setViewingItem(null)} 
        title={t('borrow.technical_spec')}
        size="lg"
      >
        <div className="space-y-4">
           {viewingItem?.equipmentEntry?.purchaseOrder?.picture ? (
              <div className="w-full h-64 rounded-xl overflow-hidden bg-secondary/30 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-inner">
                 <img src={viewingItem.equipmentEntry.purchaseOrder.picture} alt="" className="max-w-full max-h-full object-contain" />
              </div>
           ) : (
              <div className="w-full h-48 rounded-xl bg-secondary/20 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-700 text-accent">
                 <ShoppingBag className="h-10 w-10 opacity-20" />
              </div>
           )}

           <div className="space-y-3">
              <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{viewingItem?.equipmentEntry?.brand_name || t('borrow.generic_brand')}</span>
                    <Badge variant="secondary" className="rounded-lg text-[10px] font-black uppercase bg-primary/5 text-primary border-none">
                       {getItemTypeLabel(viewingItem?.equipmentEntry?.item_type)}
                    </Badge>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{viewingItem?.equipmentEntry?.list}</h3>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[100px] shadow-sm">
                 <p className="text-[14px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic whitespace-pre-line">
                    {viewingItem?.equipmentEntry?.purchaseOrder?.detail || t('borrow.no_additional_specs')}
                 </p>
              </div>

              <div className="flex items-center gap-2 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                 <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                    <Package className="h-4 w-4" />
                 </div>
                 <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase leading-none mb-1">{t('inventory.stock_count')}</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{viewingItem?.remaining} <span className="text-[11px] uppercase font-bold text-slate-400 ml-1">{viewingItem?.equipmentEntry?.unit || 'Units'}</span></p>
                 </div>
              </div>
           </div>

           <div className="pt-2">
              <Button onClick={() => setViewingItem(null)} variant="ghost" className="w-full h-12 rounded-xl text-slate-500 text-[11px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 active:scale-95 transition-all">
                {t('common.close')}
              </Button>
           </div>
        </div>
      </Modal>
    </>
  );
};
