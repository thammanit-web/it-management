"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PDFViewer } from "@react-pdf/renderer";
import { IncidentReportPDF } from "@/lib/pdf/IncidentReportPDF";

export default function PrintIncidentReportPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/incident-reports/${params.id}`);
        if (res.ok) {
          const reportData = await res.json();
          setData(reportData);
        }
      } catch (error) {
        console.error("Failed to fetch report:", error);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchReport();
    }
  }, [params.id]);

  if (loading) return <div className="p-8 text-center bg-zinc-950 min-h-screen text-white flex items-center justify-center">Loading PDF Data...</div>;
  if (!data) return <div className="p-8 text-center bg-zinc-950 min-h-screen text-red-500 flex items-center justify-center">Report not found.</div>;

  return (
    <div className="bg-zinc-950 w-full h-screen overflow-hidden flex flex-col">
      <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
         <div className="text-zinc-400 font-bold text-sm uppercase tracking-widest">Incident Report Viewer</div>
         <button onClick={() => window.close()} className="px-4 py-1 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700">Close</button>
      </div>
      <div className="flex-1 w-full h-full">
         <PDFViewer width="100%" height="100%" className="border-none">
            <IncidentReportPDF data={data} />
         </PDFViewer>
      </div>
    </div>
  );
}
