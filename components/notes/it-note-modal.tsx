"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, Info, Type, List, Shield, ShieldAlert, Share2, Paperclip, X, FileText, LayoutPanelTop, Eye } from "lucide-react";
import { ItNoteFormValues, ItNoteDetailFormValues } from "@/lib/validations/it-note";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface ItNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ItNoteFormValues) => Promise<void>;
  initialData?: any | null;
  isReadOnly?: boolean;
}

export function ItNoteModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isReadOnly = false,
}: ItNoteModalProps) {
  const { t, locale } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ItNoteFormValues>({
    title: "",
    content: "",
    isPrivate: false,
    isPublished: false,
    attachment: null,
    details: [],
  });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        content: initialData.content || "",
        isPrivate: initialData.isPrivate || false,
        isPublished: initialData.isPublished || false,
        attachment: initialData.attachment || null,
        details: initialData.details || [],
      });
      setShowPreview(!!initialData.attachment);
    } else {
      setFormData({
        title: "",
        isPrivate: false,
        isPublished: false,
        attachment: null,
        details: [],
      });
      setShowPreview(false);
    }
  }, [initialData, isOpen]);

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Allow general file upload, not just images (for word/excel/pdf)
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&folder=notes`, { 
        method: 'POST', 
        body: file 
      });
      if (res.ok) {
         const { url } = await res.json();
         setFormData({ ...formData, attachment: url });
         setShowPreview(true);
      } else {
         alert(t('notes.upload_failed') || 'Upload failed');
      }
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setIsUploading(false);
    }
  };

  const addDetailRow = () => {
    if (isReadOnly) return;
    setFormData((prev) => ({
      ...prev,
      details: [...prev.details, { label: "", value: "", order: prev.details.length }],
    }));
  };

  const removeDetailRow = (index: number) => {
    if (isReadOnly) return;
    setFormData((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };

  const updateDetailRow = (index: number, field: keyof ItNoteDetailFormValues, value: string) => {
    if (isReadOnly) return;
    setFormData((prev) => {
      const newDetails = [...prev.details];
      newDetails[index] = { ...newDetails[index], [field]: value };
      return { ...prev, details: newDetails };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReadOnly ? (t('notes.view_note') || "Technical Overview") : initialData ? t('notes.edit_note') : t('notes.create_note')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-2 font-sans uppercase">
        <div className="max-h-[70vh] overflow-y-auto px-1 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 gap-6">
            {/* Header Controls */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#0F1059] font-black tracking-tight">
                    <div className="h-7 w-7 rounded-lg bg-[#0F1059]/5 flex items-center justify-center">
                      <Type className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] uppercase tracking-widest">{t('notes.information')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={cn(
                        "flex items-center gap-2 px-2.5 py-1 rounded-lg transition-all shadow-sm border",
                        formData.isPrivate ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>
                      {formData.isPrivate ? <ShieldAlert className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                      <span className="text-[9px] font-black uppercase tracking-tight">
                        {formData.isPrivate ? "IT ONLY" : "PUBLIC WIKI"}
                      </span>
                    </div>
                    {formData.isPublished && (
                       <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                          <Share2 className="h-3 w-3" />
                          <span className="text-[9px] font-black uppercase tracking-tight">FRONT</span>
                       </div>
                    )}
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 group hover:bg-white transition-all">
                      <span className="text-[9px] font-black text-zinc-500 tracking-wider">IT PRIVATE (ADMINS ONLY):</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}
                        className={cn(
                          "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300",
                          formData.isPrivate ? "bg-rose-500 shadow-lg shadow-rose-500/20" : "bg-slate-200"
                        )}
                      >
                         <span className={cn("pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md transition-transform", formData.isPrivate ? "translate-x-5" : "translate-x-0")} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 group hover:bg-white transition-all">
                      <span className="text-[9px] font-black text-zinc-500 tracking-wider">PUBLISH TO DASHBOARD:</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                        className={cn(
                          "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300",
                          formData.isPublished ? "bg-[#0F1059] shadow-lg shadow-[#0F1059]/20" : "bg-slate-200"
                        )}
                      >
                         <span className={cn("pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md transition-transform", formData.isPublished ? "translate-x-5" : "translate-x-0")} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-2">
                 <div className="space-y-1.5 flex-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.title')}</label>
                   <input
                     required
                     readOnly={isReadOnly}
                     className={cn(
                      "w-full border rounded-lg px-4 py-3 text-sm font-black text-[#0F1059] uppercase outline-none transition-all shadow-sm",
                      isReadOnly ? "bg-white border-transparent shadow-none px-0 py-1 cursor-default text-lg" : "bg-slate-50 border-slate-100 focus:bg-white focus:border-[#0F1059]/30"
                     )}
                     value={formData.title}
                     onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                     placeholder="E.G. COMPANY EMERGENCY CALLS"
                   />
                 </div>
              </div>
            </div>

            {/* Technical Specs Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-[#0F1059] font-black tracking-tight">
                  <div className="h-7 w-7 rounded-lg bg-[#0F1059]/5 flex items-center justify-center">
                    <List className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] uppercase tracking-widest">TECHNICAL SPECIFICATIONS</span>
                </div>
                {!isReadOnly && (
                  <Button type="button" onClick={addDetailRow} variant="outline" className="h-8 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border-slate-200">
                    <Plus className="h-3 w-3 mr-1" /> ADD ROW
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                {formData.details.length === 0 && (
                   <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 bg-slate-50/50">
                      <p className="text-[9px] uppercase font-black tracking-[0.3em] opacity-40">NO SPECIFICATIONS DEFINED</p>
                   </div>
                )}
                {formData.details.map((detail, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <div className="flex-1">
                      <input
                        required
                        readOnly={isReadOnly}
                        className={cn(
                          "w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 text-[12px] font-black text-slate-500 uppercase outline-none focus:bg-white transition-all",
                          isReadOnly && "bg-zinc-50/50 border-none px-4"
                        )}
                        value={detail.label}
                        onChange={(e) => updateDetailRow(index, "label", e.target.value)}
                        placeholder="LABEL"
                      />
                    </div>
                    <div className="flex-2">
                      <input
                        required
                        readOnly={isReadOnly}
                        className={cn(
                          "w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-[12px] font-black text-[#0F1059] uppercase outline-none shadow-sm",
                          isReadOnly && "border-none px-4 shadow-none"
                        )}
                        value={detail.value}
                        onChange={(e) => updateDetailRow(index, "value", e.target.value)}
                        placeholder="VALUE"
                      />
                    </div>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => removeDetailRow(index)}
                        className="p-2.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Wiki Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0F1059] font-black tracking-tight border-b border-slate-100 pb-3">
                <div className="h-7 w-7 rounded-lg bg-[#0F1059]/5 flex items-center justify-center">
                  <Info className="h-4 w-4" />
                </div>
                <span className="text-[11px] uppercase tracking-widest">{t('notes.wiki_content') || "DOCUMENTATION CONTENT"}</span>
              </div>
              <textarea
                rows={5}
                readOnly={isReadOnly}
                className={cn(
                  "w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-[#0F1059] outline-none shadow-sm resize-none",
                  isReadOnly && "border-none shadow-none px-4 bg-zinc-50/30 min-h-[150px]"
                )}
                value={formData.content || ""}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="PROVIDE ADDITIONAL CONTEXT OR INSTRUCTIONS HERE..."
              />
            </div>
            
            {/* Attachment Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0F1059] font-black tracking-tight border-b border-slate-100 pb-3">
                <div className="h-7 w-7 rounded-lg bg-[#0F1059]/5 flex items-center justify-center">
                  <Paperclip className="h-4 w-4" />
                </div>
                <span className="text-[11px] uppercase tracking-widest">{locale === 'th' ? 'ไฟล์แนบ' : 'ATTACHMENT'} (IMAGE, EXCEL, WORD, PDF)</span>
              </div>
              
              {!formData.attachment ? (
                 !isReadOnly ? (
                    <div className="relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group p-6 flex flex-col items-center justify-center text-center">
                       <input 
                         type="file" 
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         onChange={handleFileUpload}
                         disabled={isUploading}
                         accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx"
                       />
                       {isUploading ? (
                          <div className="flex flex-col items-center text-[#0F1059]">
                             <Loader2 className="h-8 w-8 animate-spin mb-2" />
                             <span className="text-[10px] font-black uppercase tracking-widest">{t('notes.uploading') || 'UPLOADING...'}</span>
                          </div>
                       ) : (
                          <div className="flex flex-col items-center text-slate-400 group-hover:text-[#0F1059] transition-colors">
                             <Plus className="h-8 w-8 mb-2" />
                             <span className="text-[10px] font-black uppercase tracking-widest">{t('notes.click_to_attach') || 'CLICK TO ATTACH'}</span>
                          </div>
                       )}
                    </div>
                 ) : (
                    <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 bg-slate-50/50">
                       <p className="text-[9px] uppercase font-black tracking-[0.3em] opacity-40">{t('notes.no_info') || 'NO ATTACHMENT'}</p>
                    </div>
                 )
              ) : (
                 <div className="space-y-3">
                    <div className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex items-center gap-3 transition-all hover:border-[#0F1059]/30">
                       <div className="h-10 w-10 shrink-0 bg-[#0F1059]/5 rounded-lg flex items-center justify-center text-[#0F1059]">
                          <FileText className="h-5 w-5" />
                       </div>
                       <div className="flex-1 overflow-hidden">
                          <p className="text-[12px] font-black text-[#0F1059] uppercase truncate">
                            {formData.attachment.split('/').pop()}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                             <a href={formData.attachment} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-slate-400 hover:text-[#0F1059] transition-colors uppercase">
                               {t('notes.download') || 'DOWNLOAD'}
                             </a>
                             <span className="text-slate-300">•</span>
                             <button 
                               type="button"
                               onClick={() => setShowPreview(!showPreview)}
                               className="text-[10px] font-bold text-slate-400 hover:text-[#0F1059] transition-colors uppercase flex items-center gap-1"
                             >
                                <Eye className="h-3 w-3" />
                                {showPreview ? (t('notes.hide_preview') || 'HIDE PREVIEW') : (t('notes.show_preview') || 'SHOW PREVIEW')}
                             </button>
                          </div>
                       </div>
                       {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, attachment: null });
                              setShowPreview(false);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                       )}
                    </div>

                    {showPreview && formData.attachment && (
                       <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 min-h-[100px] animate-in zoom-in-95 duration-200">
                          {formData.attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                             <a href={formData.attachment} target="_blank" rel="noopener noreferrer" className="block relative group/img cursor-zoom-in">
                                <img src={formData.attachment} alt="Preview" className="w-full h-auto max-h-[800px] object-contain mx-auto transition-all group-hover/img:opacity-90" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/5">
                                   <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                      <Eye className="h-4 w-4 text-[#0F1059]" />
                                      <span className="text-[10px] font-black uppercase text-[#0F1059] tracking-widest">{t('notes.preview') || 'VIEW LARGE'}</span>
                                   </div>
                                </div>
                             </a>
                          ) : formData.attachment.match(/\.pdf$/i) ? (
                             <iframe 
                                src={`${formData.attachment}#toolbar=0`} 
                                className="w-full h-[600px] border-none"
                                title="PDF Preview"
                             />
                          ) : formData.attachment.match(/\.(xlsx|xls|doc|docx|ppt|pptx)$/i) ? (
                             <iframe 
                                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(formData.attachment)}`} 
                                className="w-full h-[600px] border-none"
                                title="Office Preview"
                             />
                          ) : (
                             <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <LayoutPanelTop className="h-10 w-10 mb-2 opacity-20" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t('notes.preview_not_supported') || 'PREVIEW NOT SUPPORTED'}</span>
                             </div>
                          )}
                       </div>
                    )}
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
            {isReadOnly ? "CLOSE" : "CANCEL"}
          </Button>
          {!isReadOnly && (
            <Button type="submit" disabled={isSaving} className="flex-1 h-12 rounded-lg bg-[#0F1059] hover:bg-[#1A1B7A] text-white text-[10px] font-black uppercase tracking-widest">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
