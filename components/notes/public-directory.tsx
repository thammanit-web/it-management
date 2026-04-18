"use client";

import { useEffect, useState } from "react";
import { getPublishedNotes } from "@/lib/actions/it-notes";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, Search, Eye, Paperclip } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { ItNoteModal } from "./it-note-modal";

export function PublicDirectory() {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal State
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const data = await getPublishedNotes();
        setNotes(data);
      } catch (error) {
        console.error("Fetch library error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  const handleView = (note: any) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const filtered = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content?.toLowerCase().includes(search.toLowerCase()) ||
    n.details.some((d: any) => d.value.toLowerCase().includes(search.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Loading Directory...</p>
        </div>
      </div>
    );
  }

  if (notes.length === 0) return null;

  return (
    <>
      <div className="space-y-6 bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
                <h2 className="text-[14px] font-black text-[#0F1059] dark:text-white uppercase tracking-widest leading-none">
                  {t('directory.title') || "Corporate Directory"}
                </h2>
                <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1 tracking-tight">
                  {t('directory.subtitle') || "Email & Internal Extension Lists"}
                </p>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
            <input 
                type="text"
                placeholder={t('directory.search_placeholder') || "SEARCH NAMES, EMAIL, OR EXTENSION..."}
                className="pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:bg-white focus:border-primary/30 transition-all w-full md:w-80"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop Version: Table */}
        <div className="hidden lg:block overflow-hidden border border-zinc-100 dark:border-zinc-800 rounded-xl">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
              <TableRow className="border-none">
                <TableHead className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {t('directory.dept_title') || "Department / Title"}
                </TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {t('directory.details') || "Details"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((note) => (
                <TableRow key={note.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                  <TableCell className="px-6 py-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[14px] font-black text-[#0F1059] dark:text-zinc-200 uppercase tracking-tight">{note.title}</p>
                        <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase truncate max-w-xs">{note.content}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {note.attachment && <Paperclip className="h-4 w-4 text-blue-500" />}
                        <button 
                          onClick={() => handleView(note)}
                          className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-primary hover:bg-primary/5 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                        {note.details.map((d: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg shadow-sm">
                            <span className="text-[10px] font-black text-zinc-400 uppercase leading-none">{d.label}:</span>
                            <span className="text-[13px] font-black text-primary uppercase leading-none">{d.value}</span>
                            {d.value.match(/^[0-9+()-\s]{4,15}$/) || d.label.toLowerCase().includes('tel') ? (
                                <a href={`tel:${d.value}`} className="text-zinc-300 hover:text-emerald-500 transition-colors">
                                  <Phone size={12} />
                                </a>
                            ) : d.value.includes('@') ? (
                                <a href={`mailto:${d.value}`} className="text-zinc-300 hover:text-blue-500 transition-colors">
                                  <Mail size={12} />
                                </a>
                            ) : null}
                          </div>
                        ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Version: Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
          {filtered.map((note) => (
            <Card key={note.id} className="border-zinc-100 dark:border-zinc-800 shadow-sm rounded-xl group overflow-hidden">
              <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <h3 className="text-[13px] font-black text-[#0F1059] dark:text-zinc-200 uppercase leading-tight">{note.title}</h3>
                  <div className="flex items-center gap-2">
                    {note.attachment && <Paperclip className="h-4 w-4 text-blue-500" />}
                    <button 
                      onClick={() => handleView(note)}
                      className="p-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-400 hover:text-primary transition-all"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
              </div>
              <CardContent className="p-0">
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {note.details.map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3.5">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{d.label}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-[14px] font-black text-primary uppercase">{d.value}</span>
                            {d.value.match(/^[0-9+()-\s]{4,15}$/) || d.label.toLowerCase().includes('tel') ? (
                              <a href={`tel:${d.value}`} className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                <Phone size={14} />
                              </a>
                            ) : d.value.includes('@') ? (
                              <a href={`mailto:${d.value}`} className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                <Mail size={14} />
                              </a>
                            ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ItNoteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async () => {}} // Read-only
        initialData={selectedNote}
        isReadOnly={true}
      />
    </>
  );
}
