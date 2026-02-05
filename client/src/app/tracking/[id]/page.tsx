'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { RefreshCw, Clock, CheckCircle2, AlertCircle, Calendar, AlertTriangle, User, Megaphone, Search } from 'lucide-react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Marquee from 'react-fast-marquee';
import { Footer } from '@/components/Footer';

interface QueueLog {
  id: number;
  action_type: string;
  action_details: string;
  created_at: string;
  staff_name?: string;
}

interface QueueData {
  id: number;
  queue_number: string;
  status: string;
  type_name: string;
  created_at: string;
  logs: QueueLog[];
  remaining_queues: number;
  current_dept_name?: string;
  current_counter_name?: string;
  status_message?: string;
}

interface SystemSettings {
  announcement_text?: string;
  announcement_start?: string;
  announcement_end?: string;
  announcement_active?: boolean;
  kiosk_settings?: {
    tracking_message_calling?: string;
    tracking_message_cancelled?: string;
    tracking_message_completed?: string;
  };
}

export default function TrackingPage() {
  const params = useParams();
  const trackingCode = params.id as string;
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/queues/track/${trackingCode}`);
      setData(res.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('ไม่พบข้อมูลคิว หรือรหัสติดตามหมดอายุ');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [trackingCode]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    if (trackingCode) {
      fetchStatus();
      fetchSettings();
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [trackingCode, fetchStatus]);

  const showAnnouncement = () => {
    if (!settings?.announcement_active || !settings?.announcement_text) return false;
    const now = new Date();
    if (settings.announcement_start && new Date(settings.announcement_start) > now) return false;
    if (settings.announcement_end && new Date(settings.announcement_end) < now) return false;
    return true;
  };

  if (loading && !data && !error) return (
    <div className={`min-h-screen flex items-center justify-center bg-[#F2F2F7] ${GeistSans.className}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-[#e72289] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-400 font-medium animate-pulse">กำลังโหลด...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className={`min-h-screen flex items-center justify-center bg-[#F2F2F7] p-6 ${GeistSans.className}`}>
      <div className="text-center p-8 bg-white/80 backdrop-blur-3xl rounded-[2.5rem] shadow-xl border border-white/50 max-w-md w-full">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">ไม่สามารถติดตามสถานะได้</h2>
        <p className="text-slate-500 mb-6">{error}</p>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-[0.98] mb-4"
        >
          <Search size={18} />
          ค้นหาคิวใหม่
        </Link>

        <div className="text-xs text-slate-400 bg-slate-50 p-4 rounded-2xl">
          หมายเหตุ: ระบบติดตามสถานะคิวสามารถใช้งานได้เฉพาะวันที่ออกบัตรคิวเท่านั้น
        </div>
      </div>
    </div>
  );

  if (!data) return null;

  const remarks = data.logs.filter(log => log.action_type === 'REMARK');
  const timelineLogs = data.logs.filter(log => log.action_type !== 'REMARK');

  const getStatusText = () => {
    if (data.status === 'CANCELLED') {
      const template = settings?.kiosk_settings?.tracking_message_cancelled;
      if (template) {
        return template
          .replace(/{queue}/g, data.queue_number)
          .replace(/{department}/g, data.current_dept_name || '-')
          .replace(/{counter}/g, data.current_counter_name || '-');
      }
      return 'ยกเลิก';
    }
    if (data.status === 'COMPLETED') {
      const template = settings?.kiosk_settings?.tracking_message_completed;
      if (template) {
        return template
          .replace(/{queue}/g, data.queue_number)
          .replace(/{department}/g, data.current_dept_name || '-')
          .replace(/{counter}/g, data.current_counter_name || '-');
      }
      return 'เสร็จสิ้น';
    }
    if (data.status_message) {
      if (data.current_counter_name) {
        return `${data.status_message} ${data.current_counter_name}`;
      }
      return data.status_message;
    }
    if (data.status === 'PROCESSING') {
      const template = settings?.kiosk_settings?.tracking_message_calling;
      if (template) {
        return template
          .replace(/{queue}/g, data.queue_number)
          .replace(/{department}/g, data.current_dept_name || '-')
          .replace(/{counter}/g, data.current_counter_name || '-');
      }
      return `กำลังให้บริการที่ ${data.current_counter_name || 'ช่องบริการ'}`;
    }
    if (data.status === 'WAITING') return 'รอเรียกคิว';
    return data.status;
  };

  return (
    <div className={`min-h-[100dvh] bg-[#F2F2F7] flex flex-col items-center p-4 md:p-8 relative overflow-hidden ${GeistSans.className}`}>
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-60">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-200/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-pink-200/40 rounded-full blur-[100px]" />
      </div>

      {/* Announcement Banner */}
      {showAnnouncement() && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto w-full">
          <div className="bg-[#e72289] text-white py-3 px-4 rounded-2xl shadow-lg shadow-pink-500/30 flex items-center gap-3 overflow-hidden border border-white/20 backdrop-blur-md">
            <Megaphone className="shrink-0 animate-pulse" size={20} />
            <div className="flex-1 overflow-hidden font-bold">
              <Marquee gradient={false} speed={40}>
                {settings?.announcement_text} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </Marquee>
            </div>
          </div>
        </div>
      )}

      <div className={`max-w-md w-full bg-white/70 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-white/40 animate-in fade-in zoom-in duration-700 flex flex-col ${showAnnouncement() ? 'mt-16' : ''}`}>
        {/* Header */}
        <div className="bg-white/50 backdrop-blur-md p-8 text-center border-b border-black/5 relative overflow-hidden shrink-0">
          <div className="inline-block mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#e72289] to-[#c01b70] rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20 mx-auto">
              <Clock size={24} className="text-white" />
            </div>
          </div>
          <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">สถานะคิวปัจจุบัน</h1>

          <div className="relative z-10">
            <div className="inline-block">
              <div className={`text-7xl font-semibold tracking-tighter text-slate-900 ${GeistMono.className} drop-shadow-sm`}>
                {data.queue_number}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-slate-400 text-sm font-medium">
            <Calendar size={14} />
            <span>{new Date(data.created_at).toLocaleDateString('th-TH', { dateStyle: 'long' })}</span>
          </div>
        </div>

        {/* Status Card */}
        <div className="p-6 pb-0 shrink-0">
          <div className="bg-white/60 rounded-[2rem] border border-white/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-500">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <CheckCircle2 size={100} className="text-[#e72289]" />
            </div>

            <div className="relative z-10 p-6 pb-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">สถานะ</div>
              <div className="text-2xl font-bold text-slate-800 leading-tight">
                {getStatusText()}
              </div>
            </div>

            {(data.status === 'WAITING' || data.status === 'PROCESSING') && (
              <>
                <div className="w-full h-px bg-black/5 my-0"></div>
                <div className="relative z-10 p-5 bg-white/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white text-[#e72289] rounded-full flex items-center justify-center shadow-sm border border-black/5">
                      <Clock size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">คิวที่รออยู่</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-semibold text-slate-900 ${GeistMono.className}`}>{data.remaining_queues}</span>
                    <span className="text-xs text-slate-400 font-bold">คิว</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Remarks Section */}
          {remarks.length > 0 && (
            <div className="mt-4 bg-red-50/50 border border-red-100 rounded-[1.5rem] p-5 animate-in slide-in-from-bottom duration-500">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-red-100 text-red-500 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">หมายเหตุ</div>
                  <div className="space-y-3">
                    {remarks.map((remark) => (
                      <div key={remark.id} className="text-sm text-slate-700 font-medium leading-relaxed bg-white/60 p-3 rounded-xl border border-red-100/30 shadow-sm">
                        {remark.action_details}
                        <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(remark.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          {remark.staff_name && <span>• {remark.staff_name}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 pl-2">ประวัติการรับบริการ</h3>
          <div className="space-y-6 relative pl-4 border-l-2 border-slate-200 ml-2">
            {timelineLogs.map((log, index) => (
              <div key={log.id} className="relative pl-8 animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-[3px] border-[#F2F2F7] shadow-sm z-10
                  ${log.action_type === 'CREATE' ? 'bg-blue-500' : ''}
                  ${log.action_type === 'TRANSFER' || log.action_type === 'BULK_TRANSFER' ? 'bg-amber-500' : ''}
                  ${log.action_type === 'CALL' ? 'bg-[#e72289]' : ''}
                  ${log.action_type === 'COMPLETE' || log.action_type === 'BULK_COMPLETE' ? 'bg-green-500' : ''}
                  ${log.action_type === 'CANCEL' || log.action_type === 'BULK_CANCEL' ? 'bg-rose-500' : ''}
                `}></div>

                <div className="bg-white/60 border border-white/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white/80">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide
                      ${log.action_type === 'CREATE' ? 'bg-blue-50 text-blue-600' : ''}
                      ${log.action_type === 'TRANSFER' || log.action_type === 'BULK_TRANSFER' ? 'bg-amber-50 text-amber-600' : ''}
                      ${log.action_type === 'CALL' ? 'bg-pink-50 text-[#e72289]' : ''}
                      ${log.action_type === 'COMPLETE' || log.action_type === 'BULK_COMPLETE' ? 'bg-green-50 text-green-600' : ''}
                      ${log.action_type === 'CANCEL' || log.action_type === 'BULK_CANCEL' ? 'bg-rose-50 text-rose-600' : ''}
                    `}>
                      {log.action_type === 'CREATE' && 'รับบัตรคิว'}
                      {(log.action_type === 'TRANSFER' || log.action_type === 'BULK_TRANSFER') && 'ส่งต่อ'}
                      {log.action_type === 'CALL' && 'เรียกคิว'}
                      {(log.action_type === 'COMPLETE' || log.action_type === 'BULK_COMPLETE') && 'เสร็จสิ้น'}
                      {(log.action_type === 'CANCEL' || log.action_type === 'BULK_CANCEL') && 'ยกเลิก'}
                    </span>
                    <span className={`text-xs text-slate-400 font-medium ${GeistMono.className}`}>
                      {new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-slate-700 text-sm font-medium leading-relaxed">
                    {log.action_details}
                  </p>

                  {log.staff_name && (
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                      <div className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center">
                        <User size={10} />
                      </div>
                      <span>โดย: {log.staff_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-white/50 backdrop-blur-md border-t border-black/5 shrink-0 flex flex-col gap-3">
          <button
            onClick={fetchStatus}
            className="flex items-center justify-center gap-2 w-full py-4 bg-[#e72289] hover:bg-[#c01b70] text-white rounded-2xl font-bold transition-all shadow-lg shadow-pink-500/20 active:scale-[0.98]"
          >
            <RefreshCw size={20} /> อัปเดตสถานะ
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-bold transition-all active:scale-[0.98]"
          >
            <Search size={20} /> ค้นหาคิวอื่น
          </Link>
        </div>
      </div>

      <Footer className="mt-8" />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(231, 34, 137, 0.3);
        }
      `}</style>
    </div>
  );
}