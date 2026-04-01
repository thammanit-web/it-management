"use client";

import React, { useState } from "react";
import { 
  FileBox, 
  Users, 
  FileText, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Box,
  LayoutGrid,
  FileSpreadsheet,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/export-utils";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type ImportType = "PURCHASE_ORDER" | "REQUEST" | "EMPLOYEE_USER";

interface ImportStatus {
  success: boolean;
  message: string;
  count?: number;
}

export default function ImportPage() {
  const { t, locale } = useTranslation();
  const [selectedType, setSelectedType] = useState<ImportType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<ImportStatus | null>(null);

  const importOptions = [
    {
      id: "PURCHASE_ORDER" as ImportType,
      title: t('import.po_title'),
      thTitle: t('import.po_th_title'),
      description: t('import.po_desc'),
      icon: Box,
      template: [
        { 
          list: "MacBook Pro M2", 
          detail: "Apple MacBook Pro M2 13-inch 8/256GB", 
          quantity: 10, 
          reason_order: "For New Employee", 
          buyer: "Admin",
          status: "PENDING",
          reviewer: "Reviewer Name",
          approver: "Approver Name",
          date_order: "2024-03-25"
        }
      ]
    },
    {
      id: "REQUEST" as ImportType,
      title: t('import.request_title'),
      thTitle: t('import.request_th_title'),
      description: t('import.request_desc'),
      icon: FileText,
      template: [
        {
          request_code: "REQ20240325-001",
          employee_code: "EMP001",
          type_request: "Software",
          description: "ติดตั้ง Microsoft Office",
          reason: "เพื่อใช้ทำงานในแผนก",
          category: "SOFTWARE",
          priority: "MEDIUM",
          status: "OPEN"
        }
      ]
    },
    {
      id: "EMPLOYEE_USER" as ImportType,
      title: t('import.employee_user_title'),
      thTitle: t('import.employee_user_th_title'),
      description: t('import.employee_user_desc'),
      icon: Users,
      template: [
        {
          employee_code: "EMP001",
          employee_name_th: "สมชาย ใจดี",
          employee_name_en: "Somchai Jaidee",
          gender: "M",
          position: "Manager",
          department: "IT",
          work_location: "Head Office",
          username: "somchai.j",
          password: "password123",
          role: "user"
        }
      ]
    }
  ];

  const handleDownloadTemplate = (typeId: ImportType) => {
    const option = importOptions.find(o => o.id === typeId);
    if (option) {
      exportToCSV(option.template as any[], `template_${typeId.toLowerCase()}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedType) return;

    setIsUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", selectedType);

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        setStatus({
          success: true,
          message: result.message || "Import completed successfully",
          count: result.count
        });
        setFile(null);
        // Clear input
        const fileInput = document.getElementById("file-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setStatus({
          success: false,
          message: result.error || "Failed to import data"
        });
      }
    } catch (error) {
      setStatus({
        success: false,
        message: "An error occurred during upload"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 font-sans max-w-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-primary flex items-center gap-2 uppercase tracking-tight">
            <Upload className="h-6 w-6 text-primary" />
            {t('import.title')}
          </h1>
          <p className="text-[11px] font-black text-accent uppercase tracking-widest leading-none">
            {t('import.subtitle')}
          </p>
        </div>
      </header>

      {/* Import Type Selection */}
      <div className="grid grid-cols-3 gap-4 ">
        {importOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              setSelectedType(option.id);
              setStatus(null);
              setFile(null);
            }}
            className={cn(
              "group relative rounded-xl border border-slate-200 dark:border-slate-700 p-5 text-left transition-all duration-200",
              selectedType === option.id 
                ? "bg-primary text-white border-primary shadow-sm" 
                : "bg-surface hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-none"
            )}
          >
            <div className="grid sm:flex items-start gap-4">

              <div className="space-y-1 min-w-0">
                <h3 className={cn(
                  "text-[6px] font-black uppercase tracking-widest sm:text-[10px]",
                  selectedType === option.id ? "text-white/70" : "text-accent"
                )}>
                  {option.thTitle}
                </h3>
                <p className="text-[16px] font-black tracking-tight uppercase leading-none truncate sm:block hidden">
                  {option.title}
                </p>
              </div>
            </div>

            <div className={cn(
              "mt-4 pt-4 border-t flex items-center justify-between text-[10px] font-black uppercase tracking-widest",
              selectedType === option.id ? "border-white/10 text-white" : "border-slate-100 dark:border-slate-800 text-primary"
            )}>
              <span>{t('import.select_category')}</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </button>
        ))}
      </div>

      {/* Action Center - Refined Formal Layout */}
      {selectedType && (
        <div className="grid gap-4 animate-in slide-in-from-bottom-2 duration-500 ">
          {/* Main Interface */}
          <Card className="lg:col-span-8 p-6 rounded-xl border-slate-200 dark:border-slate-700 bg-surface shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-[16px] font-black text-primary uppercase tracking-tight leading-none">{t('import.workflow')}</h2>
                </div>
              </div>
              
              <Button
                onClick={() => handleDownloadTemplate(selectedType)}
                variant="outline"
                className="h-10 px-5 rounded-lg border-slate-200 dark:border-slate-700 font-black uppercase tracking-widest text-[14px] transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="mr-2 h-3.5 w-3.5" /> 
                {t('import.download_csv')}
              </Button>
            </div>

            <div className="space-y-4">
              <input
                type="file"
                id="file-upload"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className={cn(
                  "flex flex-col items-center justify-center w-full min-h-[220px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
                  file 
                    ? "border-primary/50 bg-primary/5" 
                    : "border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/10 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                )}
              >
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center transition-all",
                    file ? "bg-primary text-white" : "bg-white dark:bg-slate-800 text-slate-300 border border-slate-200 dark:border-slate-700"
                  )}>
                    {file ? <FileBox className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
                  </div>
                  
                  {file ? (
                    <div className="space-y-2">
                      <p className="text-[14px] font-black text-primary uppercase tracking-tight">{file.name}</p>
                      <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary px-3 py-0.5 rounded-full">
                         {(file.size / 1024).toFixed(2)} KB • READY
                      </Badge>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[14px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{t('import.click_browse')}</p>
                      <p className="text-[11px] font-bold text-accent uppercase tracking-widest">{t('import.csv_only')}</p>
                    </div>
                  )}
                </div>
              </label>

              <Button
                disabled={!file || isUploading}
                onClick={handleUpload}
                className={cn(
                  "w-full h-12 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all shadow-sm",
                  file ? "bg-primary hover:bg-primary-hover text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                )}
              >
                {isUploading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('import.syncing')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{t('import.execute_mass')}</span>
                  </div>
                )}
              </Button>

              {status && (
                <div className={cn(
                  "p-4 rounded-xl flex items-start gap-4 animate-in slide-in-from-top-1 duration-300",
                  status.success ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                )}>
                  {status.success ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                  <div className="space-y-1">
                    <p className="text-[13px] font-black uppercase tracking-tight">{status.success ? 'Success' : 'Error'}</p>
                    <p className="text-[12px] font-bold opacity-80">{status.message}{status.count ? ` (${status.count} items)` : ''}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

        </div>
      )}
    </div>
  );
}
