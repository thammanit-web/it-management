"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ItNoteActions } from "./it-note-actions";
import { Shield, ShieldAlert, Clock, User2, Paperclip } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function ItNoteCards({ notes }: { notes: any[] }) {
  const { t, locale } = useTranslation();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {notes.map((note) => (
        <Card key={note.id} className="rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1.5 flex-1">
                <h3 className="text-[14px] font-black text-[#0F1059] group-hover:text-primary transition-colors uppercase leading-tight tracking-tight">
                  {note.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                   {note.isPrivate ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded-lg text-[9px] text-rose-500 font-bold uppercase tracking-widest shadow-sm">
                        <ShieldAlert className="h-2.5 w-2.5" />
                        {t("notes.private_it_only")}
                    </div>
                   ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[9px] text-emerald-500 font-bold uppercase tracking-widest shadow-sm">
                        <Shield className="h-2.5 w-2.5" />
                        {t("notes.public_wiki")}
                    </div>
                   )}
                   {note.attachment && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-lg text-[9px] text-blue-500 font-bold uppercase tracking-widest shadow-sm">
                        <Paperclip className="h-2.5 w-2.5" />
                        {locale === 'th' ? 'มีไฟล์แนบ' : 'ATTACHMENT'}
                      </div>
                   )}
                </div>
              </div>
              <ItNoteActions note={note} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {note.details.slice(0, 4).map((detail: any, id: number) => (
                <div key={id} className="flex flex-col gap-1 p-3.5 bg-slate-50 border border-slate-100 rounded-xl group-hover:bg-slate-100/50 transition-all">
                  <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {detail.label}
                  </span>
                  <span className="text-[14px] font-black text-[#0F1059] tracking-tight leading-normal truncate uppercase">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between opacity-70 group-hover:opacity-100 transition-opacity">
               <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span className="text-[10px] font-black tabular-nums text-slate-500 uppercase tracking-tighter">
                    {formatDate(note.updatedAt)}
                  </span>
               </div>
               <div className="flex items-center gap-1.5">
                  <User2 className="h-3 w-3 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {note.user?.username || t('common.unknown')}
                  </span>
               </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
