'use client';

import { ReactNode } from 'react';
import { useLayout } from '@/context/LayoutContext';
import { DashboardHeader } from '@/components/DashboardHeader';
import { GeistSans } from 'geist/font/sans';

export function MasterLayout({ children }: { children: ReactNode }) {
    const { title, subtitle, leftIcon, rightContent, searchBar, userProfile, fullWidth } = useLayout();

    return (
        <div className={`min-h-[100dvh] bg-[#f8fafc] relative ${GeistSans.className}`}>
            {/* Background Decoration (Fixed) */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-pink-50/50 to-transparent pointer-events-none z-0" />
            <div className="fixed -top-32 -right-32 w-[600px] h-[600px] bg-pink-100/30 rounded-full blur-3xl pointer-events-none animate-pulse z-0" />
            <div className="fixed top-1/2 -left-32 w-[500px] h-[500px] bg-purple-100/30 rounded-full blur-3xl pointer-events-none animate-pulse z-0" style={{ animationDelay: '1s' }} />

            {/* Fixed Header */}
            <DashboardHeader
                title={title}
                subtitle={subtitle}
                leftIcon={leftIcon}
                rightContent={rightContent}
                searchBar={searchBar}
                userProfile={userProfile}
                fullWidth={fullWidth}
                adminMenu={useLayout().adminMenu}
                className="fixed top-2 md:top-4 z-50 left-2 right-2 md:left-4 md:right-4"
            />

            {/* Main Content Area */}
            {/* Added padding-top to account for fixed header (approx 80px + spacing) */}
            <main className={`relative z-10 pt-28 md:pt-32 pb-12 ${!fullWidth ? 'max-w-7xl mx-auto px-6' : 'w-full px-6'}`}>
                {children}
            </main>
        </div>
    );
}
