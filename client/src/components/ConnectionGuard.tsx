'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { WifiOff, RefreshCcw, Database } from 'lucide-react';
import { GeistSans } from 'geist/font/sans';

export function ConnectionGuard() {
    const [isOnline, setIsOnline] = useState(true);
    const [isRetrying, setIsRetrying] = useState(false);

    const checkHealth = async () => {
        try {
            // Since we are in Next.js client, we should use the same base URL logic or just try the relative path if proxy is working.
            // However, api instance is better because it handles the base URL.
            // API instance baseURL is already "/api", so we just need "/health"

            await api.get('/health', {
                timeout: 5000,
                // Skip global error handling if you have any interceptors that show alerts
                // validateStatus: () => true // We want to throw on 503
            });

            setIsOnline(true);
        } catch (err: any) {
            console.error('Health Check Failed:', err);
            // Only set offline if it's a network error or 503 (Service Unavailable)
            if (!err.response || err.response.status === 503 || err.code === 'ERR_NETWORK') {
                setIsOnline(false);
            }
        } finally {
            setIsRetrying(false);
        }
    };

    useEffect(() => {
        // Check immediately on mount
        checkHealth();

        // Poll every 2 minutes (120000 ms) instead of 30 seconds to reduce server load
        const interval = setInterval(checkHealth, 120000);
        return () => clearInterval(interval);
    }, []);

    const handleRetry = () => {
        setIsRetrying(true);
        // Add a small delay for UX
        setTimeout(checkHealth, 1000);
    };

    if (isOnline) return null;

    return (
        <div className={`fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 ${GeistSans.className}`}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border-4 border-red-100 relative overflow-hidden">

                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500" />
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-50 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-50 rounded-full blur-2xl" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 relative shadow-inner">
                        <Database className="w-12 h-12 text-red-300" />
                        <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md border border-red-100 animate-pulse">
                            <WifiOff className="w-8 h-8 text-red-500" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 mb-2">
                        ระบบขัดข้องชั่วคราว
                    </h2>

                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                        ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ในขณะนี้ <br />
                        เจ้าหน้าที่กำลังดำเนินการตรวจสอบแก้ไข <br />
                        <span className="text-xs text-slate-400 mt-2 block">(Database Connection Failed)</span>
                    </p>

                    <button
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="w-full py-3.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isRetrying ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>กำลังเชื่อมต่อ...</span>
                            </>
                        ) : (
                            <>
                                <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                                <span>ลองใหม่อีกครั้ง</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
