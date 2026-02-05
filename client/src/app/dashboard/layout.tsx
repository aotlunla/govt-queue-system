'use client';

import { LayoutProvider } from '@/context/LayoutContext';
import { MasterLayout } from '@/components/MasterLayout';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <LayoutProvider>
            <MasterLayout>
                {children}
            </MasterLayout>
        </LayoutProvider>
    );
}
