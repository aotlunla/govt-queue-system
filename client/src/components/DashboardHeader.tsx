import { useState } from 'react';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GeistSans } from 'geist/font/sans';
import {
    LayoutDashboard, BarChart3, History, Users, Building2, Ticket,
    Settings, Monitor, Menu, X, Printer, UserCircle2, Shield
} from 'lucide-react';

interface DashboardHeaderProps {
    title: string;
    subtitle?: ReactNode;
    leftIcon?: ReactNode;
    rightContent?: ReactNode;
    className?: string;
    searchBar?: ReactNode;
    userProfile?: ReactNode;
    fullWidth?: boolean;
    adminMenu?: boolean;
}

export function DashboardHeader({
    title,
    subtitle,
    leftIcon,
    rightContent,
    searchBar,
    userProfile,
    className = '',
    fullWidth = false,
    adminMenu = false
}: DashboardHeaderProps) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const adminLinks = [
        { name: 'ภาพรวม', href: '/dashboard/admin', icon: LayoutDashboard },
        { name: 'ประเภทคิว', href: '/dashboard/admin/queues', icon: Ticket },
        { name: 'แผนก', href: '/dashboard/admin/departments', icon: Building2 },
        { name: 'สถานะ', href: '/dashboard/admin/case-roles', icon: UserCircle2 },
        { name: 'บุคลากร', href: '/dashboard/admin/personnel', icon: Users },
        { name: 'จอแสดงผล', href: '/dashboard/admin/display-settings', icon: Monitor },
        { name: 'Kiosk', href: '/dashboard/admin/kiosk-settings', icon: Printer },
        { name: 'สถิติ', href: '/dashboard/admin/stats', icon: BarChart3 },
        { name: 'ประวัติคิว', href: '/dashboard/admin/history', icon: History },
        { name: 'เข้าใช้งาน', href: '/dashboard/admin/logs', icon: Shield },
        { name: 'ตั้งค่า', href: '/dashboard/admin/settings', icon: Settings },
    ];

    return (
        <>
            <header className={`fixed top-2 md:top-4 z-50 left-2 right-2 md:left-4 md:right-4 rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/40 shadow-xl shadow-slate-200/40 transition-all duration-300 ${!fullWidth ? 'max-w-7xl mx-auto' : ''} ${className} ${GeistSans.className}`}>
                <div className={`${fullWidth ? 'w-full px-3 md:px-6' : 'max-w-7xl mx-auto px-3 md:px-6'} h-16 md:h-20 flex justify-between items-center gap-3 md:gap-4`}>
                    <div className="flex items-center gap-3 md:gap-4 shrink-0">
                        {leftIcon}
                        <div>
                            <h1 className="font-black text-lg md:text-xl text-slate-900 tracking-tight leading-none">{title}</h1>
                            {subtitle && <div className="mt-0.5 scale-90 md:scale-100 origin-left">{subtitle}</div>}
                        </div>
                    </div>

                    {/* Center: Admin Menu (Desktop) or Search Bar */}
                    {adminMenu ? (
                        <>
                            {/* Desktop Menu */}
                            <nav className="hidden lg:flex items-center gap-1 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/50">
                                {adminLinks.map((link) => {
                                    const isActive = pathname === link.href;
                                    const Icon = link.icon;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`
                                                flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 whitespace-nowrap relative shrink-0
                                                ${isActive
                                                    ? 'bg-white text-[#e72289] shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                                }
                                            `}
                                        >
                                            <Icon size={16} className={isActive ? "stroke-[2.5]" : "stroke-2"} />
                                            {link.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </>
                    ) : (
                        searchBar && (
                            <div className="flex-1 max-w-md hidden md:block">
                                {searchBar}
                            </div>
                        )
                    )}

                    {/* Right: User Profile & Actions */}
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        {adminMenu && (
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        )}
                        {userProfile}
                        {rightContent}
                    </div>
                </div>
            </header>

            {/* Mobile Admin Menu Dropdown */}
            {adminMenu && isMobileMenuOpen && (
                <div className="fixed top-20 left-2 right-2 z-40 bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl p-4 animate-in slide-in-from-top-4 duration-200 lg:hidden">
                    <div className="grid grid-cols-2 gap-2">
                        {adminLinks.map((link) => {
                            const isActive = pathname === link.href;
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`
                                        flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-sm font-bold transition-all duration-200
                                        ${isActive
                                            ? 'bg-pink-50 text-[#e72289] border border-pink-100'
                                            : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-white hover:shadow-md'
                                        }
                                    `}
                                >
                                    <Icon size={24} className={isActive ? "stroke-[2.5]" : "stroke-2"} />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}
