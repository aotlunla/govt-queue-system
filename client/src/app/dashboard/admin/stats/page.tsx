'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
    Calendar, TrendingUp, Users,
    CheckCircle2, Clock, XCircle, ArrowUpRight, Activity,
    PieChart as PieChartIcon
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export default function StatsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Date Filter (Default to current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/queues/stats/summary?start_date=${startDate}&end_date=${endDate}`);
            setStats(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchStats();
    }, [startDate, endDate]);

    if (loading && !stats) return (
        <div className="min-h-[60vh] flex items-center justify-center text-slate-400 font-medium animate-pulse">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-pink-200 border-t-[#e72289] rounded-full animate-spin"></div>
                <p>กำลังประมวลผลข้อมูล...</p>
            </div>
        </div>
    );

    // Prepare Data for Recharts
    const dailyData = stats?.byDay?.map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
        count: d.count
    })) || [];

    const typeData = stats?.byType?.map((t: any) => ({
        name: t.name,
        value: t.count
    })) || [];

    const COLORS = ['#e72289', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    return (
        <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${GeistSans.className}`}>

            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">สถิติการให้บริการ</h1>
                    <p className="text-slate-500 font-medium">วิเคราะห์ภาพรวมและปริมาณคิว</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm">
                    <Calendar size={20} className="text-[#e72289]" />
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
            </div>

            {/* 1. Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="คิวทั้งหมด"
                    value={stats?.overview?.total || 0}
                    icon={<Users size={24} className="text-blue-600" />}
                    bg="bg-blue-50"
                    border="border-blue-100"
                    trend="+12%"
                    trendUp={true}
                    delay={0}
                />
                <StatCard
                    title="ให้บริการเสร็จสิ้น"
                    value={stats?.overview?.completed || 0}
                    icon={<CheckCircle2 size={24} className="text-emerald-600" />}
                    bg="bg-emerald-50"
                    border="border-emerald-100"
                    subtext={`${stats?.overview?.total ? Math.round((stats.overview.completed / stats.overview.total) * 100) : 0}% Success Rate`}
                    delay={100}
                />
                <StatCard
                    title="กำลังรอ/บริการ"
                    value={stats?.overview?.waiting || 0}
                    icon={<Clock size={24} className="text-amber-600" />}
                    bg="bg-amber-50"
                    border="border-amber-100"
                    delay={200}
                />
                <StatCard
                    title="ยกเลิก/ไม่มา"
                    value={stats?.overview?.cancelled || 0}
                    icon={<XCircle size={24} className="text-rose-600" />}
                    bg="bg-rose-50"
                    border="border-rose-100"
                    delay={300}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">

                {/* 2. Daily Trend Chart (Recharts AreaChart) */}
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/60 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600"><TrendingUp size={20} /></div>
                            ปริมาณคิวรายวัน
                        </h3>
                    </div>

                    <div className="h-[350px] w-full">
                        {dailyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#e72289" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#e72289" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(8px)' }}
                                        itemStyle={{ color: '#1e293b', fontWeight: 'bold', fontFamily: 'var(--font-geist-sans)' }}
                                        cursor={{ stroke: '#e72289', strokeWidth: 2, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#e72289"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#c01b70', stroke: '#fff' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                <Activity size={48} className="mb-2 opacity-20" />
                                <p className="font-medium">ไม่มีข้อมูลกราฟในช่วงเวลานี้</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. By Type Chart (Recharts PieChart) */}
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/60 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600"><PieChartIcon size={20} /></div>
                            แยกตามประเภท
                        </h3>
                    </div>

                    <div className="h-[350px] w-full relative">
                        {typeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={typeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {typeData.map((_entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(8px)' }}
                                        itemStyle={{ color: '#1e293b', fontWeight: 'bold', fontFamily: 'var(--font-geist-sans)' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value, entry: any) => <span className="text-slate-600 font-bold text-sm ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <p className="font-medium">ไม่มีข้อมูล</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatCard({ title, value, icon, bg, trend, trendUp, subtext, delay }: any) {
    return (
        <div
            className={`bg-white/80 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border border-white/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3.5 rounded-2xl ${bg} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>{icon}</div>
                {trend && (
                    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${trendUp ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        <ArrowUpRight size={12} /> {trend}
                    </span>
                )}
            </div>
            <div className={`text-4xl font-black text-slate-900 mb-1 tracking-tight group-hover:text-[#e72289] transition-colors ${GeistMono.className}`}>{value}</div>
            <div className="text-sm font-bold text-slate-500">{title}</div>
            {subtext && <div className="text-xs font-bold text-slate-400 mt-4 pt-4 border-t border-slate-100">{subtext}</div>}
        </div>
    );
}
