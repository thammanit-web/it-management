"use client";

import React, { useEffect, useState } from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileOpener } from "@capacitor-community/file-opener";
import { Loader2, Eye, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface PDFPreviewProps {
  document: React.ReactElement<any>;
  filename: string;
}

export default function PDFPreview({ document, filename }: PDFPreviewProps) {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Detect environment on mount
    setIsMobile(Capacitor.isNativePlatform());
    setIsReady(true);
  }, []);

  const handleMobilePreview = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // 1. Convert doc to Blob
      const blob = await pdf(document).toBlob();
      
      // 2. Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(",")[1];
        const fileNameWithExt = `${filename || "document"}.pdf`;
        
        try {
          // 3. Write to File System
          const result = await Filesystem.writeFile({
            path: fileNameWithExt,
            data: base64Data,
            directory: Directory.Cache,
            recursive: true
          });

          // 4. Open with FileOpener
          await FileOpener.open({
            filePath: result.uri,
            contentType: "application/pdf"
          });
          
          toast({
            variant: "success",
            title: "เปิดเอกสารสำเร็จ",
            message: "กำลังเปิดไฟล์ PDF ด้วยโปรแกรมในเครื่อง"
          });
        } catch (fileError) {
          console.error("FileSystem/FileOpener Error:", fileError);
          toast({
            variant: "error",
            title: "ไม่สามารถเปิดไฟล์ได้",
            message: "โปรดตรวจสอบสิทธิ์การเข้าถึงไฟล์ในมือถือของคุณ"
          });
        } finally {
          setIsLoading(false);
        }
      };
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({
        variant: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถสร้างเอกสาร PDF ได้ในขณะนี้"
      });
      setIsLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-secondary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Mobile View: Shows a button to open PDF natively
  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center p-10 h-full w-full bg-secondary/20 rounded-2xl border border-dashed border-border/50">
        <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6 ring-8 ring-primary/5">
          <FileDown className="h-10 w-10" />
        </div>
        <div className="text-center space-y-2 mb-8">
          <h3 className="text-lg font-black text-primary uppercase tracking-tight">แสดงตัวอย่างสำหรับมือถือ</h3>
          <p className="text-[12px] font-bold text-accent uppercase tracking-widest leading-relaxed">คลิกปุ่มเพื่อเปิดเอกสารในโปรแกรมอ่านไฟล์</p>
        </div>
        <Button 
          onClick={handleMobilePreview} 
          disabled={isLoading}
          className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> กำลังประมวลผล...</>
          ) : (
            <><Eye className="h-4 w-4" /> เปิดดูเอกสาร PDF</>
          )}
        </Button>
      </div>
    );
  }

  // Desktop View: Uses the standard iframe viewer
  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-inner border border-border">
      <PDFViewer width="100%" height="100%" showToolbar={true} className="border-none">
        {document}
      </PDFViewer>
    </div>
  );
}
