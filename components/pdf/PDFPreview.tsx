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
      // 1. Generate PDF as Uint8Array (More stable on Android APK than toBlob)
      const instance = pdf(document);
      const uint8Array = await (instance as any).toUint8Array();
      
      // 2. Convert Uint8Array to Base64 (Faster and avoids DOM/FileReader unreliability)
      let binary = '';
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Data = window.btoa(binary);
      
      const fileNameWithExt = `${filename || "document"}.pdf`;
      
      try {
        // 3. Write to File System Cache (No permission needed on Android)
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
      } catch (fileError: any) {
        console.error("FileSystem/FileOpener Error:", fileError);
        alert(`Error opening file: ${fileError.message || fileError} (Android Path: ${fileNameWithExt})`); // For APK debugging
        toast({
          variant: "error",
          title: "ไม่สามารถเปิดไฟล์ได้",
          message: "โปรดตรวจสอบสิทธิ์การเข้าถึงไฟล์ในมือถือของคุณ"
        });
      }
    } catch (error: any) {
      console.error("PDF generation failed:", error);
      alert(`PDF core error: ${error.message || error}`); // Serious error in APK
      toast({
        variant: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถสร้างเอกสาร PDF ได้ในขณะนี้"
      });
    } finally {
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
