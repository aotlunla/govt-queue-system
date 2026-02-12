'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Shield, KeyRound, ExternalLink, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface LicenseStatus {
    licensed: boolean;
    reason?: string;
    message?: string;
    domain?: string;
}

export function LicenseGuard({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<LicenseStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [serialInput, setSerialInput] = useState('');
    const [activating, setActivating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const checkLicense = useCallback(async () => {
        try {
            const res = await api.get('/license/status');
            setStatus(res.data);
        } catch {
            // If API fails entirely (e.g. server down), allow through
            setStatus({ licensed: true });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkLicense();
    }, [checkLicense]);

    const handleActivate = async () => {
        if (!serialInput.trim()) {
            setError('กรุณากรอก Serial Number');
            return;
        }

        setActivating(true);
        setError('');

        try {
            const res = await api.post('/license/activate', {
                serial_key: serialInput.trim()
            });

            if (res.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    setStatus({ licensed: true, domain: res.data.domain });
                }, 1500);
            }
        } catch (err: unknown) {
            const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
            setError(errorMessage);
        } finally {
            setActivating(false);
        }
    };

    // Format serial input with dashes
    const handleSerialChange = (value: string) => {
        // Remove all non-alphanumeric characters
        const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        // Add dashes every 4 characters
        const parts = clean.match(/.{1,4}/g) || [];
        setSerialInput(parts.join('-').substring(0, 19)); // Max XXXX-XXXX-XXXX-XXXX = 19 chars
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    // Licensed — show normal content
    if (status?.licensed) {
        return <>{children}</>;
    }

    // Success animation
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
                <div className="text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-emerald-800 mb-2">เปิดใช้งานสำเร็จ!</h2>
                    <p className="text-emerald-600 font-medium">กำลังเข้าสู่ระบบ...</p>
                </div>
            </div>
        );
    }

    // Not licensed — show activation screen
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo / Shield */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2">LED Smart Queue</h1>
                    <p className="text-slate-400 font-medium">License Activation Required</p>
                </div>

                {/* Activation Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Domain mismatch warning */}
                    {status?.reason === 'domain_mismatch' && (
                        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-amber-300 text-sm font-bold">Domain ไม่ตรง</p>
                                <p className="text-amber-400/70 text-xs mt-1">{status.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Serial Input */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">
                            <KeyRound className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                            Serial Number
                        </label>
                        <input
                            type="text"
                            value={serialInput}
                            onChange={(e) => handleSerialChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-xl font-mono tracking-[0.3em] placeholder:text-slate-600 placeholder:tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all"
                            maxLength={19}
                            autoFocus
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <p className="text-red-300 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Activate Button */}
                    <button
                        onClick={handleActivate}
                        disabled={activating || serialInput.length < 19}
                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {activating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                กำลังตรวจสอบ...
                            </>
                        ) : (
                            <>
                                <KeyRound className="w-5 h-5" />
                                เปิดใช้งาน (Activate)
                            </>
                        )}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">ยังไม่มี Serial?</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    {/* Purchase Link */}
                    <a
                        href="https://line.me/ti/p/~smartqueue"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                    >
                        <ExternalLink className="w-4 h-4" />
                        ติดต่อซื้อ Serial Number
                    </a>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-600 text-xs mt-6 font-medium">
                    © LED Smart Queue — Licensed Software
                </p>
            </div>
        </div>
    );
}
