'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface LayoutState {
    title: string;
    subtitle?: ReactNode;
    leftIcon?: ReactNode;
    rightContent?: ReactNode;
    searchBar?: ReactNode;
    userProfile?: ReactNode;
    fullWidth?: boolean;
    adminMenu?: boolean; // New: Show Admin Menu in Header
    userRole?: string;   // New: Current User Role
}

interface LayoutContextType extends LayoutState {
    setLayout: (state: Partial<LayoutState>) => void;
    resetLayout: () => void;
}

const defaultState: LayoutState = {
    title: '',
    subtitle: null,
    leftIcon: null,
    rightContent: null,
    searchBar: null,
    userProfile: null,
    fullWidth: false,
    adminMenu: false,
    userRole: 'staff',
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<LayoutState>(defaultState);
    const pathname = usePathname();
    const router = useRouter();

    // Load Role & Protect Routes
    useEffect(() => {
        const role = localStorage.getItem('user_role') || 'staff';
        setState(prev => ({ ...prev, userRole: role }));

        // Protect Admin Routes
        const roleToCheck = (role && role !== 'null' && role !== 'undefined') ? role.toLowerCase() : 'staff';

        if (pathname?.startsWith('/dashboard/admin') && roleToCheck !== 'admin') {
            console.log('Access Denied: User role is', role);
            router.push('/dashboard');
        }
    }, [pathname, router]);

    const setLayout = (newState: Partial<LayoutState>) => {
        setState(prev => ({ ...prev, ...newState }));
    };

    const resetLayout = () => {
        setState(defaultState);
    };

    return (
        <LayoutContext.Provider value={{ ...state, setLayout, resetLayout }}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
}
