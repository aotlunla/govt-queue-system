'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Building2, Ticket, ArrowLeft, Settings, LogOut, Shield } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // ถ้าอยู่หน้า Login ไม่ต้องเช็ค
    if (pathname === '/dashboard/admin/login') {
      setIsAuthorized(true);
      return;
    }

    // เช็คว่า Login หรือยัง
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/dashboard/admin/login');
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  // ถ้ายังโหลดไม่เสร็จ หรืออยู่หน้า Login ให้แสดงแค่เนื้อหา (ไม่ต้องมี Sidebar)
  if (!isAuthorized || pathname === '/dashboard/admin/login') {
    return <>{children}</>;
  }

  // --- Static Sidebar Menu ---
  const menu = [
    { name: 'จัดการบุคลากร (Personnel)', href: '/dashboard/admin/personnel', icon: Users },
    { name: 'โครงสร้าง/แผนก (Depts)', href: '/dashboard/admin/departments', icon: Building2 }, // เดี๋ยวเราจะไปทำหน้านี้กัน
    { name: 'ประเภทคิว (Queue Types)', href: '/dashboard/admin/queues', icon: Ticket },
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_name');
    router.push('/dashboard/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex font-sans">
      
      {/* 🟢 Sidebar (Fixed) */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">Admin Console</h1>
            <p className="text-xs text-slate-400">ระบบจัดการคิว v1.0</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menu.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-2 text-sm text-red-500 hover:bg-red-50 px-4 py-3 rounded-xl transition-colors font-medium"
          >
            <LogOut size={18} /> ออกจากระบบ
          </button>
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 px-4 py-2 justify-center"
          >
            <ArrowLeft size={14} /> กลับหน้าหลัก
          </Link>
        </div>
      </aside>

      {/* 🟢 Content Area (Pushed right) */}
      <main className="flex-1 ml-72 p-8 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}