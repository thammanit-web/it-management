"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, FileText, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Drawer } from "@/components/ui/drawer";
import IncidentReportForm from "@/components/incident-reports/incident-report-form";

export default function IncidentReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  const { toast } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/incident-reports?search=${search}`);
      const data = await res.json();
      if (res.ok) {
        setReports(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch incident reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this incident report?")) return;
    try {
      const res = await fetch(`/api/incident-reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Success", message: "Report deleted successfully.", variant: "success" });
        fetchReports();
      } else {
        toast({ title: "Error", message: "Failed to delete report.", variant: "error" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", message: "System error.", variant: "error" });
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedReport(null);
  };

  const handleOpenDrawer = (report?: any) => {
    setSelectedReport(report || null);
    setDrawerOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Incident Reports</h1>
          <p className="text-accent mt-1 text-sm bg-transparent">
            Manage and view IT incident reports within the organization.
          </p>
        </div>
        <Button onClick={() => handleOpenDrawer()} className="w-full sm:w-auto bg-primary text-white hover:bg-primary-hover shadow-sm rounded-lg">
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      <Card className="rounded-xl shadow-sm border-border bg-surface">
        <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
          <CardTitle className="text-lg font-bold text-foreground">All Reports</CardTitle>
          <div className="flex items-center gap-2 max-w-sm w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search code, reporter, details..."
                className="pl-8"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-accent">Loading...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center">
              <FileText className="h-12 w-12 text-accent/50 mb-3" />
              <p className="text-accent text-sm">No incident reports found.</p>
            </div>
          ) : (
            <>
              {/* Desktop View -> Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-accent">
                    <tr>
                      <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Code</th>
                      <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Date</th>
                      <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Reporter</th>
                      <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Type</th>
                      <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Status</th>
                      <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{report.report_code || "N/A"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-foreground">
                          {new Date(report.incidentTime).toLocaleString('th-TH')}
                        </td>
                        <td className="px-4 py-3 text-foreground">{report.reporterName}</td>
                        <td className="px-4 py-3 text-foreground">
                          {report.incidentType === "OTHER" ? report.incidentTypeOther : report.incidentType}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={report.status === "CLOSED" ? "secondary" : "default"} className={report.status === "CLOSED" ? "bg-secondary text-accent" : "bg-primary text-white"}>
                            {report.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDrawer(report)} title="View / Edit" className="text-accent hover:text-primary">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-danger hover:text-danger hover:bg-danger/10" onClick={() => handleDelete(report.id)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile View -> Cards */}
              <div className="flex flex-col md:hidden p-4 gap-3 bg-secondary/10">
                {reports.map((report) => (
                  <div key={report.id} className="bg-surface border border-border p-4 rounded-xl shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">{report.report_code || "N/A"}</span>
                      <Badge variant={report.status === "CLOSED" ? "secondary" : "default"} className={report.status === "CLOSED" ? "bg-secondary text-accent" : "bg-primary text-white"}>
                        {report.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-foreground space-y-1">
                      <p><span className="text-accent">Date:</span> {new Date(report.incidentTime).toLocaleString('th-TH')}</p>
                      <p><span className="text-accent">Reporter:</span> {report.reporterName}</p>
                      <p><span className="text-accent">Type:</span> {report.incidentType === "OTHER" ? report.incidentTypeOther : report.incidentType}</p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-border mt-1">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDrawer(report)} className="rounded-lg">
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Button>
                      <Button variant="outline" size="sm" className="hover:bg-danger/10 rounded-lg text-red-500" onClick={() => handleDelete(report.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Drawer isOpen={drawerOpen} onClose={handleCloseDrawer} size="half" direction="right">
         <IncidentReportForm 
            initialData={selectedReport} 
            onClose={handleCloseDrawer} 
            onSuccess={fetchReports} 
         />
      </Drawer>
    </div>
  );
}
