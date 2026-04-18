"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItNoteActions } from "./it-note-actions";
import { Globe, Lock, Share2, Paperclip } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ItNoteTable({ notes }: { notes: any[] }) {
  const { t } = useTranslation();

  return (
    <Card className="rounded-xl border-zinc-100 overflow-hidden bg-white/90 shadow-sm transition-all duration-300">
      <div className="overflow-x-auto">
        <Table className="w-full text-left font-sans">
          <TableHeader className="bg-zinc-50/50">
            <TableRow className="border-none">
              <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest w-[70%]">{t('common.title') || 'TITLE'}</TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest w-[15%] text-center">STATUS</TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest w-[15%] text-right">{t('common.actions') || 'ACTIONS'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-zinc-100">
            {notes.map((note) => (
              <TableRow key={note.id} className="group hover:bg-zinc-50/50 transition-all">
                <TableCell className="px-6 py-4">
                  <div className="font-bold text-[#0F1059] uppercase text-sm leading-tight group-hover:text-primary transition-colors mb-4">
                    {note.title}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {note.details.slice(0, 4).map((detail: any, id: number) => (
                      <div key={id} className="flex flex-col gap-1 p-3.5 bg-slate-50 border border-slate-100 rounded-xl group-hover:bg-slate-100/50 transition-all">
                        <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-none">
                          {detail.label}
                        </span>
                        <span className="text-[12px] font-black text-[#0F1059] tracking-tight leading-normal truncate uppercase">
                          {detail.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                   <div className="flex flex-col items-center gap-2">
                    {note.isPrivate ? (
                        <Badge className="bg-rose-50 text-rose-500 border-rose-200 text-[9px] font-black uppercase rounded-full px-3 py-1 shadow-none w-full justify-center">
                          <Lock className="h-2.5 w-2.5 mr-1" />
                          IT ONLY
                        </Badge>
                    ) : (
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[9px] font-black uppercase rounded-full px-3 py-1 shadow-none w-full justify-center">
                          <Globe className="h-2.5 w-2.5 mr-1" />
                          PUBLIC
                        </Badge>
                    )}
                    
                    {note.isPublished && (
                        <Badge className="bg-[#0F1059]/5 text-[#0F1059] border-[#0F1059]/10 text-[9px] font-black uppercase rounded-full px-3 py-1 shadow-none w-full justify-center">
                          <Share2 className="h-2.5 w-2.5 mr-1" />
                          DASHBOARD
                        </Badge>
                    )}
                    
                    {note.attachment && (
                        <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[9px] font-black uppercase rounded-full px-3 py-1 shadow-none w-full justify-center">
                          <Paperclip className="h-2.5 w-2.5 mr-1" />
                          {t('common.attached_file') || 'ATTACHMENT'}
                        </Badge>
                    )}
                   </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                   <ItNoteActions note={note} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100">
        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
           {t('common.total')} <span className="text-[#0F1059]">{notes.length}</span> {t('notes.entry_count') || 'RECORDS'}
        </div>
      </div>
    </Card>
  );
}
