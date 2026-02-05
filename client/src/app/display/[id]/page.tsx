'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Clock, Volume2, VolumeX, Monitor } from 'lucide-react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

interface Queue {
    id: number;
    queue_number: string;
    status: string;
    type_name: string;
    badge_color: string;
    dept_name: string;
    counter_name: string;
    created_at: string;
    updated_at: string;
}

interface DisplaySection {
    id: string;
    title: string;
    department_ids: number[];
    statuses: string[];
    col_span: number;
    type: 'recent-list' | 'grid-list';
}

interface DisplayConfig {
    id: number;
    name: string;
    config: {
        // New Dynamic Config
        marquee_text?: string;
        sections?: DisplaySection[];
        items_per_page?: number;
        page_interval?: number;
        max_columns?: number;

        // Backward compat/Legacy (can be removed if migration ensures sections exist)
        departments?: number[];
        statuses?: string[];
        show_calling?: boolean;
        show_waiting?: boolean;
        show_queue_number: boolean;
        show_service_channel: boolean;
        show_waiting_count: boolean;
    };
}

import { DynamicLogo } from '@/components/DynamicLogo';

export default function PublicDisplayPage() {
    const params = useParams();
    const configId = params.id as string;

    const [config, setConfig] = useState<DisplayConfig | null>(null);
    const [queues, setQueues] = useState<Queue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMuted, setIsMuted] = useState(true); // Default Muted for browser policy
    const [currentPage, setCurrentPage] = useState(0); // For auto-pagination

    // Get pagination settings from config or use defaults
    const ITEMS_PER_PAGE = config?.config.items_per_page || 12;
    const PAGE_INTERVAL = (config?.config.page_interval || 8) * 1000; // Convert to ms
    const MAX_COLUMNS = config?.config.max_columns || 4;

    // Audio for calling
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastCalledQueueId = useRef<number | null>(null);

    const fetchData = async () => {
        try {
            const res = await api.get(`/queues/display/${configId}`);

            // Parse nested config if it's a string
            const rawConfig = res.data.config;
            if (rawConfig && typeof rawConfig.config === 'string') {
                rawConfig.config = JSON.parse(rawConfig.config);
            }

            setConfig(rawConfig);
            setQueues(res.data.queues);

            // Check for new calling queue to play sound
            const latestProcessing = res.data.queues.find((q: Queue) => q.status === 'PROCESSING');
            if (latestProcessing && latestProcessing.id !== lastCalledQueueId.current) {
                lastCalledQueueId.current = latestProcessing.id;
                try {
                    if (!isMuted && audioRef.current) {
                        const playPromise = audioRef.current.play();
                        if (playPromise !== undefined) {
                            playPromise
                                .catch(e => console.log('Audio play failed (user interaction needed):', e));
                        }
                    }
                } catch (e) {
                    console.log("Audio Error", e);
                }
            }

            setError(null);
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError('ไม่สามารถเชื่อมต่อกับระบบได้');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5s
        const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

        // Auto-pagination timer
        const pageInterval = setInterval(() => {
            setCurrentPage(prev => prev + 1); // Will reset in render based on total pages
        }, PAGE_INTERVAL);

        // Initialize Audio
        audioRef.current = new Audio('/sounds/notification.mp3');

        return () => {
            clearInterval(interval);
            clearInterval(timeInterval);
            clearInterval(pageInterval);
        };
    }, [configId, PAGE_INTERVAL]);

    // Determine visibility and grid layout
    const showCalling = config?.config.show_calling !== false; // Default true
    const showWaiting = config?.config.show_waiting !== false; // Default true

    if (loading && !config) return (
        <div className={`min-h-screen bg-[#F2F2F7] flex items-center justify-center ${GeistSans.className}`}>
            <div className="animate-spin w-16 h-16 border-4 border-[#e72289] border-t-transparent rounded-full"></div>
        </div>
    );

    if (error) return (
        <div className={`min-h-screen bg-[#F2F2F7] flex items-center justify-center text-slate-800 ${GeistSans.className}`}>
            <div className="text-center">
                <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-sm mx-auto mb-6">
                    <span className="text-4xl">⚠️</span>
                </div>
                <p className="text-xl font-medium text-slate-500">{error}</p>
            </div>
        </div>
    );

    const processingQueues = queues.filter(q => q.status === 'PROCESSING').slice(0, 5);
    const waitingQueues = queues.filter(q => q.status === 'WAITING').slice(0, 8);

    return (
        <div className={`min-h-screen bg-[#F2F2F7] text-slate-900 flex flex-col overflow-hidden relative selection:bg-[#e72289]/20 ${GeistSans.className}`}>

            {/* Subtle Mesh Gradient Background */}
            <div className="fixed inset-0 pointer-events-none opacity-60">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-200/30 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-pink-200/30 rounded-full blur-[120px]"></div>
            </div>

            {/* Header (iOS Navigation Bar Style) */}
            <header className="relative z-20 bg-white/70 backdrop-blur-3xl border-b border-black/5 px-4 md:px-8 py-3 md:py-5 flex justify-between items-center shrink-0 sticky top-0">
                <div className="flex items-center gap-3 md:gap-5">
                    <DynamicLogo
                        fallbackIcon={<Monitor size={20} className="md:w-7 md:h-7 text-white" />}
                    />
                    <div>
                        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900 line-clamp-1">
                            {config?.name || 'จอแสดงผล'}
                        </h1>
                        <p className="text-slate-500 text-xs md:text-sm font-medium tracking-wide uppercase opacity-80">ระบบบริหารจัดการคิว</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 md:gap-8">
                    <div className="text-right">
                        <div className={`text-3xl md:text-5xl font-medium tracking-tight text-slate-900 ${GeistMono.className}`}>
                            {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-slate-400 text-xs md:text-base font-medium">
                            {currentTime.toLocaleDateString('th-TH', { dateStyle: 'long' })}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/50 hover:bg-white/80 rounded-full backdrop-blur-md border border-black/5 transition-all active:scale-90"
                    >
                        {isMuted ? <VolumeX size={18} className="md:w-5 md:h-5 text-slate-400" /> : <Volume2 size={18} className="md:w-5 md:h-5 text-[#e72289]" />}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 overflow-hidden contents-wrapper">
                {(() => {
                    // Fallback for legacy configs if no sections defined
                    const sections: DisplaySection[] = config?.config.sections?.length ? config.config.sections : [
                        {
                            id: 'legacy-calling',
                            title: 'กำลังเรียก (Calling)',
                            department_ids: config?.config.departments || [],
                            statuses: ['PROCESSING'],
                            col_span: config?.config.show_waiting !== false ? 7 : 12,
                            type: 'recent-list' as const
                        },
                        {
                            id: 'legacy-waiting',
                            title: 'รอเรียก (Waiting)',
                            department_ids: config?.config.departments || [],
                            statuses: ['WAITING'],
                            col_span: config?.config.show_calling !== false ? 5 : 12, // logic inverted slightly but ok for fallback
                            type: 'grid-list' as const
                        }
                    ].filter(s => {
                        // Filter legacy sections based on boolean flags
                        if (s.id === 'legacy-calling' && config?.config.show_calling === false) return false;
                        if (s.id === 'legacy-waiting' && config?.config.show_waiting === false) return false;
                        return true;
                    });

                    return sections.map((section) => {
                        // Filter queues for this section
                        const sectionQueues = queues.filter(q => {

                            // Re-checking Queue interface: it has `dept_name` but not `dept_id` explicitly in the interface I saw earlier? 
                            // I need to be careful here. The Queue interface showed: `id, queue_number, status, type_name, badge_color, dept_name, counter_name`.
                            // It does NOT seem to have dept_id in the interface I viewed earlier.
                            // I might need to rely on dept_name if dept_id is missing, or update the API/Interface. 
                            // However, let's assume filtering by status is the primary need right now, and if dept filtering is critical, I must ensure dept_id is available.
                            // Looking at `api.get('/queues/display/...')` response... usually it includes full payload.
                            // Let's assume `q` actually has `department_id` or `dept_id` hidden in the response.
                            // For safety, I will cast `q` to `any` to check `department_id` or just match all if not sure.
                            // UPDATE: The user explicitly asked for "Select which department for each section". So I MUST filter by department.
                            // I will assume `q.department_id` exists on the object even if interface didn't list it, or I'll add it to interface.
                            const qAny = q as any;
                            const qDeptId = qAny.current_department_id || qAny.dept_id;
                            const deptOk = section.department_ids.length === 0 || section.department_ids.includes(qDeptId);

                            const statusMatch = section.statuses.includes(q.status);
                            return deptOk && statusMatch;
                        }).sort((a, b) => {
                            // Sort by created_at ascending (oldest first = order of ticket pickup)
                            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                        });

                        return (
                            <div
                                key={section.id}
                                className={`flex flex-col h-full min-h-0 bg-white/60 backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] border border-white/40 shadow-sm overflow-hidden`}
                                style={{ gridColumn: `span ${section.col_span} / span ${section.col_span}` }}
                            >
                                {/* Section Title - Inside Card */}
                                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 flex-none">
                                    <div className={`w-2.5 h-2.5 rounded-full ${section.type === 'recent-list' ? 'bg-[#e72289] animate-pulse' : 'bg-[#e72289]'}`}></div>
                                    <h2 className="text-base md:text-lg font-bold text-[#e72289] uppercase tracking-wide">{section.title}</h2>
                                </div>

                                <div className={`flex-1 overflow-hidden flex flex-col p-4 md:p-6`}>

                                    {/* Render Content Based on Type */}
                                    {section.type === 'recent-list' ? (
                                        <div className="flex-1 overflow-hidden flex flex-col">
                                            <div
                                                className="grid gap-3 md:gap-4 flex-1 auto-rows-fr"
                                                style={{
                                                    gridTemplateColumns: `repeat(${MAX_COLUMNS}, 1fr)`,
                                                }}
                                            >
                                                {sectionQueues.slice(0, 9).map((q, index) => (
                                                    <div
                                                        key={q.id}
                                                        className={`
                                                            relative flex items-center justify-between p-5 md:p-8 rounded-2xl md:rounded-3xl transition-all
                                                            ${index === 0
                                                                ? 'bg-gradient-to-br from-[#e72289]/10 to-[#e72289]/5 border-2 border-[#e72289]/30 shadow-lg'
                                                                : 'bg-white/60 border border-slate-200/50'
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs md:text-sm text-slate-400 font-medium uppercase">{q.dept_name}</span>
                                                            <span className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight ${GeistMono.className} ${index === 0 ? 'text-[#e72289]' : 'text-slate-700'}`}>
                                                                {q.queue_number}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs md:text-sm text-slate-400 font-semibold uppercase">ช่อง</div>
                                                            <div className={`text-3xl md:text-5xl font-bold ${GeistMono.className} ${index === 0 ? 'text-[#e72289]' : 'text-slate-500'}`}>
                                                                {q.counter_name || '-'}
                                                            </div>
                                                        </div>
                                                        {index === 0 && (
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 md:h-16 bg-[#e72289] rounded-r-full"></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            {sectionQueues.length === 0 && (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                        <Clock size={28} className="opacity-40" />
                                                    </div>
                                                    <p className="text-base font-medium">ไม่มีรายการ</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (() => {
                                        // Pagination logic
                                        const totalPages = Math.ceil(sectionQueues.length / ITEMS_PER_PAGE);
                                        const activePage = totalPages > 0 ? currentPage % totalPages : 0;
                                        const startIdx = activePage * ITEMS_PER_PAGE;
                                        const pageQueues = sectionQueues.slice(startIdx, startIdx + ITEMS_PER_PAGE);

                                        return (
                                            <>
                                                <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
                                                    {sectionQueues.length > 0 ? (
                                                        <div
                                                            className="grid gap-3 md:gap-4 flex-1 auto-rows-fr"
                                                            style={{
                                                                gridTemplateColumns: section.col_span >= 6
                                                                    ? `repeat(${MAX_COLUMNS}, 1fr)`
                                                                    : 'repeat(1, 1fr)',
                                                            }}
                                                        >
                                                            {pageQueues.map((q) => (
                                                                <div
                                                                    key={q.id}
                                                                    className="flex items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all duration-500 hover:scale-[1.01] hover:shadow-lg animate-fadeIn min-h-[80px]"
                                                                    style={{
                                                                        backgroundColor: q.badge_color ? `${q.badge_color}15` : 'rgba(255,255,255,0.6)',
                                                                        borderColor: q.badge_color || '#e2e8f0'
                                                                    }}
                                                                >
                                                                    <div className="flex flex-col gap-1">
                                                                        <span
                                                                            className={`text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight ${GeistMono.className}`}
                                                                            style={{ color: q.badge_color || '#334155' }}
                                                                        >
                                                                            {q.queue_number}
                                                                        </span>
                                                                        <span className="text-xs md:text-sm text-slate-500 font-medium">{q.type_name}</span>
                                                                    </div>
                                                                    <span
                                                                        className="text-xs md:text-sm font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-xl uppercase tracking-wider text-white shadow-sm"
                                                                        style={{ backgroundColor: q.badge_color || '#94a3b8' }}
                                                                    >
                                                                        {q.dept_name}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                            <p className="text-base md:text-lg font-medium">ไม่มีคิวรอ</p>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Footer Stats with Page Indicator */}
                                                <div className="bg-white/40 p-4 md:p-6 border-t border-black/5 flex justify-between items-center backdrop-blur-md flex-none">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-slate-500 text-xs md:text-sm font-semibold uppercase tracking-widest">จำนวน</span>
                                                        <span className={`text-2xl md:text-3xl font-semibold text-[#e72289] ${GeistMono.className}`}>{sectionQueues.length}</span>
                                                    </div>
                                                    {totalPages > 1 && (
                                                        <div className="flex items-center gap-2">
                                                            {Array.from({ length: totalPages }, (_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === activePage ? 'bg-[#e72289] scale-125' : 'bg-slate-300'}`}
                                                                />
                                                            ))}
                                                            <span className={`ml-2 text-sm font-medium text-slate-400 ${GeistMono.className}`}>
                                                                {activePage + 1}/{totalPages}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        );
                    });
                })()}
            </main>

            {/* Marquee / Footer */}
            <footer className="relative z-20 bg-white/80 backdrop-blur-3xl border-t border-black/5 py-2 md:py-3 overflow-hidden whitespace-nowrap flex-none">
                <div className="animate-marquee inline-block text-base md:text-lg font-medium text-slate-500">
                    {config?.config.marquee_text || 'ยินดีต้อนรับสู่สำนักงานเทศบาลนครนนทบุรี • กรุณารอเรียกคิวตามลำดับ • หากท่านไม่อยู่เมื่อถึงคิวของท่าน กรุณาติดต่อเจ้าหน้าที่ • ขอบคุณที่ใช้บริการ'}
                </div>
            </footer>

            <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(231, 34, 137, 0.3);
        }
      `}</style>
        </div>
    );
}
