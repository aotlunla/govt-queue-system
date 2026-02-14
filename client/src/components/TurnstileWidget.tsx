import { Turnstile } from '@marsidev/react-turnstile';
import { useLayoutEffect, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface TurnstileWidgetProps {
    onVerify: (token: string) => void;
    onError?: () => void;
    className?: string;
}

export function TurnstileWidget({ onVerify, onError, className = '' }: TurnstileWidgetProps) {
    // Robust key selection: Env var -> API -> Hardcoded Test Key as fallback
    // Test Site Key: 1x00000000000000000000AA
    const [siteKey, setSiteKey] = useState(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '');
    const [loading, setLoading] = useState(true);

    // Ensure we only render on client
    const [mounted, setMounted] = useState(false);
    useLayoutEffect(() => setMounted(true), []);

    // Fetch site key from API if not set in env (or just to be sure to get latest)
    // We prefer the API value if set, so we can change it without redeploying env
    useEffect(() => {
        const fetchKey = async () => {
            try {
                const res = await api.get('/admin/settings');

                // Check if disabled (handled 0, false, null)
                const isEnabled = res.data.turnstile_enabled !== undefined ? !!res.data.turnstile_enabled : true;

                if (!isEnabled) {
                    console.log('Turnstile is disabled by admin.');
                    setSiteKey('DISABLED');
                    onVerify('DISABLED'); // Auto-verify
                    setLoading(false);
                    return;
                }

                if (res.data.turnstile_site_key) {
                    setSiteKey(res.data.turnstile_site_key);
                } else {
                    // Fallback to test key if not set
                    setSiteKey('1x00000000000000000000AA');
                }
            } catch (err) {
                console.error('Failed to fetch Turnstile key', err);
                // Fallback to test key on error to allow login attempt (validation will fail on backend if real key is needed)
                if (!siteKey) setSiteKey('1x00000000000000000000AA');
            } finally {
                setLoading(false);
            }
        };
        fetchKey();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    if (!mounted || loading) return <div className="h-[65px] w-full bg-slate-50/50 rounded-xl animate-pulse" />;

    // If disabled, return nothing (or null)
    if (siteKey === 'DISABLED') return null;

    if (!siteKey) return <div className="h-[65px] w-full bg-slate-50/50 rounded-xl animate-pulse" />;

    return (
        <div className={`flex justify-center ${className}`}>
            <Turnstile
                siteKey={siteKey}
                onSuccess={onVerify}
                onError={() => {
                    console.error('Turnstile Error');
                    if (onError) onError();
                }}
                options={{
                    theme: 'auto',
                    size: 'flexible',
                }}
            />
        </div>
    );
}
