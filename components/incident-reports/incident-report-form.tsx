"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Save, Printer } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

export default function IncidentReportForm({ 
  initialData, 
  onClose,
  onSuccess,
  isUserMode = false
}: { 
  initialData?: any; 
  onClose?: () => void;
  onSuccess?: () => void;
  isUserMode?: boolean;
}) {
  const isEditing = !!initialData;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const formatInitialDate = (dateString?: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    // return format for datetime-local: YYYY-MM-DDThh:mm
    return d.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    incidentTime: formatInitialDate(initialData?.incidentTime),
    location: initialData?.location || "",
    employeeCode: initialData?.employeeCode || "",
    reporterName: initialData?.reporterName || "",
    department: initialData?.department || "",
    incidentType: initialData?.incidentType || "",
    incidentTypeOther: initialData?.incidentTypeOther || "",
    details: initialData?.details || "",
    reportSignatureDate: formatInitialDate(initialData?.reportSignatureDate),
    reporterSign: initialData?.reporterSign || "",
    
    // Part 2
    cause: initialData?.cause || "",
    maintenanceDate: formatInitialDate(initialData?.maintenanceDate),
    repairType: initialData?.repairType || "", // EXTERNAL, INTERNAL
    resolution: initialData?.resolution || "",
    prevention: initialData?.prevention || "",
    
    responsibleSign: initialData?.responsibleSign || "",
    responsibleDate: formatInitialDate(initialData?.responsibleDate),
    reviewerSign: initialData?.reviewerSign || "",
    reviewerDate: formatInitialDate(initialData?.reviewerDate),
    maintenanceComment: initialData?.maintenanceComment || "",
    
    status: initialData?.status || "OPEN"
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing ? `/api/incident-reports/${initialData.id}` : "/api/incident-reports";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({ title: "Success", message: "Report saved successfully.", variant: "success" });
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else {
        const err = await res.json();
        toast({ title: "Error", message: err.error || "Failed to save", variant: "error" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", message: "System error", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold tracking-tight px-1 text-foreground">
          {isEditing ? `Edit Incident Report: ${initialData?.report_code}` : "New Incident Report"}
        </h1>
        <div className="flex gap-2">
          {isEditing && (
            <Link href={`/print/incident-report/${initialData.id}`} target="_blank">
              <Button variant="secondary" className="bg-secondary text-foreground hover:bg-secondary/80">
                <Printer className="mr-2 h-4 w-4" />
                Print PDF
              </Button>
            </Link>
          )}
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary text-white hover:bg-primary-hover">
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save Report"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Header mimicking standard format but styled modernly */}
        <div className="p-4 rounded-xl bg-primary text-white flex flex-col sm:flex-row items-center justify-center gap-4 relative shadow-sm border border-primary/20">
          <div className="sm:absolute sm:left-6 font-bold text-xl uppercase flex items-center">
            <div className="w-8 h-8 bg-white/20 mr-2 flex items-center justify-center text-white text-xs rounded">NDC</div>
            NDC
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold">แบบฟอร์มรายงานเหตุการณ์ผิดปกติ</h2>
            <h3 className="text-base font-medium opacity-80">(Incident Report Form)</h3>
          </div>
        </div>

        {/* Part 1 */}
        <Card className="rounded-xl shadow-sm border-border bg-surface">
          <CardHeader className="bg-secondary/50 py-3 rounded-t-xl border-b border-border">
            <CardTitle className="text-base text-foreground font-bold">
              ส่วนที่ 1 ผู้รายงานเหตุการณ์ผิดปกติ (Incident Reporter)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>วัน/เวลาเกิดเหตุ (Incident Time) <span className="text-red-500">*</span></Label>
                <Input required type="datetime-local" value={formData.incidentTime} onChange={(e: any) => handleChange("incidentTime", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>สถานที่/ระบบที่เกี่ยวข้อง (Related Locations / Systems) <span className="text-red-500">*</span></Label>
                <Input required value={formData.location} onChange={(e: any) => handleChange("location", e.target.value)} placeholder="e.g. IT Room, ERP System" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>รหัสพนักงาน (Employee ID) <span className="text-red-500">*</span></Label>
                <Input required value={formData.employeeCode} onChange={(e: any) => handleChange("employeeCode", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ชื่อ (Name) <span className="text-red-500">*</span></Label>
                <Input required value={formData.reporterName} onChange={(e: any) => handleChange("reporterName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>แผนก (Department) <span className="text-red-500">*</span></Label>
                <Input required value={formData.department} onChange={(e: any) => handleChange("department", e.target.value)} />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="font-semibold text-base">ประเภทเหตุการณ์ (Incident Type)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="t-malware" 
                    checked={formData.incidentType === "MALWARE"}
                    onCheckedChange={() => handleChange("incidentType", "MALWARE")}
                  />
                  <Label htmlFor="t-malware">ไวรัส (Malware)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="t-human" 
                    checked={formData.incidentType === "HUMAN_ERROR"}
                    onCheckedChange={() => handleChange("incidentType", "HUMAN_ERROR")}
                  />
                  <Label htmlFor="t-human">ความผิดพลาดของคน (Human Error)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="t-system" 
                    checked={formData.incidentType === "SYSTEM_DOWN"}
                    onCheckedChange={() => handleChange("incidentType", "SYSTEM_DOWN")}
                  />
                  <Label htmlFor="t-system">ระบบล่ม (System Down)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="t-auth" 
                    checked={formData.incidentType === "UNAUTHORIZED_ACCESS"}
                    onCheckedChange={() => handleChange("incidentType", "UNAUTHORIZED_ACCESS")}
                  />
                  <Label htmlFor="t-auth">เข้าถึงโดยไม่ได้รับอนุญาต (Unauthorized Access)</Label>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="t-other" 
                      checked={formData.incidentType === "OTHER"}
                      onCheckedChange={() => handleChange("incidentType", "OTHER")}
                    />
                    <Label htmlFor="t-other">อื่นๆ (Other):</Label>
                  </div>
                  <Input 
                    disabled={formData.incidentType !== "OTHER"}
                    className="max-w-[400px]"
                    value={formData.incidentTypeOther}
                    onChange={(e: any) => handleChange("incidentTypeOther", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>รายละเอียดเหตุการณ์ (Incident Details) <span className="text-red-500">*</span></Label>
              <Textarea 
                required
                className="min-h-[120px]" 
                value={formData.details} 
                onChange={(e: any) => handleChange("details", e.target.value)} 
              />
            </div>
            
            <div className="grid grid-cols-2 border border-border rounded-lg p-0 divide-x divide-border m-0 items-center bg-secondary/20">
              <div className="flex flex-col items-center justify-center p-4">
                <span className="text-sm font-medium text-foreground">ลงชื่อผู้รายงานเหตุการณ์ผิดปกติ</span>
                <span className="text-xs text-accent">Sign Incident Reporter</span>
              </div>
              <div className="p-4 flex flex-col justify-end space-y-4 h-full relative">
                 <Input 
                   placeholder="Sign Name" 
                   className="text-center border-t-0 border-x-0 border-b border-dashed rounded-none bg-transparent"
                   value={formData.reporterSign}
                   onChange={(e: any) => handleChange("reporterSign", e.target.value)}
                 />
                 <div className="flex items-center justify-end gap-2 text-sm mt-auto">
                    <Label>Date:</Label>
                    <Input 
                      type="date"
                      className="w-auto bg-surface"
                      value={formData.reportSignatureDate?.split("T")[0] || ""}
                      onChange={(e: any) => handleChange("reportSignatureDate", e.target.value)}
                    />
                 </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Part 2 */}
        {!isUserMode && (
          <Card className="rounded-xl shadow-sm border-border bg-surface">
          <CardHeader className="bg-secondary/50 py-3 rounded-t-xl border-b border-border flex flex-row flex-wrap gap-4 items-center justify-between">
            <CardTitle className="text-base text-foreground font-bold">
              ส่วนที่ 2 ผู้แก้ไข (Maintenance Technician)
            </CardTitle>
            <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-border">
               <Label className="pl-2">Status:</Label>
               <select 
                 className="p-1 rounded bg-surface text-sm border-none focus:ring-0 outline-none"
                 value={formData.status} 
                 onChange={(e: any) => handleChange("status", e.target.value)}
               >
                 <option value="OPEN">OPEN</option>
                 <option value="IN_PROGRESS">IN PROGRESS</option>
                 <option value="RESOLVED">RESOLVED</option>
                 <option value="CLOSED">CLOSED</option>
               </select>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            <div className="space-y-2">
              <Label>สาเหตุของปัญหา (Cause of the problem)</Label>
              <Textarea 
                className="min-h-[100px]" 
                value={formData.cause} 
                onChange={(e: any) => handleChange("cause", e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>วันที่แก้ไข (Date to Maintenance)</Label>
                <Input type="datetime-local" value={formData.maintenanceDate} onChange={(e: any) => handleChange("maintenanceDate", e.target.value)} />
              </div>
            </div>

            <div className="flex gap-8 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="r-ext" 
                  checked={formData.repairType === "EXTERNAL"}
                  onCheckedChange={() => handleChange("repairType", "EXTERNAL")}
                />
                <Label htmlFor="r-ext">ส่งซ่อมภายนอก / External Repair</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="r-int" 
                  checked={formData.repairType === "INTERNAL"}
                  onCheckedChange={() => handleChange("repairType", "INTERNAL")}
                />
                <Label htmlFor="r-int">ซ่อมภายใน / Internal Repair</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>รายละเอียดการแก้ไข (Detail of Maintenance)</Label>
              <Textarea 
                className="min-h-[100px]" 
                value={formData.resolution} 
                onChange={(e: any) => handleChange("resolution", e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label>แนวทางการป้องกัน (Prevention Guidelines)</Label>
              <Textarea 
                className="min-h-[100px]" 
                value={formData.prevention} 
                onChange={(e: any) => handleChange("prevention", e.target.value)} 
              />
            </div>

            {/* Approvals */}
            <div className="grid grid-cols-1 md:grid-cols-3 border border-border rounded-lg divide-y md:divide-y-0 md:divide-x mt-4 bg-secondary/20">
              
              {/* Box 1 */}
              <div className="p-4 flex flex-col space-y-4">
                <div className="text-center font-medium text-sm text-foreground">
                  ผู้รับผิดชอบ <br/>
                  <span className="text-xs text-accent">Responsible maintenance</span>
                </div>
                <Input 
                  placeholder="Sign Name" 
                  className="text-center border-t-0 border-x-0 border-b border-dashed rounded-none bg-transparent"
                  value={formData.responsibleSign}
                  onChange={(e: any) => handleChange("responsibleSign", e.target.value)}
                />
                <div className="flex items-center gap-2 mt-auto">
                  <Label>Date:</Label>
                  <Input 
                    type="date" className="h-8 bg-surface" 
                    value={formData.responsibleDate?.split("T")[0] || ""}
                    onChange={(e: any) => handleChange("responsibleDate", e.target.value)}
                  />
                </div>
              </div>

              {/* Box 2 */}
              <div className="p-4 flex flex-col space-y-4">
                <div className="text-center font-medium text-sm text-foreground">
                  ผู้ทบทวน <br/>
                  <span className="text-xs text-accent">Review By</span>
                </div>
                <Input 
                  placeholder="Sign Name" 
                  className="text-center border-t-0 border-x-0 border-b border-dashed rounded-none bg-transparent"
                  value={formData.reviewerSign}
                  onChange={(e: any) => handleChange("reviewerSign", e.target.value)}
                />
                <div className="flex items-center gap-2 mt-auto">
                  <Label>Date:</Label>
                  <Input 
                    type="date" className="h-8 bg-surface" 
                    value={formData.reviewerDate?.split("T")[0] || ""}
                    onChange={(e: any) => handleChange("reviewerDate", e.target.value)}
                  />
                </div>
              </div>

              {/* Box 3 */}
              <div className="p-4 flex flex-col h-full">
                <div className="text-center font-medium text-sm mb-4 text-foreground">
                  หมายเหตุ <br/>
                  <span className="text-xs text-accent">Comment</span>
                </div>
                <Textarea 
                  className="flex-1 resize-none h-full border-border shadow-none bg-surface" 
                  placeholder="..." 
                  value={formData.maintenanceComment}
                  onChange={(e: any) => handleChange("maintenanceComment", e.target.value)}
                />
              </div>

            </div>

          </CardContent>
        </Card>
        )}

      </form>
    </div>
  );
}
