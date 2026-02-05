'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Lock, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', formData);
      if (res.data.success) {
        const { user, token } = res.data;

        // Check admin role
        if (user.role !== 'admin') {
          setError('บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้า Admin');
          setIsLoading(false);
          return;
        }

        // Save JWT token and user info
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('admin_token', 'true');
        localStorage.setItem('admin_name', user.fullname);
        router.push('/dashboard/admin');
      }
    } catch (err) {
      setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden ${GeistSans.className}`}>

      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-pink-100/40 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-purple-100/40 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="bg-white/70 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/60 relative z-10 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex p-5 bg-gradient-to-br from-[#e72289] to-[#c01b70] rounded-3xl text-white mb-6 shadow-lg shadow-pink-500/30 transform rotate-3 hover:rotate-6 transition-transform duration-500">
            <ShieldCheck size={48} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Admin Portal</h1>
          <p className="text-slate-500 text-base font-medium">เข้าสู่ระบบจัดการคิว (Administrator)</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Username</label>
              <div className="relative group/input">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-[#e72289] transition-colors" size={20} />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/10 focus:border-[#e72289] outline-none transition-all font-bold text-slate-800 placeholder-slate-400"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-[#e72289] transition-colors" size={20} />
                <input
                  type="password"
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/10 focus:border-[#e72289] outline-none transition-all font-bold text-slate-800 placeholder-slate-400"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 text-rose-600 text-sm font-bold bg-rose-50 p-4 rounded-2xl border border-rose-100 animate-in fade-in slide-in-from-top-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#e72289] hover:bg-[#c01b70] text-white rounded-2xl font-bold text-lg shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>เข้าสู่ระบบ <ArrowRight size={20} /></>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className={`text-xs text-slate-400 font-bold ${GeistMono.className}`}>
            &copy; 2024 Queue Management System
          </p>
        </div>
      </div>
    </div>
  );
}