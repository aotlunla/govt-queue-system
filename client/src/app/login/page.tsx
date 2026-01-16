'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { UserCheck, Search } from 'lucide-react';

interface Personnel { id: number; fullname: string; nickname: string; }

export default function LoginPage() {
  const router = useRouter();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // 1. โหลดรายชื่อ
    const fetchPersonnel = async () => {
      try {
        const res = await api.get('/admin/personnel');
        setPersonnel(res.data);
      } catch (err) { console.error(err); }
    };
    fetchPersonnel();

    // 2. เช็กว่าเคยจำค่าไว้ไหม
    const savedId = localStorage.getItem('my_personnel_id');
    if (savedId) setSelectedId(savedId);
  }, []);

  const handleLogin = () => {
    if (!selectedId) return alert('กรุณาเลือกชื่อเจ้าหน้าที่');
    
    // หาชื่อเจ้าหน้าที่จาก ID
    const person = personnel.find(p => p.id.toString() === selectedId);
    if (!person) return;

    // บันทึกลง LocalStorage
    if (rememberMe) {
      localStorage.setItem('my_personnel_id', selectedId);
    } else {
      localStorage.removeItem('my_personnel_id');
    }
    
    // บันทึก Session ปัจจุบัน (ชื่อที่จะเอาไปโชว์มุมจอ)
    localStorage.setItem('current_personnel_name', person.fullname);
    localStorage.setItem('current_personnel_id', selectedId);

    // ไปหน้าเลือกจุดปฏิบัติงาน
    router.push('/dashboard');
  };

  // กรองรายชื่อตามคำค้นหา
  const filteredPersonnel = personnel.filter(p => 
    p.fullname.includes(search) || (p.nickname && p.nickname.includes(search))
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-blue-100 rounded-full text-blue-600 mb-4">
            <UserCheck size={48} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">ระบุตัวตนผู้ปฏิบัติงาน</h1>
          <p className="text-slate-500">ใครกำลังใช้งานเครื่องนี้อยู่ครับ?</p>
        </div>

        <div className="space-y-6">
          {/* ช่องค้นหา */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="พิมพ์ชื่อเพื่อค้นหา..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* รายชื่อ (Listbox) */}
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredPersonnel.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id.toString())}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors flex justify-between items-center ${selectedId === p.id.toString() ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-700'}`}
              >
                <span>{p.fullname}</span>
                {p.nickname && <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">{p.nickname}</span>}
              </button>
            ))}
            {filteredPersonnel.length === 0 && <div className="p-4 text-center text-gray-400">ไม่พบรายชื่อ</div>}
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="remember" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">จำชื่อฉันไว้ในเครื่องนี้</label>
          </div>

          <button 
            onClick={handleLogin}
            disabled={!selectedId}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ยืนยัน / เข้าสู่ระบบ
          </button>
        </div>
      </div>
    </div>
  );
}