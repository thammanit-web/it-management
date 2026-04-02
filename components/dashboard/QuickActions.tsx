"use client";

import { useRouter } from "next/navigation";
import { Ticket, PlusCircle, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function QuickActions() {
  const router = useRouter();
  const { t } = useTranslation();

  const actions = [
    {
      title: t('dashboard.report_repair'),
      description: t('requests.subtitle'),
      icon: Ticket,
      color: "bg-blue-500",
      link: "/user/my-requests?action=new",
      shadow: "shadow-blue-500/10",
    },
    {
      title: t('dashboard.request_equipment'),
      description: t('borrow.subtitle'),
      icon: PlusCircle,
      color: "bg-indigo-600",
      link: "/user/borrow?action=new",
      shadow: "shadow-indigo-600/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {actions.map((action, i) => (
        <Card
          key={i}
          onClick={() => router.push(action.link)}
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
  );
}
