'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Building2, Ticket, ArrowLeft, Settings } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menu = [
    { name: 'จัดการบุคลากร', href: '/dashboard/admin/personnel', icon: Users },
    { name: 'โครงสร้าง/แผนก', href: '/dashboard/admin/departments', icon: Building2 },
    { name: 'ประเภทคิว (Kiosk)', href: '/dashboard/admin/queues', icon: Ticket },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xl">
            <Settings className="text-blue-600" />
            Admin Panel
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menu.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 px-4 py-2"
          >
            <ArrowLeft size={16} /> กลับหน้าหลัก
          </Link>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}