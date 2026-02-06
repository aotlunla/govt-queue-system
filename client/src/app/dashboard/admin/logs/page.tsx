'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
    Shield, Search, AlertCircle, CheckCircle, Smartphone, Globe, User
} from 'lucide-react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

interface Log {
    id: number;
    username: string;
    personnel_name: string | null;
    action_type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT';
    ip_address: string;
    user_agent: string;
    details: string;
    created_at: string;
}

export default function LoginLogsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = async (pageNum: number) => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/logs?page=${pageNum}`);
            setLogs(res.data.logs);
            setTotalPages(res.data.pagination.totalPages);
            setPage(pageNum);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('th-TH', {
            dateStyle: 'short',
            timeStyle: 'medium',
        });
    };

    const getAgentIcon = (agent: string) => {
        if (!agent) return <Globe size={14} />;
        if (agent.includes('Mobile') || agent.includes('iPhone') || agent.includes('Android')) {
            return <Smartphone size={14} />;
        }
        return <Globe size={14} />;
    };

    return (
        <div className={`space-y-6 ${GeistSans.className}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Shield className="text-[#e72289]" />
                        ประวัติการเข้าใช้งาน (Login Logs)
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        ตรวจสอบรายการเข้าสู่ระบบสำเร็จและล้มเหลว
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchLogs(page)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 shadow-sm transition-all"
                    >
                        รีเฟรชข้อมูล
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold">
                                <th className="p-4 pl-6">เวลา (Time)</th>
                                <th className="p-4">ผู้ใช้งาน (User)</th>
                                <th className="p-4">สถานะ (Status)</th>
                                <th className="p-4">IP Address</th>
                                <th className="p-4">อุปกรณ์ (Device)</th>
                                <th className="p-4 pr-6">รายละเอียด (Details)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-sm text-slate-700">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4 pl-6"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                        <td className="p-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                        <td className="p-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                        <td className="p-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                        <td className="p-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                        <td className="p-4 pr-6"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400 font-bold">
                                        ไม่พบประวัติการเข้าใช้งาน
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className={`p-4 pl-6 ${GeistMono.className} text-slate-500 text-xs`}>
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{log.username}</span>
                                                {log.personnel_name && (
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <User size={10} /> {log.personnel_name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {log.action_type === 'LOGIN_SUCCESS' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                                                    <CheckCircle size={12} /> สำเร็จ
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">
                                                    <AlertCircle size={12} /> ล้มเหลว
                                                </span>
                                            )}
                                        </td>
                                        <td className={`p-4 ${GeistMono.className} text-slate-600 text-xs`}>
                                            {log.ip_address || '-'}
                                        </td>
                                        <td className="p-4 max-w-[200px]">
                                            <div className="flex items-center gap-2 text-slate-500 text-xs truncate" title={log.user_agent}>
                                                {getAgentIcon(log.user_agent)}
                                                <span className="truncate">{log.user_agent}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 pr-6 text-slate-500 text-xs">
                                            {log.details}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
                    <button
                        disabled={page <= 1}
                        onClick={() => fetchLogs(page - 1)}
                        className="px-3 py-1.5 rounded-lg text-sm font-bold text-slate-500 disabled:opacity-50 hover:bg-slate-100"
                    >
                        ก่อนหน้า
                    </button>
                    <span className="text-sm font-bold text-slate-600">
                        หน้า {page} จาก {totalPages}
                    </span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => fetchLogs(page + 1)}
                        className="px-3 py-1.5 rounded-lg text-sm font-bold text-slate-500 disabled:opacity-50 hover:bg-slate-100"
                    >
                        ถัดไป
                    </button>
                </div>
            </div>
        </div>
    );
}
