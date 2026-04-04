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
    const blob = await pdf(document).toBlob();
    
    if (Capacitor.isNativePlatform()) {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(",")[1];
        const res = await Filesystem.writeFile({
          path: `${filename}.pdf`,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });
        alert(`ดาวน์โหลดสำเร็จ: ${res.uri}`);
      };
    } else {
      saveAs(blob, `${filename}.pdf`);
    }
  } catch (error) {
    console.error("PDF generation error with @react-pdf/renderer:", error);
  }
}

/**
 * Utility to generate and open a PDF document in a new tab for preview
 */
export async function previewPDF(document: any, filename: string = "document") {
  try {
    const blob = await pdf(document).toBlob();
    
    if (Capacitor.isNativePlatform()) {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(",")[1];
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
      };
    } else {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
  } catch (error) {
    console.error("PDF preview error with @react-pdf/renderer:", error);
  }
}
