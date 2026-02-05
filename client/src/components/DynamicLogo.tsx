'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Shield } from 'lucide-react';

interface DynamicLogoProps {
    className?: string;
    fallbackIcon?: React.ReactNode;
}

export function DynamicLogo({ className = '', fallbackIcon }: DynamicLogoProps) {
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogo = async () => {
            try {
                // We might want to cache this or use a context provider in the future
                // For now, a simple fetch is fine
                const res = await api.get('/admin/settings');
                if (res.data.logo_url) {
                    setLogoUrl(res.data.logo_url);
                }
            } catch (err) {
                console.error('Failed to load logo:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogo();
    }, []);

    if (loading) return <div className={`w-full h-full animate-pulse bg-slate-200 rounded-2xl ${className}`} />;

    if (logoUrl) {
        return (
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg overflow-hidden bg-white border border-slate-200 ${className}`}>
                <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            </div>
        );
    }

    if (fallbackIcon) return (
        <div className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#e72289] to-[#c01b70] rounded-full flex items-center justify-center shadow-lg shadow-pink-500/20 ${className}`}>
            {/* If fallbackIcon is passed, we might need to adjust its size or just render it */}
            <div className="text-white transform scale-125">
                {fallbackIcon}
            </div>
        </div>
    );

    return null;
}
