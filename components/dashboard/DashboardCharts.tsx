import React, { useState, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Activity, 
  AlertCircle, 
  LayoutDashboard, 
  Users, 
  Clock,
  Download
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, LabelList
} from "recharts";
import { ChartSettings } from './ChartSettings';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';

interface DashboardChartsProps {
  trendData: any[];
  urgencyData: any[];
  categoryData: any[];
  departmentMonthData: any;
  typeRequestData: any[];
  chartConfig: any;
  updateChartConfig: (chart: string, updates: any) => void;
  hiddenSeries: string[];
  toggleSeries: (key: string) => void;
  handleChartClick: (type: string, value: string) => void;
  requests: any[];
}

const EXTENDED_COLORS = [
  '#0F1059', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
  '#6366F1', '#84CC16', '#D946EF', '#EAB308', '#64748B'
];

const COLORS = ['#0F1059', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  trendData,
  urgencyData,
  categoryData,
  departmentMonthData,
  typeRequestData,
  chartConfig,
  updateChartConfig,
  hiddenSeries,
  toggleSeries,
  handleChartClick,
  requests
}) => {
  const [deptSearch, setDeptSearch] = useState("");
  
  const trendRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const proportionRef = useRef<HTMLDivElement>(null);
  const departmentRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  
  const { resolvedTheme } = useTheme();
  
  // Theme-aware colors
  const textColor = resolvedTheme === 'dark' ? '#d4d4d8' : '#94a3b8'; // zinc-300 : slate-400
  const gridColor = resolvedTheme === 'dark' ? '#27272a' : '#f1f5f9'; // zinc-800 : slate-100
  const tooltipBg = resolvedTheme === 'dark' ? '#18181b' : '#ffffff'; // zinc-900 : white
  const tooltipBorder = resolvedTheme === 'dark' ? '#27272a' : '#f4f4f5'; // zinc-800 : zinc-100
  const titleColor = resolvedTheme === 'dark' ? '#f4f4f5' : '#0F1059'; // zinc-100 : brand

  const exportToImage = async (ref: React.RefObject<HTMLDivElement | null>, fileName: string) => {
    if (ref.current === null) return;
    
    try {
      const dataUrl = await toPng(ref.current, { backgroundColor: '#ffffff', cacheBust: true });
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
      {/* Chart 1: Trend Area Chart */}
      <Card ref={trendRef} className="rounded-2xl border-zinc-100 p-4 sm:p-5 bg-white flex flex-col min-h-[350px] lg:col-span-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[100px] opacity-20 pointer-events-none" />
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-[13px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" /> สรุปสมดุลภาระงาน (Workload Balance)
            </h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
              เปรียบเทียบรายการเปิดใหม่ VS แก้ไขเสร็จสิ้น (ย้อนหลัง {chartConfig.trend.months} เดือน)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
              onClick={() => exportToImage(trendRef, 'Workload_Trend')}
              title="ดาวน์โหลดรูปภาพ"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <ChartSettings 
              chartKey="trend" 
              type="trend" 
              config={chartConfig.trend} 
              updateChartConfig={updateChartConfig} 
              deptSearch={deptSearch} 
              setDeptSearch={setDeptSearch} 
            />
          </div>
        </div>
        <div className="flex-1 w-full min-h-[250px] -ml-4 sm:ml-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: textColor }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: textColor }} dx={-10} />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="p-3 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.1)] rounded-xl min-w-[150px]" style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderWidth: 1 }}>
                        <p className="text-[12px] font-black mb-2 uppercase border-b pb-2" style={{ color: titleColor, borderColor: tooltipBorder }}>{label} <span className="text-zinc-400 font-bold ml-1 text-[9px]">- {d.total} รายการ</span></p>
                        {!hiddenSeries.includes('new') && (
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex justify-between gap-4 mb-2">
                            <span className="text-rose-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />เปิดใหม่</span><span className="text-zinc-900">{d.new}</span>
                          </p>
                        )}
                        {!hiddenSeries.includes('resolved') && (
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex justify-between gap-4 mb-2">
                            <span className="text-emerald-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />เสร็จเรียบร้อย</span><span className="text-zinc-900">{d.resolved}</span>
                          </p>
                        )}
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex justify-between gap-4 border-t border-zinc-50 pt-2 mt-1">
                          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />รอดำเนินการ</span><span className="text-zinc-900">{d.pending}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: gridColor, strokeWidth: 1.5, strokeDasharray: '4 4' }}
              />
              <Legend
                content={() => (
                  <ul className="flex flex-wrap justify-center gap-6 pb-5 border-b border-zinc-50 mb-3">
                    <li className={cn("flex items-center gap-2 cursor-pointer text-[10px] font-black uppercase tracking-wider transition-opacity duration-300", !hiddenSeries.includes('new') ? "opacity-100" : "opacity-40")} onClick={() => toggleSeries('new')}>
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100" />
                      <span className={cn(!hiddenSeries.includes('new') ? "text-rose-600" : "text-zinc-400")}>เปิดใหม่</span>
                    </li>
                    <li className={cn("flex items-center gap-2 cursor-pointer text-[10px] font-black uppercase tracking-wider transition-opacity duration-300", !hiddenSeries.includes('resolved') ? "opacity-100" : "opacity-40")} onClick={() => toggleSeries('resolved')}>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                      <span className={cn(!hiddenSeries.includes('resolved') ? "text-emerald-600" : "text-zinc-400")}>เสร็จเรียบร้อย</span>
                    </li>
                  </ul>
                )}
                verticalAlign="top"
              />
              <Area hide={hiddenSeries.includes('new')} name="เปิดใหม่" type="monotone" dataKey="new" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorNew)" animationDuration={1500} activeDot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#EF4444' }} />
              <Area hide={hiddenSeries.includes('resolved')} name="เสร็จเรียบร้อย" type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRes)" animationDuration={1500} activeDot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#10B981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Chart 2: Priority Chart */}
      <Card ref={priorityRef} className="rounded-2xl border-zinc-100 shadow-sm p-4 sm:p-5 bg-white min-h-[350px] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 w-8 h-full bg-linear-to-r from-red-50/50 to-transparent pointer-events-none" />
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-[13px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" /> วิเคราะห์ระดับความสำคัญ
            </h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">ระดับความเร่งด่วน (ย้อนหลัง {chartConfig.priority.months} เดือน)</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors"
              onClick={() => exportToImage(priorityRef, 'Priority_Analysis')}
              title="ดาวน์โหลดรูปภาพ"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <ChartSettings 
              chartKey="priority" 
              type="trend" 
              config={chartConfig.priority} 
              updateChartConfig={updateChartConfig} 
              deptSearch={deptSearch} 
              setDeptSearch={setDeptSearch} 
            />
          </div>
        </div>
        <div className="flex-1 w-full min-h-[250px] -ml-4 sm:ml-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={urgencyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: textColor }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: textColor }} dx={-10} />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    const total = payload.reduce((acc: number, item: any) => acc + item.value, 0);
                    return (
                      <div className="p-3 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.1)] rounded-xl min-w-[150px]" style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderWidth: 1 }}>
                        <p className="text-[12px] font-black mb-2 uppercase border-b pb-2" style={{ color: titleColor, borderColor: tooltipBorder }}>{label} <span className="text-zinc-400 font-bold ml-1 text-[9px]">- {total} รายการ</span></p>
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex justify-between items-center gap-4 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: entry.fill }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                              {entry.name}
                            </span>
                            <span className="text-[11px] font-black text-zinc-900">{entry.value}</span>
                          </div>
                        ))}
                        <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-2 opacity-70 border-t border-zinc-50 pt-2 text-center">คลิกที่แท่งสีเพื่อดูข้อมูล</p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: gridColor, opacity: 0.4 }}
              />
              <Legend
                content={() => {
                  const items = [
                    { key: 'high', name: 'สูง', color: '#EF4444' },
                    { key: 'medium', name: 'ปานกลาง', color: '#F59E0B' },
                    { key: 'low', name: 'ต่ำ', color: '#3B82F6' }
                  ];
                  return (
                    <ul className="flex flex-wrap justify-center gap-4 pb-4 border-b border-zinc-50 mb-3">
                      {items.map(item => {
                        const isActive = !hiddenSeries.includes(item.key);
                        return (
                          <li key={item.key} className={cn("flex items-center gap-1.5 cursor-pointer text-[9px] font-black uppercase tracking-wider transition-opacity duration-300", isActive ? "opacity-100" : "opacity-40 grayscale")} onClick={() => toggleSeries(item.key)}>
                            <span className="w-2.5 h-1.5 rounded" style={{ backgroundColor: item.color }} />
                            <span className={cn(isActive ? "text-zinc-700" : "text-zinc-400")}>{item.name}</span>
                          </li>
                        );
                      })}
                    </ul>
                  );
                }}
                verticalAlign="top"
              />
              <Bar hide={hiddenSeries.includes('high')} name="สูง" dataKey="high" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} animationDuration={1000} onClick={() => handleChartClick('priority', 'HIGH')} cursor="pointer" className="hover:opacity-80 transition-opacity outline-none" />
              <Bar hide={hiddenSeries.includes('medium')} name="ปานกลาง" dataKey="medium" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} animationDuration={1000} onClick={() => handleChartClick('priority', 'MEDIUM')} cursor="pointer" className="hover:opacity-80 transition-opacity outline-none" />
              <Bar hide={hiddenSeries.includes('low')} name="ต่ำ" dataKey="low" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} animationDuration={1000} onClick={() => handleChartClick('priority', 'LOW')} cursor="pointer" className="hover:opacity-80 transition-opacity outline-none" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Chart 3: Proportion Donut */}
      <Card ref={proportionRef} className="rounded-2xl border-zinc-100 shadow-sm p-4 sm:p-5 bg-white min-h-[350px] flex flex-col relative overflow-hidden">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-[13px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-[#0F1059]" /> สัดส่วนกลุ่มอุปกรณ์ที่มีปัญหา
            </h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
              {chartConfig.proportion.limit === 'ALL' ? 'หมวดหมู่ทั้งหมด' : `ยอดนิยม ${chartConfig.proportion.limit} อันดับ`} แบ่งตาม ฮาร์ดแวร์/ซอฟต์แวร์
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-colors"
              onClick={() => exportToImage(proportionRef, 'Proportion_Analysis')}
              title="ดาวน์โหลดรูปภาพ"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <ChartSettings 
              chartKey="proportion" 
              type="categorical" 
              config={chartConfig.proportion} 
              updateChartConfig={updateChartConfig} 
              deptSearch={deptSearch} 
              setDeptSearch={setDeptSearch} 
            />
          </div>
        </div>
        <div className="flex-1 w-full min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData.map(d => ({ ...d, value: hiddenSeries.includes(`pie-${d.name}`) ? 0 : d.value }))}
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                animationDuration={1200}
                onClick={(data) => handleChartClick('category', data.name || 'Unknown')}
                cursor="pointer"
              >
                {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />)}
              </Pie>
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const fill = payload[0].payload.fill;
                    return (
                      <div className="p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderWidth: 1 }}>
                        <div className="w-2.5 h-10 rounded-full" style={{ backgroundColor: fill }} />
                        <div>
                          <p className="text-[11px] font-black uppercase" style={{ color: titleColor }}>{payload[0].name}</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5"><span className="text-zinc-900 text-sm font-black mr-1">{payload[0].value}</span> รายการ</p>
                          <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-1 opacity-70">คลิกเพื่อดูรายละเอียดเชิงลึก</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                content={() => (
                  <ul className="flex flex-wrap justify-center gap-3 pt-6 border-t border-zinc-50 mt-2">
                    {categoryData.map((entry, index) => {
                      const key = `pie-${entry.name}`;
                      const isActive = !hiddenSeries.includes(key);
                      return (
                        <li key={index}
                          className={cn("flex items-center gap-1.5 cursor-pointer text-[9px] font-black uppercase tracking-wider transition-all duration-300", isActive ? "opacity-100" : "opacity-40 grayscale")}
                          onClick={() => toggleSeries(key)}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className={cn(isActive ? "text-zinc-700" : "text-zinc-400")}>{entry.name}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
                verticalAlign="bottom"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Chart 4: Department Breakdown */}
      <Card ref={departmentRef} className="rounded-2xl border-zinc-100 shadow-sm p-4 sm:p-5 bg-white min-h-[350px] flex flex-col lg:col-span-2 xl:col-span-2 relative overflow-hidden mt-2 lg:mt-0">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-[13px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" /> จำนวนคำร้องแยกตามแผนก
            </h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
              สถิติการร้องแยกตามแผนก (ย้อนหลัง {chartConfig.department.months} เดือน)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-colors"
              onClick={() => exportToImage(departmentRef, 'Department_Analysis')}
              title="ดาวน์โหลดรูปภาพ"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <ChartSettings 
              chartKey="department" 
              type="department" 
              config={chartConfig.department}
              updateChartConfig={updateChartConfig}
              deptSearch={deptSearch}
              setDeptSearch={setDeptSearch}
              options={Array.from(new Set(requests.map(r => r.employee?.department || 'ไม่ระบุ')))} 
            />
          </div>
        </div>
        <div className="flex-1 w-full min-h-[250px] -ml-4 sm:ml-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentMonthData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: textColor }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: textColor }} dx={-10} />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    const total = payload[0].payload.total;
                    return (
                      <div className="p-3 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.1)] rounded-xl min-w-[150px]" style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderWidth: 1 }}>
                        <p className="text-[12px] font-black mb-2 uppercase border-b pb-2" style={{ color: titleColor, borderColor: tooltipBorder }}>{label} <span className="text-zinc-400 font-bold ml-1 text-[9px]">- {total} รายการ</span></p>
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex justify-between items-center gap-4 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: entry.fill }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                              <span className="truncate max-w-[80px]">{entry.name}</span>
                            </span>
                            <span className="text-[11px] font-black text-zinc-900">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Legend
                content={() => (
                  <ul className="flex flex-wrap justify-center gap-2 pb-4 border-b border-zinc-50 mb-3 max-h-[60px] overflow-y-auto custom-scrollbar">
                    {departmentMonthData.departments.map((dept: string, idx: number) => {
                      const color = EXTENDED_COLORS[idx % EXTENDED_COLORS.length];
                      const key = `dept-${dept}`;
                      const isActive = !hiddenSeries.includes(key);
                      return (
                        <li key={key} className={cn("flex items-center gap-1 cursor-pointer text-[8px] font-black uppercase tracking-wider transition-opacity duration-300", isActive ? "opacity-100" : "opacity-40 grayscale")} onClick={() => toggleSeries(key)}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          <span className={cn(isActive ? "text-zinc-700" : "text-zinc-400", "truncate max-w-[60px]")}>{dept}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                verticalAlign="top"
              />
              {departmentMonthData.departments.map((dept: string, idx: number) => (
                <Bar
                  key={dept}
                  hide={hiddenSeries.includes(`dept-${dept}`)}
                  name={dept}
                  dataKey={dept}
                  stackId="a"
                  fill={EXTENDED_COLORS[idx % EXTENDED_COLORS.length]}
                  animationDuration={1000}
                  onClick={() => handleChartClick('department', dept)}
                  cursor="pointer"
                  className="hover:brightness-110 transition-all outline-none"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Chart 5: Top Type Requests */}
      <Card ref={typeRef} className="rounded-2xl border-zinc-100 shadow-sm p-4 sm:p-5 bg-white min-h-[350px] flex flex-col lg:col-span-2 xl:col-span-2 relative overflow-hidden mt-2 lg:mt-0">
        <div className="absolute -right-10 top-10 w-40 h-40 bg-purple-50 rounded-full opacity-50 pointer-events-none" />
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-[13px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-purple-500" /> ลักษณะงานที่พบบ่อย
            </h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
              {chartConfig.type.limit === 'ALL' ? 'ประเภทงานทั้งหมด' : `ยอดนิยม ${chartConfig.type.limit} ประเภทงานที่พบบ่อย`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-lg hover:bg-purple-50 text-purple-500 transition-colors"
              onClick={() => exportToImage(typeRef, 'Type_Request_Analysis')}
              title="ดาวน์โหลดรูปภาพ"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <ChartSettings 
              chartKey="type" 
              type="categorical" 
              config={chartConfig.type} 
              updateChartConfig={updateChartConfig} 
              deptSearch={deptSearch} 
              setDeptSearch={setDeptSearch} 
            />
          </div>
        </div>
        <div className="flex-1 w-full min-h-[250px] -ml-2 sm:ml-0 mt-4 pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={typeRequestData} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 9, fontWeight: 700, fill: textColor }} axisLine={false} tickLine={false} allowDataOverflow={false} />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0F1059] text-white p-3 shadow-xl rounded-xl flex items-center gap-3 border border-white/10">
                        <div className="w-2 h-8 rounded-full bg-purple-500" />
                        <div>
                          <p className="text-[11px] font-black uppercase truncate max-w-[150px]">{payload[0].payload.name}</p>
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5"><span className="text-white text-sm font-black mr-1">{payload[0].value}</span> รายการ</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: '#f8fafc', radius: 8 }}
              />
              <Bar
                dataKey="value"
                fill="#8B5CF6"
                radius={[0, 8, 8, 0]}
                barSize={20}
                animationDuration={1200}
                onClick={(data) => handleChartClick('type_request', data.name || 'Unknown')}
                cursor="pointer"
                className="hover:fill-purple-600 transition-colors"
              >
                <LabelList dataKey="value" position="right" style={{ fontSize: 10, fill: '#64748B', fontWeight: 900 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
