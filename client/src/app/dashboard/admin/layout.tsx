'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLayout } from '@/context/LayoutContext';
import { Shield, User, LogOut } from 'lucide-react';
import { ProfileModal } from '@/components/ProfileModal';
import { HeaderButton } from '@/components/HeaderButton';
import { DynamicLogo } from '@/components/DynamicLogo';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setLayout } = useLayout();
  const [personnelName, setPersonnelName] = useState('');
  const [userId, setUserId] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem('user_name') || localStorage.getItem('current_personnel_name') || 'Admin';
    const id = localStorage.getItem('user_id') || '';
    setPersonnelName(name);
    setUserId(id);
  }, []);

  useEffect(() => {
    setLayout({
      title: "Admin Control",
      subtitle: (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Management System</span>
        </div>
      ),
      leftIcon: <DynamicLogo fallbackIcon={<Shield size={20} />} />,
      adminMenu: true,
      fullWidth: true,
      rightContent: (
        <>
          <div className="hidden md:block">
            <HeaderButton
              icon={<User size={18} />}
              label={personnelName}
              subLabel="Online"
              onClick={() => setIsProfileOpen(true)}
              variant="default"
            />
          </div>
          <HeaderButton
            icon={<LogOut size={18} />}
            label="Back to Dashboard"
            onClick={() => router.push('/dashboard')}
            variant="danger"
          />
        </>
      )
    });
  }, [setLayout, personnelName, router]);

  return (
    <div className="w-full">
      {children}

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={userId}
        currentName={personnelName}
      />
    </div>
  );
}