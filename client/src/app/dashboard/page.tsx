'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Building2, ArrowRight, MonitorCheck, LogOut, User, MapPin, ChevronRight, LayoutGrid, Users, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { QueueSearch } from '@/components/QueueSearch';
import { useLayout } from '@/context/LayoutContext';
import { ProfileModal } from '@/components/ProfileModal';
import { HeaderButton } from '@/components/HeaderButton';
import { Footer } from '@/components/Footer';

interface Department {
  id: number;
  name: string;
  code: string;
  waiting_count: number;
}

interface Counter {
  id: number;
  name: string;
  department_id: number;
}

interface DailyStats {
  total: number;
  waiting: number;
  processing: number;
  completed: number;
  cancelled: number;
}

const PASTEL_BG = [
  'bg-pastel-pink',
  'bg-pastel-blue',
  'bg-pastel-green',
  'bg-pastel-orange',
  'bg-pastel-purple'
];

export default function DashboardSelect() {
  const router = useRouter();
  const { setLayout, userRole } = useLayout();

  const [depts, setDepts] = useState<Department[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [personnelName, setPersonnelName] = useState('');
  const [personnelId, setPersonnelId] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const currentId = localStorage.getItem('user_id') || localStorage.getItem('current_personnel_id');
    if (!currentId) {
      router.push('/login');
      return;
    }
    setPersonnelId(currentId);
    const name = localStorage.getItem('user_name') || localStorage.getItem('current_personnel_name') || '';
    setPersonnelName(name);
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const [deptRes, counterRes, statsRes] = await Promise.all([
        api.get('/admin/departments'),
        api.get('/admin/counters'),
        api.get('/queues/stats/dashboard')
      ]);
      setDepts(deptRes.data);
      setCounters(counterRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    localStorage.removeItem('station_dept_id');
    localStorage.removeItem('station_dept_name');
    localStorage.removeItem('station_counter_id');
    localStorage.removeItem('station_counter_name');
    router.push('/login');
  }, [router]);

  useEffect(() => {
    setLayout({
      title: 'Dashboard',
      subtitle: (
        <span className="text-xs font-bold text-slate-400">
          สวัสดี, <span className="text-[#e72289]">{personnelName || 'ผู้ใช้งาน'}</span>
        </span>
      ),
      leftIcon: <Building2 size={24} />,
      searchBar: <QueueSearch />,
      adminMenu: false,
      rightContent: (
        <>
          {userRole?.toLowerCase() === 'admin' && (
            <HeaderButton icon={<MonitorCheck size={20} />} label="Admin" onClick={() => router.push('/dashboard/admin')} />
          )}
          <HeaderButton icon={<User size={20} />} label={personnelName || 'โปรไฟล์'} onClick={() => setIsProfileOpen(true)} subLabel="Online" />
          <HeaderButton icon={<LogOut size={20} />} label="ออกจากระบบ" onClick={handleLogout} variant="danger" />
        </>
      ),
      fullWidth: true
    });
  }, [setLayout, personnelName, router, handleLogout, userRole]);

  const handleSelectStation = (deptId: number, counterId?: number, deptName?: string, counterName?: string) => {
    localStorage.setItem('station_dept_id', deptId.toString());
    localStorage.setItem('station_dept_name', deptName || '');

    if (counterId) {
      localStorage.setItem('station_counter_id', counterId.toString());
      localStorage.setItem('station_counter_name', counterName || '');
    } else {
      localStorage.removeItem('station_counter_id');
      localStorage.removeItem('station_counter_name');
    }

    router.push('/dashboard/workstation');
  };

  if (loading) {
    return (
      <div className={`min-h-[50vh] flex items-center justify-center ${GeistSans.className}`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-100 border-t-[#e72289] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
          <div className="text-slate-400 font-bold animate-pulse tracking-wide">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`animate-in fade-in slide-in-from-bottom-4 duration-700 ${GeistSans.className}`}>
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-xl border border-white/40 rounded-full text-slate-500 text-xs font-bold shadow-sm mb-8">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <h2 className="text-5xl md:text-7xl font-black text-slate-800 mb-6 tracking-tight leading-tight drop-shadow-sm">
          เลือกจุดปฏิบัติงาน
        </h2>
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
          กรุณาเลือกแผนกและช่องบริการที่คุณต้องการเข้าประจำการ เพื่อเริ่มให้บริการและจัดการคิว
        </p>
      </div>

      {/* Daily Stats */}
      {stats && (
        <div className="flex flex-wrap justify-center gap-6 mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          <div className="clay-card px-6 py-3 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-inner">
              <Users size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">ทั้งหมด</span>
              <span className={`text-2xl font-black text-indigo-600 leading-none ${GeistMono.className}`}>{stats.total}</span>
            </div>
          </div>

          <div className="clay-card px-6 py-3 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl shadow-inner">
              <Clock size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">รอเรียก</span>
              <span className={`text-2xl font-black text-amber-500 leading-none ${GeistMono.className}`}>{stats.waiting}</span>
            </div>
          </div>

          <div className="clay-card px-6 py-3 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shadow-inner">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">เสร็จสิ้น</span>
              <span className={`text-2xl font-black text-emerald-500 leading-none ${GeistMono.className}`}>{stats.completed}</span>
            </div>
          </div>

          <div className="clay-card px-6 py-3 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shadow-inner">
              <XCircle size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">ยกเลิก</span>
              <span className={`text-2xl font-black text-rose-500 leading-none ${GeistMono.className}`}>{stats.cancelled}</span>
            </div>
          </div>
        </div>
      )}

      {/* Departments Grid */}
      {depts.length === 0 ? (
        <div className="max-w-md mx-auto text-center p-16 clay-card">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <LayoutGrid size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-700 mb-2">ไม่พบข้อมูลแผนก</h3>
          <p className="text-slate-400 text-base font-medium">กรุณาติดต่อผู้ดูแลระบบเพื่อตั้งค่าข้อมูลพื้นฐาน</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
          {depts.map((dept, index) => {
            const deptCounters = counters.filter(c => c.department_id === dept.id);
            const pastelClass = PASTEL_BG[index % PASTEL_BG.length];

            return (
              <div
                key={dept.id}
                className={`group clay-card clay-card-hover flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards ${pastelClass}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-8 pb-6 border-b border-white/40">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-20 h-20 bg-white/80 backdrop-blur-sm text-[#e72289] rounded-[1.5rem] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_8px_16px_rgba(231,34,137,0.1)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <Building2 size={36} className="stroke-[1.5]" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-2 bg-white/60 backdrop-blur-md text-slate-600 text-[11px] font-bold rounded-xl tracking-wider uppercase shadow-sm border border-white/50 ${GeistMono.className}`}>
                        {dept.code}
                      </span>
                      <span className={`px-4 py-2 backdrop-blur-md text-[11px] font-bold rounded-xl tracking-wider uppercase shadow-sm border ${Number(dept.waiting_count || 0) > 0 ? 'bg-amber-100/60 text-amber-600 border-amber-100/50' : 'bg-slate-100/60 text-slate-400 border-slate-100/50'} ${GeistMono.className}`}>
                        {Number(dept.waiting_count || 0)} คิวรอ
                      </span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800 leading-tight group-hover:text-[#e72289] transition-colors duration-300 drop-shadow-sm">
                    {dept.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-3 text-slate-500 text-sm font-bold opacity-80">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{deptCounters.length} จุดให้บริการ</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  {deptCounters.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 pl-2 flex items-center gap-2 opacity-60">
                        <div className="h-px flex-1 bg-slate-400/30"></div>
                        Available Counters
                        <div className="h-px flex-1 bg-slate-400/30"></div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {deptCounters.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleSelectStation(dept.id, c.id, dept.name, c.name)}
                            className="relative overflow-hidden px-6 py-4 bg-white/70 hover:bg-white text-slate-600 hover:text-[#e72289] border border-white/50 hover:border-pink-200 rounded-2xl transition-all duration-300 text-left group/btn shadow-sm hover:shadow-lg hover:shadow-pink-500/10 active:scale-[0.98]"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-[10px] font-bold opacity-50 mb-1 group-hover/btn:text-pink-400 uppercase tracking-wider">COUNTER</div>
                                <div className="font-bold text-lg">{c.name}</div>
                              </div>
                              <div className="w-10 h-10 rounded-full bg-slate-50 group-hover/btn:bg-pink-50 flex items-center justify-center transition-colors shadow-inner">
                                <ChevronRight size={20} className="text-slate-300 group-hover/btn:text-[#e72289]" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <LayoutGrid size={32} className="text-slate-300" />
                      </div>
                      <p className="text-slate-400 text-sm font-bold">ไม่มีจุดให้บริการย่อย</p>
                      <button
                        onClick={() => handleSelectStation(dept.id, undefined, dept.name)}
                        className="mt-8 w-full py-4 clay-btn-primary font-bold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        เข้าใช้งานแผนก <ArrowRight size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={personnelId}
        currentName={personnelName}
      />

      <Footer />
    </div>
  );
}