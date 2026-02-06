'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { UserCheck, Search, ChevronDown, Check, Lock, ArrowRight, Star } from 'lucide-react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

import { TurnstileWidget } from '@/components/TurnstileWidget';

interface Personnel { id: number; fullname: string; nickname: string; username: string; }

export default function LoginPage() {
  const router = useRouter();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);

  // Search / Dropdown State
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Personnel | null>(null);

  // Form State
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const res = await api.get('/admin/personnel');
        setPersonnel(res.data);

        const savedUsername = localStorage.getItem('last_username');
        if (savedUsername) {
          const found = res.data.find((p: Personnel) => p.username === savedUsername);
          if (found) {
            setSelectedPerson(found);
            setSearch(found.fullname);
          }
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchPersonnel();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !password || !turnstileToken) {
      setError('กรุณายืนยันตัวตน (Captcha) ก่อนเข้าสู่ระบบ');
      return;
    }

    setLoginLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', {
        username: selectedPerson.username,
        password,
        turnstileToken // Send token to backend
      });

      if (res.data.success) {
        const { user, token } = res.data;

        // Save JWT token and user info
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_id', user.id);
        localStorage.setItem('user_name', user.fullname);
        localStorage.setItem('user_role', user.role || 'staff');
        localStorage.setItem('last_username', user.username);

        router.push('/dashboard');
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ');
      // Reset Turnstile on error if needed, but react-turnstile might handle expired tokens automatically. 
      // Ideally we should reset the widget, but for now let's keep it simple.
    } finally {
      setLoginLoading(false);
    }
  };

  const filtered = personnel.filter(p =>
    p.fullname.toLowerCase().includes(search.toLowerCase()) ||
    (p.nickname && p.nickname.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={`min-h-[100dvh] flex flex-col md:flex-row bg-[#f8fafc] ${GeistSans.className}`}>

      {/* Left Side: Hero Section (Desktop) */}
      <div className="hidden md:flex flex-1 relative bg-[#0f172a] overflow-hidden items-center justify-center p-12 lg:p-20">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-pink-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDuration: '6s' }} />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-pink-300 text-sm font-bold mb-8 shadow-xl">
            <Star size={14} className="fill-pink-300 text-pink-300" />
            <span>Smart Queue Management System</span>
          </div>

          <h1 className="text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-8 drop-shadow-lg">
            ระบบบริหารงาน<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400">คิวอัจฉริยะ</span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed max-w-lg mb-12">
            จัดการคิว บริหารจุดบริการ และติดตามสถานะแบบเรียลไทม์ ยกระดับการให้บริการภาครัฐด้วยเทคโนโลยีที่ทันสมัย รวดเร็ว และแม่นยำ
          </p>

          <div className="flex gap-4">
            <div className="px-6 py-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex flex-col items-center min-w-[120px]">
              <span className={`text-3xl font-black text-white mb-1 ${GeistMono.className}`}>FAST</span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Service</span>
            </div>
            <div className="px-6 py-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex flex-col items-center min-w-[120px]">
              <span className={`text-3xl font-black text-white mb-1 ${GeistMono.className}`}>REAL</span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white/50 relative">
        {/* Mobile Background (Shown only on small screens) */}
        <div className="absolute inset-0 md:hidden overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-1/2 -left-32 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

          <div className="mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-500/30 mb-6 rotate-3">
              <UserCheck size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">เข้าสู่ระบบ</h2>
            <p className="text-slate-500 font-medium">กรุณาเลือกชื่อเจ้าหน้าที่และระบุรหัสผ่าน</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center gap-3 border border-red-100 animate-in shake">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <div className="space-y-1.5" ref={dropdownRef}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">ชื่อเจ้าหน้าที่</label>
              <div className="relative">
                <div
                  className={`relative cursor-pointer group transition-all duration-200 ${isOpen ? 'ring-2 ring-pink-500/20' : ''}`}
                  onClick={() => {
                    setIsOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                >
                  <Search className={`absolute left-4 top-4 transition-colors ${isOpen || search ? 'text-pink-500' : 'text-slate-400'}`} size={20} />
                  <input
                    ref={inputRef}
                    type="text"
                    className="w-full pl-12 pr-10 py-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-pink-500 focus:bg-white transition-all font-semibold text-slate-700 placeholder:text-slate-400"
                    placeholder="พิมพ์ชื่อเพื่อค้นหา..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setIsOpen(true);
                      setSelectedPerson(null);
                    }}
                    onFocus={() => setIsOpen(true)}
                  />
                  <ChevronDown className={`absolute right-4 top-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-pink-500' : ''}`} size={20} />
                </div>

                {isOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 p-2">
                    {loading ? (
                      <div className="p-4 text-center text-slate-400 text-sm">กำลังโหลดข้อมูล...</div>
                    ) : filtered.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center text-slate-400 text-sm gap-2">
                        <Search size={24} className="opacity-20" />
                        <span>ไม่พบรายชื่อที่ค้นหา</span>
                      </div>
                    ) : (
                      filtered.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPerson(p);
                            setSearch(p.fullname);
                            setIsOpen(false);
                          }}
                          className={`px-4 py-3 cursor-pointer flex justify-between items-center group transition-all rounded-xl ${selectedPerson?.id === p.id ? 'bg-pink-50' : 'hover:bg-slate-50'}`}
                        >
                          <div>
                            <div className={`font-bold transition-colors ${selectedPerson?.id === p.id ? 'text-pink-600' : 'text-slate-700 group-hover:text-slate-900'}`}>{p.fullname}</div>
                            {p.nickname && <div className="text-xs text-slate-400 font-medium group-hover:text-slate-500">ชื่อเล่น: {p.nickname}</div>}
                          </div>
                          {selectedPerson?.id === p.id && <Check size={18} className="text-pink-500" />}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">รหัสผ่าน</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition-all font-semibold text-slate-700 placeholder:text-slate-400"
                  placeholder="Password"
                />
              </div>
            </div>

            {/* Turnstile Widget */}
            <div className="py-2">
              <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />
            </div>

            <button
              type="submit"
              disabled={loginLoading || !selectedPerson || !password || !turnstileToken}
              className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-pink-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2 mt-8"
            >
              {loginLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight size={20} className="opacity-80 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400 font-medium mt-6">
              © {new Date().getFullYear()} Government Queue System. All rights reserved.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}