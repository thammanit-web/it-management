import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileOpener } from "@capacitor-community/file-opener";

/**
 * Utility to generate and download a PDF document using @react-pdf/renderer
 */
export async function downloadPDF(document: any, filename: string) {
  try {
    if (Capacitor.isNativePlatform()) {
      const instance = pdf(document);
      const uint8Array = await (instance as any).toUint8Array();
      
      let binary = '';
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Data = window.btoa(binary);

      const res = await Filesystem.writeFile({
        path: `${filename}.pdf`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });
      alert(`ดาวน์โหลดสำเร็จ: ${res.uri}`);
    } else {
      const blob = await pdf(document).toBlob();
      saveAs(blob, `${filename}.pdf`);
    }
  } catch (error: any) {
    console.error("PDF generation/download error:", error);
    if (Capacitor.isNativePlatform()) {
      alert(`Download Error: ${error.message || error}`);
    }
  }
}

/**
 * Utility to generate and open a PDF document in a new tab for preview
 */
export async function previewPDF(document: any, filename: string = "document") {
  try {
    if (Capacitor.isNativePlatform()) {
      const instance = pdf(document);
      const uint8Array = await (instance as any).toUint8Array();
      
      let binary = '';
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Data = window.btoa(binary);

      const res = await Filesystem.writeFile({
        path: `${filename}.pdf`,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true
      });
      await FileOpener.open({
        filePath: res.uri,
        contentType: "application/pdf"
      });
    } else {
      const blob = await pdf(document).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
  } catch (error: any) {
    console.error("PDF preview error:", error);
    if (Capacitor.isNativePlatform()) {
      alert(`Preview Error: ${error.message || error}`);
    }
  }
}
