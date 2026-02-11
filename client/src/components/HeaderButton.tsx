'use client';

import { ReactNode } from 'react';
import { GeistSans } from 'geist/font/sans';

interface HeaderButtonProps {
    icon?: ReactNode;
    label?: string;
    subLabel?: string;
    onClick?: () => void;
    className?: string;
    variant?: 'default' | 'primary' | 'danger';
    isActive?: boolean;
}

export function HeaderButton({
    icon,
    label,
    subLabel,
    onClick,
    className = '',
    variant = 'default',
    isActive = false
}: HeaderButtonProps) {
    // Base styles: Flex layout, padding, font, transition
    // Mobile: icon only with compact padding. sm+: full label with wider padding.
    const baseStyles = "h-12 flex items-center gap-1.5 sm:gap-3 px-3 sm:px-5 transition-all duration-200 font-bold text-sm cursor-pointer group active:scale-95";

    const variants = {
        default: "clay-btn-secondary",
        primary: "clay-btn-primary",
        danger: "clay-btn-danger"
    };

    const activeStyles = isActive ? "ring-2 ring-offset-2 ring-pink-500/20 border-pink-200 bg-pink-50 text-pink-600" : "";

    return (
        <button
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${activeStyles} ${className} ${GeistSans.className}`}
        >
            {icon && (
                <div className={`flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 ${subLabel ? 'w-8 h-8 rounded-xl bg-white/50 text-current border border-white/20 shadow-inner' : ''}`}>
                    {icon}
                </div>
            )}

            {(label || subLabel) && (
                <div className="hidden sm:flex flex-col items-start text-left">
                    {label && <span className="leading-none drop-shadow-sm whitespace-nowrap">{label}</span>}
                    {subLabel && (
                        <span className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${subLabel === 'Online' ? 'text-emerald-500' : 'opacity-90'}`}>
                            {subLabel === 'Online' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                            {subLabel}
                        </span>
                    )}
                </div>
            )}
        </button>
    );
}
