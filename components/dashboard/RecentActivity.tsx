import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Inbox, 
  Package, 
  Ticket, 
  Clock, 
  Loader2, 
  X,
  FileDown
} from "lucide-react";
import { useComments } from '@/hooks/dashboard/useComments';
import { downloadPDF } from '@/lib/pdf-utils';
import { ITRequestPDF } from '@/lib/pdf/ITRequestPDF';

interface RecentActivityProps {
  isAdmin: boolean;
  isLoading: boolean;
  filteredActivities: any[];
  onRefresh: () => void;
  router: any;
  session?: any;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  isAdmin,
  isLoading,
  filteredActivities,
  onRefresh,
  router,
  session
}) => {
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ME' | 'ALL'>('ME');

  const currentUserId = (session?.user as any)?.id;

  const displayData = filteredActivities.filter(act => {
     if (isAdmin || filterType === 'ALL') return true;
     return act.userId === currentUserId;
  });
  
  const {
    commentText,
    setCommentText,
    isCommenting,
    replyingToId,
    setReplyingToId,
    replyingToUser,
    setReplyingToUser,
    handleComment
  } = useComments(onRefresh);

  const handleExport = async (act: any) => {
    setIsExporting(act.id);
    try {
      await downloadPDF(<ITRequestPDF data={act} />, `IT_Request_${act.id.slice(-8)}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <Card className="rounded-xl border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col bg-white dark:bg-slate-900 h-full shadow-sm">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-zinc-50/10">
        <div>
          <h2 className="text-[14px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">
            {isAdmin ? 'กิจกรรมล่าสุด / Recent Activity' : 'รายการแจ้งซ่อม'}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {!isAdmin && (
             <div className="flex items-center bg-zinc-100/50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
               <button 
                 onClick={() => setFilterType('ME')}
                 className={cn(
                   "px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                   filterType === 'ME' ? "bg-white dark:bg-slate-700 text-[#0F1059] dark:text-white shadow-sm" : "text-zinc-400 hover:text-zinc-500"
                 )}
               >
                 MY
               </button>
               <button 
                 onClick={() => setFilterType('ALL')}
                 className={cn(
                   "px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                   filterType === 'ALL' ? "bg-white dark:bg-slate-700 text-[#0F1059] dark:text-white shadow-sm" : "text-zinc-400 hover:text-zinc-500"
                 )}
               >
                 ALL
               </button>
             </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(isAdmin ? "/admin/equipment-entry-lists" : "/user/my-requests")}
            className="h-8 rounded-lg text-[10px] font-black uppercase text-[#0F1059] dark:text-indigo-400 bg-[#0F1059]/5 hover:bg-[#0F1059]/10"
          >
            ดูประวัติ / View History
          </Button>
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse flex gap-4">
              <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-50 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
              </div>
            </div>
          ))
        ) : displayData.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-3">
            <Inbox className="h-12 w-12 text-zinc-100 dark:text-slate-800" />
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
               {filterType === 'ME' ? "ไม่มีการแจ้งซ่อมของคุณ\nNo Personal Activity" : "ไม่มีการร้องขอ\nNo Activity"}
            </p>
          </div>
        ) : displayData.slice(0, 10).map((act) => (
          <div key={act.id} className="p-4 flex flex-col group border-b last:border-0 border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
            <div className="grid items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 transition-transform group-hover:scale-105 shadow-sm",
                    act.type === 'EQUIPMENT' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" :
                      act.status === 'CLOSED' ? "bg-slate-50 dark:bg-slate-800 text-slate-400" : "bg-white dark:bg-slate-900 text-[#0F1059] dark:text-white"
                  )}>
                    {act.type === 'EQUIPMENT' ? <Package className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-[14px] font-black text-slate-900 dark:text-slate-100 truncate uppercase tracking-tight leading-tight">
                      {act.type === 'EQUIPMENT' ? `นำเข้าไอเทม: ${act.list || 'Hardware'}` : act.description}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn(
                        "rounded-lg px-2 py-0 h-4 text-[8px] font-black uppercase tracking-widest border-none shadow-none",
                        act.type === 'EQUIPMENT' ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" :
                          act.status === 'OPEN' ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400" :
                            act.status === 'IN_PROGRESS' ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400" :
                              act.status === 'RESOLVED' ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" :
                                "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      )}>
                        {act.type === 'EQUIPMENT' ? 'ลงสต็อก / STOCKED' : act.status}
                      </Badge>
                      <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock className="h-3 w-3" />{new Date(act.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex w-full justify-end items-center gap-2">
                {act.type === 'REQUEST' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport(act)}
                      disabled={!!isExporting && isExporting === act.id}
                      className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                    >
                      {isExporting === act.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <FileDown className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedCommentId(expandedCommentId === act.id ? null : act.id)}
                      className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#0F1059] dark:text-indigo-400 bg-[#0F1059]/5 dark:bg-indigo-500/10 hover:bg-[#0F1059]/10"
                    >
                      <Inbox className="h-3.5 w-3.5 mr-1.5" />{act.comments?.length || 0}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {act.type === 'REQUEST' && expandedCommentId === act.id && (
              <div className="mt-4 pl-12 space-y-4 border-l-2 border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-3">
                  {act.comments?.map((comment: any) => (
                    <div key={comment.id} className={cn(
                      "bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 relative group/comment",
                      comment.parentId && "ml-4 border-l-2 border-[#0F1059]/10 dark:border-white/10"
                    )}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black text-[#0F1059] dark:text-white uppercase tracking-widest">{comment.user?.username || 'User'}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => { setReplyingToId(comment.id); setReplyingToUser(comment.user?.username); }} 
                            className="opacity-0 group-hover/comment:opacity-100 text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline transition-opacity"
                          >
                            ตอบกลับ / Reply
                          </button>
                          <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <p className="text-[14px] font-medium text-slate-600 dark:text-slate-300 leading-tight">
                        {comment.parentId && <span className="text-[#0F1059]/50 dark:text-white/30 font-bold mr-1 italic">ตอบกลับคุณ / replied:</span>}
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {replyingToId && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#0F1059]/5 dark:bg-indigo-500/10 rounded-lg w-fit">
                      <span className="text-[9px] font-black uppercase text-[#0F1059] dark:text-white/60">กำลังตอบกลับ @{replyingToUser}</span>
                      <button onClick={() => { setReplyingToId(null); setReplyingToUser(null); }}>
                        <X className="h-3 w-3 text-rose-500" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={replyingToId ? "เขียนข้อความตอบกลับ..." : "เขียนข้อความ..."} 
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-[14px] font-medium outline-none focus:border-[#0F1059]/20 transition-all dark:text-white" 
                      value={commentText} 
                      onChange={(e) => setCommentText(e.target.value)} 
                      disabled={isCommenting} 
                      onKeyDown={(e) => e.key === 'Enter' && handleComment(act.id)} 
                    />
                    <Button 
                      size="sm" 
                      onClick={() => handleComment(act.id)} 
                      disabled={isCommenting || !commentText.trim()} 
                      className="h-8 rounded-lg bg-[#0F1059] hover:bg-[#0F1059]/90 text-[10px] font-black uppercase px-4"
                    >
                      {isCommenting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'ส่ง / Send'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
