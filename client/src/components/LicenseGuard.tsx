'use client';

import Script from 'next/script';

export function LicenseGuard({ children }: { children: React.ReactNode }) {
    console.log('LicenseGuard: Render (Next.js Script)');

    return (
        <>
            <Script
                src={process.env.NEXT_PUBLIC_LICENSE_SCRIPT_URL || "https://mlicense.vercel.app/license.js"}
                strategy="afterInteractive"
                onLoad={() => console.log('✅ License Script Loaded via next/script')}
                onError={(e) => console.error('❌ License Script Failed via next/script', e)}
            />
            {children}
        </>
    );
}
