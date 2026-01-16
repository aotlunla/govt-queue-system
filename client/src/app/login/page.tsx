'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { UserCheck, Search, ChevronDown, Check } from 'lucide-react';

interface Personnel { id: number; fullname: string; nickname: string; }

export default function LoginPage() {
  const router = useRouter();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State สำหรับ Dropdown
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Personnel | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const res = await api.get('/admin/personnel');
        setPersonnel(res.data);
        
        // ถ้าเคยจำค่าไว้ ให้โหลดมาโชว์
        const savedId = localStorage.getItem('my_personnel_id');
        if (savedId) {
          const found = res.data.find((p: Personnel) => p.id.toString() === savedId);
          if (found) {
            setSelectedPerson(found);
            setSearch(found.fullname);
          }
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchPersonnel();

    // ปิด Dropdown เมื่อคลิกข้างนอก
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = () => {
    if (!selectedPerson) return;

    if (rememberMe) {
      localStorage.setItem('my_personnel_id', selectedPerson.id.toString());
    } else {
      localStorage.removeItem('my_personnel_id');
    }
    
    localStorage.setItem('current_personnel_name', selectedPerson.fullname);
    localStorage.setItem('current_personnel_id', selectedPerson.id.toString());

    router.push('/dashboard');
  };

  // กรองรายชื่อ
  const filtered = personnel.filter(p => 
    p.fullname.toLowerCase().includes(search.toLowerCase()) || 
    (p.nickname && p.nickname.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-blue-50 rounded-full text-blue-600 mb-4 border border-blue-100">
            <UserCheck size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">เข้าสู่ระบบปฏิบัติงาน</h1>
          <p className="text-slate-500 text-sm">เลือกชื่อเจ้าหน้าที่เพื่อเริ่มใช้งาน</p>
        </div>

        <div className="space-y-6">
          
          {/* Custom Searchable Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อเจ้าหน้าที่</label>
            <div 
              className="relative cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text"
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="พิมพ์ชื่อเพื่อค้นหา..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsOpen(true);
                  setSelectedPerson(null); // เคลียร์ค่าเมื่อพิมพ์ใหม่
                }}
                onFocus={() => setIsOpen(true)}
              />
              <ChevronDown className={`absolute right-3 top-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={18} />
            </div>

            {/* Dropdown List */}
            {isOpen && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="p-3 text-center text-gray-400 text-sm">ไม่พบรายชื่อ</div>
                ) : (
                  filtered.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPerson(p);
                        setSearch(p.fullname);
                        setIsOpen(false);
                      }}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center group transition-colors"
                    >
                      <div>
                        <div className="text-slate-700 font-medium group-hover:text-blue-700">{p.fullname}</div>
                        {p.nickname && <div className="text-xs text-slate-400">({p.nickname})</div>}
                      </div>
                      {selectedPerson?.id === p.id && <Check size={16} className="text-blue-600" />}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="remember" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer select-none">จำชื่อฉันไว้ในเครื่องนี้</label>
          </div>

          <button 
            onClick={handleLogin}
            disabled={!selectedPerson}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
          >
            ยืนยันตัวตน
          </button>
        </div>
      </div>
    </div>
  );
}