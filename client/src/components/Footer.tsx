'use client';

import { useEffect, useState } from 'react';
import { GeistSans } from 'geist/font/sans';
import { api } from '@/lib/api';

interface FooterProps {
    className?: string;
    variant?: 'default' | 'fixed';
}

export function Footer({ className = '', variant = 'default' }: FooterProps) {
    const [footerText, setFooterText] = useState('Developed by Antigravity');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/admin/settings');
                if (res.data.footer_text) {
                    setFooterText(res.data.footer_text);
                }
            } catch (err) {
                console.error('Failed to fetch footer settings:', err);
            }
        };
        fetchSettings();
    }, []);

    const baseStyles = variant === 'fixed'
        ? 'absolute bottom-6 left-0 right-0 text-center'
        : 'py-6 text-center';

    return (
        <footer className={`${baseStyles} ${GeistSans.className} ${className}`}>
            <p className="text-slate-300 font-medium text-xs">
                © {new Date().getFullYear()} {footerText}
            </p>
        </footer>
    );
}
