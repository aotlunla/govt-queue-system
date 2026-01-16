'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Building2, ArrowRight, MonitorCheck, LogOut, User } from 'lucide-react';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Counter {
  id: number;
  name: string;
  department_id: number;
}

export default function DashboardSelect() {
  const router = useRouter();
  
  // State ข้อมูล
  const [depts, setDepts] = useState<Department[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State ผู้ใช้งาน
  const [personnelName, setPersonnelName] = useState('');

  useEffect(() => {
    // 1. ตรวจสอบว่า Login หรือยัง? (ถ้าไม่มี ID ให้ดีดไปหน้า Login)
    const currentId = localStorage.getItem('current_personnel_id');
    const currentName = localStorage.getItem('current_personnel_name');

    if (!currentId) {
      router.push('/login');
      return;
    }
    setPersonnelName(currentName || 'เจ้าหน้าที่');

    // 2. ดึงข้อมูลแผนกและช่องบริการ
    const fetchData = async () => {
      try {
        const res = await api.get('/queues/config');
        setDepts(res.data.departments || []);
        setCounters(res.data.counters || []);
      } catch (error) {
        console.error("Error fetching config:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // ฟังก์ชันเลือกจุดปฏิบัติงาน
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

  // ฟังก์ชันออกจากระบบ (Logout)
  const handleLogout = () => {
    if(confirm('ต้องการออกจากระบบหรือไม่?')) {
      localStorage.removeItem('current_personnel_id');
      localStorage.removeItem('current_personnel_name');
      // ไม่ลบ 'my_personnel_id' (เพื่อให้จำค่าเดิมไว้ตอน Login ครั้งหน้า)
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header แสดงชื่อผู้ใช้งาน */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <MonitorCheck className="text-blue-600" />
          ระบบบริหารงานคิว
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
            <User size={16} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">{personnelName}</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-semibold flex items-center gap-1"
          >
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      </div>

      {/* เนื้อหาหลัก: เลือกจุดปฏิบัติงาน */}
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">เลือกจุดปฏิบัติงาน</h1>
          <p className="text-slate-500 mt-2">ประจำวันที่ {new Date().toLocaleDateString('th-TH')}</p>
        </div>

        {depts.length === 0 ? (
          <div className="text-center p-10 bg-white rounded-2xl border border-red-200 text-red-500">
            ⚠️ ไม่พบข้อมูลฝ่ายงาน (กรุณาตรวจสอบการตั้งค่าฐานข้อมูล)
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {depts.map((dept) => {
              // กรอง Counter ที่สังกัดแผนกนี้
              const deptCounters = counters.filter(c => c.department_id === dept.id);

              return (
                <div 
                  key={dept.id} 
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{dept.name}</h2>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{dept.code}</span>
                    </div>
                  </div>

                  {deptCounters.length > 0 ? (
                    // กรณีมีช่องบริการย่อย (Sub-counters)
                    <div className="space-y-3">
                      <p className="text-sm text-slate-500 font-medium">เลือกช่องบริการ:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {deptCounters.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleSelectStation(dept.id, c.id, dept.name, c.name)}
                            className="px-4 py-3 text-sm font-semibold bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-100 hover:border-blue-600 rounded-xl text-slate-600 transition-all text-center"
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // กรณีเป็นแผนกเดี่ยว (ไม่มีช่องย่อย)
                    <button
                      onClick={() => handleSelectStation(dept.id, undefined, dept.name)}
                      className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group"
                    >
                      เข้าสู่ระบบงาน <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}