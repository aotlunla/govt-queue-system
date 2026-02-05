'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Ticket, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { DynamicLogo } from '@/components/DynamicLogo';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export default function LandingPage() {
  const router = useRouter();
  const [queueNumber, setQueueNumber] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueNumber.trim()) return;

    // Format: YYMMDD + QueueNumber (e.g., A001 -> 260127A001)
    // If the user enters the full code, we use it as is.
    // Otherwise, we prepend the date.

    let targetCode = queueNumber.trim().toUpperCase();

    // Simple heuristic: if it's short (e.g. A001), prepend date. 
    // If it's long (e.g. 260127A001), assume it's full.
    if (targetCode.length < 8) {
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2); // 26
      // Month is 0-indexed, so +1. PadStart ensures '01' instead of '1'
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');

      const prefix = `${yy}${mm}${dd}`;
      targetCode = `${prefix}${targetCode}`;
    }

    router.push(`/tracking/${targetCode}`);
  };

  return (
    <div className={`min-h-[100dvh] bg-[#F2F2F7] flex flex-col items-center justify-center p-6 relative overflow-hidden ${GeistSans.className}`}>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-200/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-pink-200/40 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-md w-full z-10 flex flex-col items-center">

        {/* Logo / Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/50 border border-white/60 backdrop-blur-md shadow-sm mb-6">
            <span className={`text-slate-500 font-bold text-sm ${GeistMono.className}`}>
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <div className="w-24 h-24 bg-gradient-to-br from-[#e72289] to-[#c01b70] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-pink-500/40 mx-auto mb-6 rotate-3 hover:rotate-6 transition-transform duration-500 overflow-hidden p-4">
            <DynamicLogo fallbackIcon={<Ticket size={48} className="text-white" />} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
            ติดตามสถานะคิว
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            กรอกหมายเลขคิวของคุณเพื่อตรวจสอบสถานะ
          </p>
          <div className="mt-2 text-xs font-bold text-[#e72289] bg-pink-50 px-3 py-1 rounded-lg inline-block">
            * แสดงผลเฉพาะคิวของวันนี้เท่านั้น
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-100">
          <div className="bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-2 shadow-xl shadow-slate-200/50 focus-within:shadow-2xl focus-within:shadow-pink-500/20 focus-within:border-pink-200 transition-all duration-500">
            <div className="relative flex items-center">
              <div className="pl-6 text-slate-400">
                <Search size={24} />
              </div>
              <input
                type="text"
                value={queueNumber}
                onChange={(e) => setQueueNumber(e.target.value)}
                placeholder="เช่น A001"
                className={`w-full bg-transparent border-none px-4 py-6 text-2xl font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none uppercase ${GeistMono.className}`}
                autoFocus
              />
              <button
                type="submit"
                disabled={!queueNumber.trim()}
                className="m-2 p-4 bg-[#e72289] hover:bg-[#c01b70] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[2rem] shadow-lg shadow-pink-500/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 font-bold pr-6"
              >
                <span className="hidden sm:inline">ค้นหา</span>
                <ArrowRight size={24} />
              </button>
            </div>
          </div>
          <p className="text-center text-slate-400 text-sm mt-6 font-medium">
            ระบบจะนำคุณไปยังหน้าติดตามสถานะโดยอัตโนมัติ
          </p>
        </form>

      </div>

      <Footer className="absolute bottom-6 text-slate-300 font-medium text-xs" />
    </div>
  );
}
