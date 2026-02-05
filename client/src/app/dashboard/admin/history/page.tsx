'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
    Calendar, Search, Filter, Clock, CheckCircle2,
    XCircle, ArrowRight, User, MoreHorizontal, History, FileText, X
} from 'lucide-react';
import Portal from '@/components/Portal';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

interface QueueHistory {
    id: number;
    queue_number: string;
    type_name: string;
    role_name: string;
    current_dept_name: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface QueueLog {
    id: number;
    action_type: string;
    action_details: string;
    staff_name: string;
    created_at: string;
}

export default function HistoryPage() {
    const [queues, setQueues] = useState<QueueHistory[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal Detail
    const [selectedQueue, setSelectedQueue] = useState<QueueHistory | null>(null);
    const [logs, setLogs] = useState<QueueLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/queues/history/all?start_date=${startDate}&end_date=${endDate}`);
            setQueues(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchHistory();
    }, [startDate, endDate]);

    const handleViewDetails = async (q: QueueHistory) => {
        setSelectedQueue(q);
        setLoadingLogs(true);
        try {
            const res = await api.get(`/queues/${q.id}/logs`);
            setLogs(res.data);
        } catch (err) { console.error(err); }
        finally { setLoadingLogs(false); }
    };

    const filteredQueues = queues.filter(q =>
        q.queue_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.type_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${GeistSans.className}`}>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">ประวัติคิว</h1>
                    <p className="text-slate-500 font-medium">ตรวจสอบประวัติการให้บริการย้อนหลัง</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-white/60 shadow-sm">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-white/50 rounded-xl border border-slate-200/50">
                        <Calendar size={18} className="text-[#e72289]" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-sm font-bold outline-none text-slate-700"
                        />
                        <span className="text-slate-300 font-bold">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-sm font-bold outline-none text-slate-700"
                        />
                    </div>
                    <button
                        onClick={fetchHistory}
                        className="p-3 bg-[#e72289] text-white rounded-xl hover:bg-[#c01b70] transition-all shadow-lg shadow-pink-500/30 active:scale-95"
                    >
                        <Search size={20} />
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/40">
                    <div className="relative max-w-sm w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#e72289] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหาเลขคิว หรือ ประเภท..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-[#e72289] transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-white/50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                        <FileText size={16} className="text-slate-400" />
                        ทั้งหมด {filteredQueues.length} รายการ
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                                <th className="px-8 py-5">เลขคิว</th>
                                <th className="px-6 py-5">ประเภท/ผู้ติดต่อ</th>
                                <th className="px-6 py-5">สถานะ</th>
                                <th className="px-6 py-5">เวลารับบัตร</th>
                                <th className="px-6 py-5">อัปเดตล่าสุด</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium">กำลังโหลดข้อมูล...</td></tr>
                            ) : filteredQueues.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <History size={48} className="mb-4 opacity-20" />
                                            <p className="font-medium">ไม่พบข้อมูลในช่วงเวลานี้</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredQueues.map((q) => (
                                <tr key={q.id} className="hover:bg-white/60 transition-colors group">
                                    <td className="px-8 py-5">
                                        <span className={`font-black text-slate-900 text-lg ${GeistMono.className}`}>{q.queue_number}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-slate-700 text-sm mb-1">{q.type_name}</div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                                            <User size={12} /> {q.role_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm
                                            ${q.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                q.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                    'bg-blue-50 text-blue-700 border-blue-100'}
                                        `}>
                                            {q.status === 'COMPLETED' ? <CheckCircle2 size={14} /> :
                                                q.status === 'CANCELLED' ? <XCircle size={14} /> : <Clock size={14} />}
                                            {q.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-medium text-slate-600">
                                        {new Date(q.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-6 py-5 text-sm font-medium text-slate-600">
                                        {new Date(q.updated_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => handleViewDetails(q)}
                                            className="text-slate-400 hover:text-[#e72289] hover:bg-pink-50 p-2.5 rounded-xl transition-all"
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedQueue && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white/90 backdrop-blur-2xl w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] border border-white/50">

                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/50">
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Queue Details</div>
                                    <h2 className={`text-3xl font-black text-slate-900 flex items-center gap-3 ${GeistMono.className}`}>
                                        {selectedQueue.queue_number}
                                        <span className={`text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm ${GeistSans.className}`}>
                                            {selectedQueue.type_name}
                                        </span>
                                    </h2>
                                </div>
                                <button onClick={() => setSelectedQueue(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 bg-white/50 custom-scrollbar">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                                    <History size={14} /> Timeline การเดินทาง
                                </h3>

                                {loadingLogs ? (
                                    <div className="text-center py-12 text-slate-400 font-medium">กำลังโหลดประวัติ...</div>
                                ) : (
                                    <div className="relative border-l-2 border-pink-100 ml-3 space-y-10 pb-4">
                                        {logs.map((log, idx) => (
                                            <div key={log.id} className="relative pl-8 group">
                                                {/* Dot */}
                                                <div className={`absolute -left-[9px] top-0 w-[18px] h-[18px] rounded-full border-4 border-white shadow-sm transition-all duration-300
                                                    ${idx === 0 ? 'bg-[#e72289] ring-4 ring-pink-100 scale-110' : 'bg-slate-300 group-hover:bg-slate-400'}
                                                `}></div>

                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 mr-4">
                                                        <div className="font-bold text-slate-800 text-sm mb-2">{log.action_type}</div>
                                                        <div className="text-slate-600 text-sm bg-white p-4 rounded-2xl border border-slate-100 leading-relaxed shadow-sm">
                                                            {log.action_details}
                                                        </div>
                                                    </div>
                                                    <div className="text-right min-w-[80px]">
                                                        <div className={`text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100 inline-block mb-1 ${GeistMono.className}`}>
                                                            {new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <div className="text-xs text-[#e72289] font-bold flex items-center justify-end gap-1">
                                                            <User size={10} /> {log.staff_name || 'System'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-right">
                                <button
                                    onClick={() => setSelectedQueue(null)}
                                    className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 text-sm font-bold transition-all shadow-sm"
                                >
                                    ปิดหน้าต่าง
                                </button>
                            </div>

                        </div>
                    </div>
                </Portal>
            )}

        </div>
    );
}
