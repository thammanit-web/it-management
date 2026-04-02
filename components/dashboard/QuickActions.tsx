"use client";

import { useState } from "react";
import { Ticket, PlusCircle, Plus, ClipboardCheck, Check, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { NewRequestDrawer } from "@/components/requests/NewRequestDrawer";
import { NewBorrowDrawer } from "@/components/borrow/NewBorrowDrawer";
import { useRouter } from "next/navigation";

export function QuickActions() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  
  const [isRequestDrawerOpen, setIsRequestDrawerOpen] = useState(false);
  const [isBorrowDrawerOpen, setIsBorrowDrawerOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState<{ id: string, type: 'request' | 'borrow', approvalNeeded: boolean } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const copyApprovalLink = (id: string, type: 'request' | 'borrow') => {
    const typeKey = type === 'request' ? 'r' : 'g';
    const url = `${window.location.origin}/approve/${id}?t=${typeKey}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const actions = [
    {
      title: t('dashboard.report_repair'),
      description: t('requests.subtitle'),
      icon: Ticket,
      color: "bg-blue-500",
      action: () => setIsRequestDrawerOpen(true),
      shadow: "shadow-blue-500/10",
    },
    {
      title: t('dashboard.request_equipment'),
      description: t('borrow.subtitle'),
      icon: PlusCircle,
      color: "bg-indigo-600",
      action: () => setIsBorrowDrawerOpen(true),
      shadow: "shadow-indigo-600/10",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {actions.map((action, i) => (
          <Card
            key={i}
            onClick={action.action}
            className="group relative overflow-hidden p-4 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-lg ${action.color} flex items-center justify-center text-white shadow-lg ${action.shadow} group-hover:scale-110 transition-transform duration-500`}>
                <action.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-0.5">
                <h3 className="font-black text-[10px] tracking-wider text-slate-900 dark:text-white uppercase leading-none">
                  {action.title}
                </h3>
              </div>
              <div className="h-9 w-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                <Plus className="h-4 w-4" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <NewRequestDrawer 
        isOpen={isRequestDrawerOpen} 
        onClose={() => setIsRequestDrawerOpen(false)} 
        onSuccess={(id, approvalNeeded) => setShowSuccess({ id, type: 'request', approvalNeeded })}
      />

      <NewBorrowDrawer 
        isOpen={isBorrowDrawerOpen} 
        onClose={() => setIsBorrowDrawerOpen(false)} 
        onSuccess={(id, approvalNeeded) => setShowSuccess({ id, type: 'borrow', approvalNeeded })}
      />

      {/* Success Modal */}
      <Modal
        isOpen={!!showSuccess}
        onClose={() => setShowSuccess(null)}
        title={t('requests.success_title')}
      >
        <div className="flex flex-col items-center text-center space-y-6 pt-4">
          <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center ring-8 ring-emerald-50/50">
            <ClipboardCheck className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-primary uppercase tracking-tight leading-tight">
              {t('requests.submitted_success')}
            </h3>
            <p className="text-xs font-bold text-accent uppercase tracking-widest max-w-[280px]">
              {showSuccess?.approvalNeeded 
                ? (locale === 'th' ? "กรุณาส่งลิงก์ให้ผู้อนุมัติเพื่อดำเนินการต่อ" : "Please send the link to your manager for approval.")
                : (locale === 'th' ? "ได้รับคำร้องของคุณแล้ว และอยู่ระหว่างดำเนินการ" : "Your request has been received and is being processed.")}
            </p>
          </div>

          {showSuccess?.approvalNeeded && (
            <div className="w-full space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-3">
                 <p className="text-[10px] font-black text-accent uppercase tracking-widest">{t('requests.manager_approval_link')}</p>
                 <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-[10px] font-mono font-bold text-primary truncate">
                       {window.location.origin}/approve/{showSuccess.id}?t={showSuccess.type === 'request' ? 'r' : 'g'}
                    </div>
                 </div>
                 <Button 
                    onClick={() => copyApprovalLink(showSuccess.id, showSuccess.type)}
                    className="w-full h-11 rounded-xl bg-primary hover:bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all font-sans"
                 >
                    {isCopied ? <><Check className="h-3.5 w-3.5 mr-2" /> {t('common.copied')}</> : <><LinkIcon className="h-3.5 w-3.5 mr-2" /> {t('common.copy_link')}</>}
                 </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 w-full pt-4">
            <Button 
              onClick={() => {
                const path = showSuccess?.type === 'request' ? '/user/my-requests' : '/user/borrow';
                router.push(path);
                setShowSuccess(null);
              }}
              variant="outline"
              className="h-12 rounded-xl text-primary text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {t('common.view_status')}
            </Button>
            <Button 
              onClick={() => setShowSuccess(null)}
              variant="ghost"
              className="h-10 rounded-xl text-zinc-400 text-[10px] font-black uppercase tracking-widest"
            >
              {t('common.close')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
