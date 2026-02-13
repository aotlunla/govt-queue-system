'use client';

import { useEffect } from 'react';

export function LicenseGuard({ children }: { children: React.ReactNode }) {
    console.log('LicenseGuard: Component Rendering');
    useEffect(() => {
        const scriptUrl = process.env.NEXT_PUBLIC_LICENSE_SCRIPT_URL || "https://mlicense.vercel.app/license.js";

        // Check if script already exists to prevent duplicates
        if (document.querySelector(`script[src="${scriptUrl}"]`)) return;

        console.log('Injecting License Script:', scriptUrl);

        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;

        script.onload = () => console.log('✅ License script loaded successfully:', scriptUrl);
        script.onerror = (e) => console.error('❌ License script failed to load:', e);

        document.body.appendChild(script);
    }, []);

    // Always render children, let script handle blocking if needed (overlay)
    return <>{children}</>;
}
