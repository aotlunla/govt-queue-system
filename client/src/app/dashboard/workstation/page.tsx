'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, socket } from '@/lib/api';
import {
    Clock, ArrowRight, User, RefreshCw, Search,
    CheckSquare, Square, History, Send, MapPin, Calendar, Plus,
    CheckCircle2, XCircle, LayoutGrid, MessageSquarePlus, X, Trash2, Megaphone, ChevronDown, ChevronUp, AlertTriangle, LogOut
} from 'lucide-react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { useLayout } from '@/context/LayoutContext';
import { ProfileModal } from '@/components/ProfileModal';
import { HeaderButton } from '@/components/HeaderButton';

interface Queue {
    id: number;
    queue_number: string;
    type_name: string;
    badge_color: string; // Dynamic color from DB
    role_name: string;
    status: string;
    created_at: string;
    updated_at: string;
    remark_count: number;
}

interface Log {
    id: number;
    action_type: string;
    action_details: string;
    staff_name: string;
    created_at: string;
}

function WorkstationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setLayout } = useLayout();

    // Data State
    const [stationName, setStationName] = useState('');
    const [personnelName, setPersonnelName] = useState('');
    const [userId, setUserId] = useState('');
    const [queues, setQueues] = useState<Queue[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [counters, setCounters] = useState<any[]>([]);
    const [activeCounterId, setActiveCounterId] = useState<string>(''); // Track active counter

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [focusedQueue, setFocusedQueue] = useState<Queue | null>(null);
    const [queueLogs, setQueueLogs] = useState<Log[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false); // Collapsible Timeline

    // Remark Modal State (Add)
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [remarkText, setRemarkText] = useState('');

    // Remark Management Modal State (View/Delete)
    const [isManageRemarksOpen, setIsManageRemarksOpen] = useState(false);
    const [selectedQueueForRemarks, setSelectedQueueForRemarks] = useState<Queue | null>(null);
    const [currentRemarks, setCurrentRemarks] = useState<Log[]>([]);

    // Overdue Alert State
    const [overdueAlertMinutes, setOverdueAlertMinutes] = useState<number>(0);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // 1. Initial Load
    useEffect(() => {
        const dId = localStorage.getItem('station_dept_id');
        const dName = localStorage.getItem('station_dept_name');
        const pName = localStorage.getItem('user_name') || localStorage.getItem('current_personnel_name');
        const pId = localStorage.getItem('user_id') || localStorage.getItem('current_personnel_id') || '';
        if (!dId) { router.push('/dashboard'); return; }

        setStationName(dName || 'Workstation');
        setPersonnelName(pName || 'Staff');
        setUserId(pId);

        const initData = async () => {
            await Promise.all([
                fetchQueues(dId),
                fetchConfig(),
                fetchSettings()
            ]);
        };
        initData();

        socket.on('queue_update', () => fetchQueues(dId));
        return () => { socket.off('queue_update'); };
    }, []);

    // Set Layout
    useEffect(() => {
        setLayout({
            title: stationName,
            subtitle: (
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/60 backdrop-blur-md border border-white/40 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm">
                        Workstation
                    </span>
                    <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                </div>
            ),
            leftIcon: <MapPin size={24} />,
            adminMenu: false,
            searchBar: (
                <div className="relative w-full max-w-md">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาหมายเลขคิว..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-100/50 border border-slate-200 focus:bg-white focus:border-[#e72289] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-400"
                    />
                </div>
            ),
            rightContent: (
                <>
                    <HeaderButton
                        onClick={() => setIsProfileOpen(true)}
                        icon={<User size={18} />}
                        label={personnelName}
                        subLabel="Online"
                    />
                    <HeaderButton
                        onClick={() => router.push('/dashboard')}
                        icon={<LogOut size={18} />}
                        label="เปลี่ยนจุด"
                        variant="danger"
                        className="hidden sm:flex"
                    />
                </>
            ),
            fullWidth: true
        });
    }, [setLayout, stationName, personnelName, searchTerm, router]);

    // 2.1 Handle Highlight Queue (from Search)
    useEffect(() => {
        const highlightId = searchParams.get('highlight_queue_id');
        if (highlightId && queues.length > 0) {
            const targetQueue = queues.find(q => q.id === Number(highlightId));
            if (targetQueue) {
                setFocusedQueue(targetQueue);
                setSelectedIds([targetQueue.id]); // Auto-select the queue
                // Clear param to avoid re-focusing on refresh
                router.replace('/dashboard/workstation', { scroll: false });
            }
        }
    }, [queues, searchParams]);

    // 2. Fetch Data
    const fetchQueues = async (dId: string) => {
        try {
            const res = await api.get(`/queues?dept_id=${dId}`);
            setQueues(res.data);

            // Re-validate focusedQueue if it exists in new data
            if (focusedQueue) {
                const stillExists = res.data.find((q: Queue) => q.id === focusedQueue.id);
                if (!stillExists) setFocusedQueue(null);
                else setFocusedQueue(stillExists); // Update to get new remark_count
            }
        } catch (err) { console.error(err); }
    };

    const fetchConfig = async () => {
        try {
            const res = await api.get('/queues/config');
            setDepartments(res.data.departments);
            setCounters(res.data.counters);

            // Auto-select counter
            if (res.data.counters && res.data.counters.length > 0) {
                const storedId = localStorage.getItem('station_counter_id');
                // Check if stored ID is valid (exists in the fetched list)
                const isValid = res.data.counters.some((c: any) => c.id.toString() === storedId);

                if (isValid && storedId) {
                    setActiveCounterId(storedId);
                } else {
                    // Default to the first counter if invalid or not set
                    const firstId = res.data.counters[0].id.toString();
                    setActiveCounterId(firstId);
                    localStorage.setItem('station_counter_id', firstId);
                }
            }
        } catch (err) { console.error(err); }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            if (res.data.overdue_alert_minutes) {
                setOverdueAlertMinutes(res.data.overdue_alert_minutes);
            }
        } catch (err) { console.error(err); }
    };

    const fetchLogs = async (queueId: number) => {
        setLoadingLogs(true);
        try {
            const res = await api.get(`/queues/${queueId}/logs`);
            setQueueLogs(res.data);
        } catch (err) { console.error(err); }
        finally { setLoadingLogs(false); }
    };

    const fetchRemarksOnly = async (queueId: number) => {
        try {
            const res = await api.get(`/queues/${queueId}/logs`);
            const remarks = res.data.filter((l: Log) => l.action_type === 'REMARK');
            setCurrentRemarks(remarks);
        } catch (err) { console.error(err); }
    };

    // 3. Handlers
    const handleCardClick = (queue: Queue) => {
        let newSelectedIds = [...selectedIds];

        if (newSelectedIds.includes(queue.id)) {
            // Deselect
            newSelectedIds = newSelectedIds.filter(id => id !== queue.id);
        } else {
            // Select
            newSelectedIds.push(queue.id);
        }

        setSelectedIds(newSelectedIds);

        // Logic for Focused Queue (Single View vs Bulk View)
        if (newSelectedIds.length === 1) {
            // If exactly one is selected, focus it
            const singleId = newSelectedIds[0];
            const singleQueue = queues.find(q => q.id === singleId) || queue;
            setFocusedQueue(singleQueue);
            fetchLogs(singleQueue.id);
            setIsTimelineOpen(false); // Default closed
        } else {
            // If 0 or >1 selected, clear focus (show empty or bulk view)
            setFocusedQueue(null);
        }
    };

    const toggleSelect = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const queue = queues.find(q => q.id === id);
        if (queue) handleCardClick(queue);
    };

    const handleCallQueue = async () => {
        if (selectedIds.length === 0 && !focusedQueue) return;

        // Determine IDs to call: either selected list or single focused item
        const idsToCall = selectedIds.length > 0 ? selectedIds : (focusedQueue ? [focusedQueue.id] : []);
        if (idsToCall.length === 0) return;

        const personnelId = localStorage.getItem('current_personnel_id');

        if (!activeCounterId) {
            alert('ไม่พบข้อมูลช่องบริการ (No Counter Selected)');
            return;
        }

        try {
            if (idsToCall.length === 1) {
                // Single Call
                await api.put(`/queues/${idsToCall[0]}/call`, {
                    counter_id: activeCounterId,
                    personnel_id: personnelId
                });
            } else {
                // Bulk Call
                await api.put('/queues/call-bulk', {
                    queue_ids: idsToCall,
                    counter_id: activeCounterId,
                    personnel_id: personnelId
                });
            }

            // Refresh
            fetchQueues(localStorage.getItem('station_dept_id') || '1');

            // Clear selection after bulk call
            if (idsToCall.length > 1) {
                setSelectedIds([]);
                setFocusedQueue(null);
            }
        } catch (err: any) {
            alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการเรียกคิว');
        }
    };

    const handleCancelCall = async (e: React.MouseEvent, queueId: number) => {
        e.stopPropagation();
        if (!confirm('ต้องการยกเลิกการเรียกคิวนี้ใช่หรือไม่? (คิวจะกลับไปสถานะรอเรียก)')) return;

        const personnelId = localStorage.getItem('current_personnel_id');
        try {
            await api.put(`/queues/${queueId}/cancel-call`, { personnel_id: personnelId });
            fetchQueues(localStorage.getItem('station_dept_id') || '1');
        } catch (err: any) {
            alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
        }
    };

    const handleCancelCallBulk = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`ต้องการยกเลิกการเรียก ${selectedIds.length} รายการใช่หรือไม่?`)) return;

        const personnelId = localStorage.getItem('current_personnel_id');
        try {
            await Promise.all(selectedIds.map(id =>
                api.put(`/queues/${id}/cancel-call`, { personnel_id: personnelId })
            ));

            fetchQueues(localStorage.getItem('station_dept_id') || '1');
            setSelectedIds([]);
            setFocusedQueue(null);
        } catch (err: any) {
            alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
        }
    };

    const handleTransfer = async (targetDeptId: number) => {
        const idsToProcess = selectedIds.length > 0 ? selectedIds : (focusedQueue ? [focusedQueue.id] : []);
        if (idsToProcess.length === 0) return;

        const personnelId = localStorage.getItem('current_personnel_id');
        const url = '/queues/transfer-bulk';
        const payload = {
            queue_ids: idsToProcess,
            target_dept_id: targetDeptId,
            personnel_id: personnelId
        };

        try {
            if (!confirm(`ยืนยันการส่งงาน ${idsToProcess.length} รายการ ไปยังฝ่ายใหม่?`)) return;
            await api.post(url, payload);
            setSelectedIds([]);
            setFocusedQueue(null);
            fetchQueues(localStorage.getItem('station_dept_id') || '1');
        } catch (err) { alert('เกิดข้อผิดพลาดในการส่งงาน'); }
    };

    const handleComplete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`ยืนยันจบงาน ${selectedIds.length} รายการ?`)) return;

        try {
            const personnelId = localStorage.getItem('current_personnel_id');

            if (selectedIds.length === 1) {
                // Single Complete
                await api.put(`/queues/${selectedIds[0]}/complete`, { personnel_id: personnelId });
            } else {
                // Bulk Complete
                await api.put('/queues/complete-bulk', { queue_ids: selectedIds, personnel_id: personnelId });
            }

            setSelectedIds([]);
            setFocusedQueue(null);
        } catch (err) { alert('เกิดข้อผิดพลาด'); }
    };

    const handleCancel = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`ยืนยันยกเลิก ${selectedIds.length} รายการ (ไม่มาแสดงตัว)?`)) return;

        try {
            const personnelId = localStorage.getItem('current_personnel_id');

            if (selectedIds.length === 1) {
                // Single Cancel
                await api.put(`/queues/${selectedIds[0]}/cancel`, { personnel_id: personnelId });
            } else {
                // Bulk Cancel
                await api.put('/queues/cancel-bulk', { queue_ids: selectedIds, personnel_id: personnelId });
            }

            setSelectedIds([]);
            setFocusedQueue(null);
        } catch (err) { alert('เกิดข้อผิดพลาด'); }
    };

    const openRemarkModal = () => {
        setRemarkText('');
        setIsRemarkModalOpen(true);
    };

    const submitRemark = async () => {
        if (!remarkText.trim()) return;

        const idsToRemark = selectedIds.length > 0 ? selectedIds : (focusedQueue ? [focusedQueue.id] : []);
        if (idsToRemark.length === 0) return;

        try {
            const personnelId = localStorage.getItem('current_personnel_id');

            // Send remark to all selected queues
            await Promise.all(idsToRemark.map(id =>
                api.post(`/queues/${id}/remark`, {
                    remark: remarkText,
                    personnel_id: personnelId
                })
            ));

            setIsRemarkModalOpen(false);

            // Refresh logic
            if (focusedQueue) fetchLogs(focusedQueue.id);
            fetchQueues(localStorage.getItem('station_dept_id') || '1');

            // Clear selection if bulk
            if (idsToRemark.length > 1) {
                setSelectedIds([]);
                setFocusedQueue(null);
            }
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการบันทึกหมายเหตุ');
        }
    };

    const openManageRemarks = (e: React.MouseEvent, queue: Queue) => {
        e.stopPropagation();
        setSelectedQueueForRemarks(queue);
        fetchRemarksOnly(queue.id);
        setIsManageRemarksOpen(true);
    };

    const handleDeleteRemark = async (logId: number) => {
        if (!confirm('ยืนยันลบหมายเหตุนี้?')) return;
        try {
            await api.delete(`/queues/logs/${logId}`);
            if (selectedQueueForRemarks) fetchRemarksOnly(selectedQueueForRemarks.id);
            if (focusedQueue) fetchLogs(focusedQueue.id);
            fetchQueues(localStorage.getItem('station_dept_id') || '1');
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการลบ');
        }
    };

    // Filter & Logic
    const filteredQueues = queues.filter(q =>
        q.queue_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getWaitingMinutes = (createdAt: string) => {
        const diff = Date.now() - new Date(createdAt).getTime();
        return Math.floor(diff / 60000);
    };

    return (
        <div className={`flex flex-col h-[calc(100dvh-8rem)] overflow-hidden relative ${GeistSans.className}`}>
            {/* ================= MAIN CONTENT AREA (Flex Row) ================= */}
            <div className="flex-1 flex overflow-hidden relative w-full gap-6 px-4 lg:px-6">

                {/* LEFT: Queue Grid (Scrollable) */}
                <div className="flex-1 flex flex-col min-w-0 relative w-full h-full pt-32 pb-8">
                    <div className="flex-1 flex flex-col clay-card overflow-hidden relative">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

                            {/* Background Decoration */}
                            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-pink-50/50 to-transparent pointer-events-none z-0"></div>

                            {/* Search & Filter Bar (Mobile Only) */}
                            <div className="relative z-10 pb-6 md:hidden">
                                <div className="flex items-center gap-4 bg-white/80 p-2.5 rounded-[2rem] shadow-sm border border-white/60 backdrop-blur-xl">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#e72289] transition-colors" size={20} />
                                        <input
                                            type="text"
                                            placeholder="ค้นหา..."
                                            className="w-full pl-12 pr-4 py-3 bg-white/50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/10 focus:bg-white transition-all font-bold text-slate-800 placeholder-slate-400 text-base"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="h-8 w-px bg-slate-200 mx-2"></div>
                                    <div className="flex items-center gap-2 px-4 text-slate-500 text-sm font-bold whitespace-nowrap">
                                        <LayoutGrid size={18} />
                                        <span className="hidden md:inline">{filteredQueues.length} รายการ</span>
                                        <span className="md:hidden">{filteredQueues.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Grid Area */}
                            <div className="z-0">
                                {filteredQueues.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-80 mt-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/40 backdrop-blur-sm">
                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                                            <RefreshCw size={32} className="opacity-20" />
                                        </div>
                                        <p className="text-xl font-bold text-slate-600">ไม่พบรายการคิว</p>
                                        <p className="text-sm font-medium opacity-60 mt-1">รายการคิวใหม่จะปรากฏที่นี่โดยอัตโนมัติ</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 min-[1250px]:grid-cols-4 2xl:grid-cols-5 gap-5 pb-24 lg:pb-0">
                                        {/* Waiting Queues */}
                                        {filteredQueues.filter(q => q.status === 'WAITING').map((q, index) => {
                                            const isSelected = selectedIds.includes(q.id);
                                            const badgeColor = q.badge_color || '#6366f1';

                                            return (
                                                <div
                                                    key={q.id}
                                                    onClick={() => handleCardClick(q)}
                                                    className={`
                                                relative p-6 rounded-[2rem] cursor-pointer select-none transition-all duration-300 group border-[3px] overflow-hidden clay-card-hover
                                                ${isSelected
                                                            ? 'bg-white shadow-2xl scale-[1.02] z-10'
                                                            : 'bg-white/60 backdrop-blur-xl border-white/40 hover:border-pink-200'
                                                        }
                                            `}
                                                    style={{
                                                        borderColor: isSelected ? badgeColor : (isSelected ? undefined : undefined),
                                                        animation: `fadeIn 0.5s ease-out ${index * 50}ms backwards`
                                                    } as React.CSSProperties}
                                                >
                                                    <div className="absolute top-0 left-0 w-full h-2 opacity-80" style={{ backgroundColor: badgeColor }}></div>

                                                    <div
                                                        onClick={(e) => toggleSelect(e, q.id)}
                                                        className={`absolute top-5 right-5 transition-all z-10 p-1.5 rounded-xl hover:bg-slate-50
                                                    ${isSelected ? 'text-[#e72289] scale-110 bg-pink-50' : 'text-slate-300 hover:text-[#e72289]'}
                                                `}
                                                    >
                                                        {isSelected ? <CheckSquare size={24} className="drop-shadow-sm" style={{ color: badgeColor }} /> : <Square size={24} />}
                                                    </div>

                                                    <div className="mt-2 mb-5 flex justify-between items-start">
                                                        <span
                                                            className="px-3 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wide shadow-sm"
                                                            style={{ backgroundColor: `${badgeColor}15`, color: badgeColor }}
                                                        >
                                                            {q.type_name}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className={`text-5xl font-black tracking-tighter ${GeistMono.className} ${overdueAlertMinutes > 0 && getWaitingMinutes(q.updated_at || q.created_at) >= overdueAlertMinutes ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                                                            {q.queue_number}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-slate-500 text-xs truncate font-bold mb-5 bg-white/50 p-2.5 rounded-xl border border-white/50 shadow-sm">
                                                        <User size={14} className="text-slate-400" /> {q.role_name}
                                                    </div>

                                                    <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between font-bold">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock size={12} />
                                                            {new Date(q.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>

                                                        {/* Remark Icon in Footer */}
                                                        {q.remark_count > 0 && (
                                                            <div
                                                                onClick={(e) => openManageRemarks(e, q)}
                                                                className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-600 rounded-full hover:bg-amber-200 transition-colors cursor-pointer shadow-sm"
                                                            >
                                                                <AlertTriangle size={10} />
                                                                <span className={`text-[9px] font-bold ${GeistMono.className}`}>{q.remark_count}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Divider */}
                                        {filteredQueues.some(q => q.status === 'PROCESSING') && (
                                            <div className="col-span-full py-6 flex items-center gap-4">
                                                <div className="h-px flex-1 bg-slate-200"></div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
                                                    กำลังเรียก (Called)
                                                </span>
                                                <div className="h-px flex-1 bg-slate-200"></div>
                                            </div>
                                        )}

                                        {/* Processing Queues */}
                                        {filteredQueues.filter(q => q.status === 'PROCESSING').map((q, index) => {
                                            const isSelected = selectedIds.includes(q.id);
                                            const badgeColor = q.badge_color || '#6366f1';

                                            return (
                                                <div
                                                    key={q.id}
                                                    onClick={() => handleCardClick(q)}
                                                    className={`
                                                relative p-6 rounded-[2rem] cursor-pointer select-none transition-all duration-300 group border-[3px] overflow-hidden clay-card-hover
                                                ${isSelected
                                                            ? 'bg-white shadow-2xl scale-[1.02] z-10'
                                                            : 'bg-emerald-50/50 backdrop-blur-xl border-emerald-200 hover:border-emerald-300'
                                                        }
                                            `}
                                                    style={{
                                                        borderColor: isSelected ? badgeColor : undefined,
                                                        animation: `fadeIn 0.5s ease-out ${index * 50}ms backwards`
                                                    }}
                                                >
                                                    <div className="absolute top-0 left-0 w-full h-2 opacity-80 bg-emerald-500"></div>

                                                    <div
                                                        onClick={(e) => toggleSelect(e, q.id)}
                                                        className={`absolute top-5 right-5 transition-all z-10 p-1.5 rounded-xl hover:bg-slate-50
                                                    ${isSelected ? 'text-emerald-600 scale-110 bg-emerald-50' : 'text-slate-300 hover:text-emerald-400'}
                                                `}
                                                    >
                                                        {isSelected ? <CheckSquare size={24} className="drop-shadow-sm text-emerald-600" /> : <Square size={24} />}
                                                    </div>

                                                    <div className="mt-2 mb-5 flex justify-between items-start">
                                                        <span
                                                            className="px-3 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wide shadow-sm bg-emerald-100 text-emerald-700"
                                                        >
                                                            {q.type_name}
                                                        </span>
                                                    </div>

                                                    <div className={`text-5xl font-black mb-4 tracking-tighter text-slate-900 ${GeistMono.className}`}>
                                                        {q.queue_number}
                                                    </div>

                                                    <div className="flex items-center gap-2 text-slate-500 text-xs truncate font-bold mb-5 bg-white/60 p-2.5 rounded-xl border border-emerald-100 shadow-sm">
                                                        <User size={14} className="text-slate-400" /> {q.role_name}
                                                    </div>

                                                    <div className="pt-4 border-t border-emerald-100 text-[11px] text-slate-500 flex items-center justify-between font-bold">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock size={12} />
                                                            {new Date(q.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {/* Called Badge */}
                                                            <span
                                                                className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 text-white text-[9px] font-bold rounded-full shadow-sm animate-pulse cursor-pointer hover:bg-red-500 transition-colors"
                                                                title="คลิกเพื่อยกเลิกการเรียก (Undo)"
                                                                onClick={(e) => handleCancelCall(e, q.id)}
                                                            >
                                                                กดเพื่อยกเลิกเรียกคิว <X size={10} />
                                                            </span>

                                                            {/* Remark Icon */}
                                                            {q.remark_count > 0 && (
                                                                <div
                                                                    onClick={(e) => openManageRemarks(e, q)}
                                                                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-600 rounded-full hover:bg-amber-200 transition-colors cursor-pointer shadow-sm"
                                                                >
                                                                    <AlertTriangle size={10} />
                                                                    <span className={`text-[9px] font-bold ${GeistMono.className}`}>{q.remark_count}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>


                {/* RIGHT: Sidebar (Responsive) */}
                {/* Overlay for mobile */}
                {(focusedQueue || selectedIds.length > 0) && (
                    <div
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 lg:hidden"
                        onClick={() => {
                            setFocusedQueue(null);
                            setSelectedIds([]);
                        }}
                    />
                )}

                <aside
                    className={`
              fixed lg:static inset-y-0 right-0 w-full md:w-[400px] flex flex-col z-[60] lg:z-30 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) pt-32 pb-8
              ${(focusedQueue || selectedIds.length > 0) ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}
                >
                    <div className="flex-1 flex flex-col clay-card overflow-hidden h-full">

                        {/* Sidebar Header */}
                        <div className="p-8 border-b border-slate-100 bg-white/50 backdrop-blur-sm relative">

                            {/* Mobile Close Button */}
                            <button
                                onClick={() => {
                                    setFocusedQueue(null);
                                    setSelectedIds([]);
                                }}
                                className="absolute top-6 right-6 p-2.5 bg-white rounded-full shadow-sm border border-slate-200 text-slate-400 hover:text-slate-600 lg:hidden active:scale-95 transition-all"
                            >
                                <ArrowRight size={20} />
                            </button>

                            {selectedIds.length > 1 ? (
                                // Bulk Mode Header
                                <div className="animate-in fade-in slide-in-from-right duration-500">
                                    <div className="flex items-center gap-5 mb-4">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                                            <CheckSquare size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900">เลือก {selectedIds.length} รายการ</h2>
                                            <button
                                                onClick={() => {
                                                    setSelectedIds([]);
                                                    setFocusedQueue(null);
                                                }}
                                                className="text-sm font-bold text-pink-500 hover:text-pink-600 hover:underline transition-all"
                                            >
                                                ยกเลิกการเลือก (Clear Selection)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Selected Queues List (In Header) */}
                                    <div className="mt-4 pt-4 border-t border-slate-100/50">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                            รายการที่เลือก:
                                        </div>
                                        <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar pr-2">
                                            {queues
                                                .filter(q => selectedIds.includes(q.id))
                                                .map(q => (
                                                    <div
                                                        key={q.id}
                                                        className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold shadow-sm"
                                                    >
                                                        {q.queue_number}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                </div>
                            ) : focusedQueue ? (
                                // Single Mode Header
                                <div className="animate-in fade-in slide-in-from-right duration-500">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <span
                                                className="inline-block px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider mb-2 shadow-sm"
                                                style={{
                                                    backgroundColor: `${focusedQueue.badge_color || '#6366f1'}15`,
                                                    color: focusedQueue.badge_color || '#6366f1'
                                                }}
                                            >
                                                {focusedQueue.type_name}
                                            </span>
                                            <h2 className={`text-6xl font-black text-slate-900 tracking-tighter leading-none ${GeistMono.className}`}>
                                                {focusedQueue.queue_number}
                                            </h2>
                                        </div>
                                        <div className="text-right pr-12 lg:pr-0">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">สถานะ</div>
                                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full border shadow-sm
                        ${focusedQueue.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'}
                      `}>
                                                {focusedQueue.status === 'PROCESSING' ? 'กำลังเรียก' : focusedQueue.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-3 shadow-inner">
                                        <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                                                <User size={14} />
                                            </div>
                                            {focusedQueue.role_name}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                                                <Calendar size={14} />
                                            </div>
                                            {new Date(focusedQueue.created_at).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Empty State Header
                                <div className="text-center py-16 text-slate-400">
                                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#e72289] to-[#c01b70] rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20 text-white transform rotate-3 hover:rotate-6 transition-transform duration-300">
                                            <MapPin size={24} className="stroke-[2.5]" />
                                        </div>
                                    </div>
                                    <p className="font-bold text-lg text-slate-600">เลือกคิวเพื่อดูรายละเอียด</p>
                                    <p className="text-sm font-medium opacity-60 mt-1">คลิกที่การ์ดคิวทางด้านซ้าย</p>
                                </div>
                            )}
                        </div>

                        {/* Sidebar Content (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white/30 custom-scrollbar">

                            {/* Actions Section */}
                            {(focusedQueue || selectedIds.length > 0) && (
                                <div className="animate-in slide-in-from-bottom duration-500 delay-100">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Send size={12} /> Actions
                                    </h3>

                                    <div className="grid grid-cols-4 gap-3">
                                        {/* 1. Call/Cancel Queue */}
                                        <div className="col-span-1">
                                            {(focusedQueue || selectedIds.length >= 1) && (
                                                (() => {
                                                    const isFocusedProcessing = focusedQueue?.status === 'PROCESSING';
                                                    const selectedQueues = queues.filter(q => selectedIds.includes(q.id));
                                                    const hasProcessing = selectedQueues.some(q => q.status === 'PROCESSING');
                                                    const isProcessing = isFocusedProcessing || hasProcessing;

                                                    if (isProcessing) {
                                                        return (
                                                            <button
                                                                onClick={(e) => {
                                                                    if (selectedIds.length > 0) handleCancelCallBulk();
                                                                    else if (focusedQueue) handleCancelCall(e, focusedQueue.id);
                                                                }}
                                                                className="w-full flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-200 transition-all h-full min-h-[90px] group"
                                                            >
                                                                <XCircle size={24} className="group-hover:scale-110 transition-transform" />
                                                                <span className="text-[10px] font-bold leading-tight text-center">ยกเลิก<br />เรียก</span>
                                                            </button>
                                                        );
                                                    } else {
                                                        return (
                                                            <button
                                                                onClick={handleCallQueue}
                                                                className="w-full flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-95 transition-all h-full min-h-[90px]"
                                                            >
                                                                <Megaphone size={24} className="animate-pulse" />
                                                                <span className="text-[10px] font-bold leading-tight text-center">เรียกคิว</span>
                                                            </button>
                                                        );
                                                    }
                                                })()
                                            )}
                                        </div>

                                        {/* 2. Add Remark */}
                                        {(focusedQueue || selectedIds.length >= 1) && (
                                            <button
                                                onClick={openRemarkModal}
                                                className="col-span-1 flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 hover:shadow-md transition-all h-full min-h-[90px] group"
                                            >
                                                <MessageSquarePlus size={24} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-bold leading-tight text-center">หมายเหตุ<br />{selectedIds.length > 1 ? `(${selectedIds.length})` : ''}</span>
                                            </button>
                                        )}

                                        {/* 3. Complete */}
                                        <button
                                            onClick={handleComplete}
                                            className="col-span-1 flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-md transition-all h-full min-h-[90px] group"
                                        >
                                            <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold leading-tight text-center">จบงาน</span>
                                        </button>

                                        {/* 4. Cancel */}
                                        <button
                                            onClick={handleCancel}
                                            className="col-span-1 flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md transition-all h-full min-h-[90px] group"
                                        >
                                            <LogOut size={24} className="group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold leading-tight text-center">ไม่มา<br />แสดงตัว</span>
                                        </button>
                                    </div>

                                    {/* 4. Transfer List (Compact) */}
                                    <div className="pt-4">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                            {selectedIds.length > 1 ? `ส่งต่อ ${selectedIds.length} รายการไปยัง:` : 'ส่งต่อไปยัง (Transfer to):'}
                                        </div>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {departments
                                                .filter(d => d.id !== Number(localStorage.getItem('station_dept_id')))
                                                .map((dept) => (
                                                    <button
                                                        key={dept.id}
                                                        onClick={() => handleTransfer(dept.id)}
                                                        className="w-full text-left px-5 py-3.5 rounded-2xl border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-all flex justify-between items-center group bg-white shadow-sm hover:shadow-md active:scale-[0.98]"
                                                    >
                                                        <span className="font-bold text-sm text-slate-700 group-hover:text-indigo-800">{dept.name}</span>
                                                        <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-700 transform group-hover:translate-x-1 transition-all" />
                                                    </button>
                                                ))}
                                        </div>
                                    </div>


                                </div>
                            )}

                            {/* Timeline Section - Collapsible */}
                            {focusedQueue && selectedIds.length === 1 && (
                                <div className="pt-8 border-t border-slate-100 animate-in slide-in-from-right duration-500 delay-200">
                                    <button
                                        onClick={() => setIsTimelineOpen(!isTimelineOpen)}
                                        className="w-full flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 hover:text-slate-600 transition-colors"
                                    >
                                        <span className="flex items-center gap-2"><History size={12} /> Timeline & Logs</span>
                                        {isTimelineOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>

                                    {isTimelineOpen && (
                                        <div className="space-y-6 relative pl-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100"></div>

                                            {loadingLogs ? (
                                                <div className="text-center py-8 text-slate-400 text-sm font-medium">กำลังโหลด...</div>
                                            ) : queueLogs.length === 0 ? (
                                                <div className="text-center py-8 text-slate-400 text-sm font-medium">ไม่มีประวัติการดำเนินการ</div>
                                            ) : (
                                                queueLogs.map((log, i) => (
                                                    <div key={i} className="relative flex gap-4 group">
                                                        <div className={`
                          w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shrink-0 z-10 shadow-sm
                          ${log.action_type === 'CALL' ? 'bg-blue-100 text-blue-600' :
                                                                log.action_type === 'COMPLETE' ? 'bg-green-100 text-green-600' :
                                                                    (log.action_type === 'CANCEL' || log.action_type === 'SYSTEM_CANCEL') ? 'bg-red-100 text-red-600' :
                                                                        log.action_type === 'REMARK' ? 'bg-purple-100 text-purple-600' :
                                                                            'bg-slate-100 text-slate-500'}
                        `}>
                                                            {log.action_type === 'CALL' && <Megaphone size={14} />}
                                                            {log.action_type === 'COMPLETE' && <CheckCircle2 size={14} />}
                                                            {(log.action_type === 'CANCEL' || log.action_type === 'SYSTEM_CANCEL') && <XCircle size={14} />}
                                                            {log.action_type === 'REMARK' && <MessageSquarePlus size={14} />}
                                                            {log.action_type === 'TRANSFER' && <ArrowRight size={14} />}
                                                            {log.action_type === 'CREATE' && <Plus size={14} />}
                                                        </div>
                                                        <div className="flex-1 pt-1">
                                                            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-xs font-bold text-slate-800">{log.action_type}</span>
                                                                    <span className="text-[10px] font-medium text-slate-400">
                                                                        {new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-slate-600 font-medium leading-relaxed">{log.action_details}</p>
                                                                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                                    <User size={10} /> {log.staff_name || 'System'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            {/* ================= MODALS ================= */}
            <>
                {/* 1. Add Remark Modal */}
                {isRemarkModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="clay-card w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                                        <MessageSquarePlus size={24} />
                                    </div>
                                    เพิ่มหมายเหตุ {selectedIds.length > 1 ? `(${selectedIds.length} รายการ)` : ''}
                                </h3>
                                <button onClick={() => setIsRemarkModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <textarea
                                className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium text-slate-700 h-32 resize-none mb-6"
                                placeholder={selectedIds.length > 1 ? `ระบุรายละเอียดเพิ่มเติม (สำหรับ ${selectedIds.length} รายการ)...` : "ระบุรายละเอียดเพิ่มเติม..."}
                                value={remarkText}
                                onChange={(e) => setRemarkText(e.target.value)}
                                autoFocus
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsRemarkModalOpen(false)}
                                    className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={submitRemark}
                                    className="flex-1 py-3.5 rounded-2xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all active:scale-[0.98]"
                                >
                                    บันทึก
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Manage Remarks Modal (View/Delete) */}
                {isManageRemarksOpen && selectedQueueForRemarks && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="clay-card w-full max-w-md p-8 animate-in zoom-in-95 duration-300 max-h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center mb-6 flex-none">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                        <AlertTriangle size={24} />
                                    </div>
                                    หมายเหตุทั้งหมด
                                </h3>
                                <button onClick={() => setIsManageRemarksOpen(false)} className="p-2 hover:bg-black/5 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                {currentRemarks.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 font-medium">
                                        ไม่มีหมายเหตุ
                                    </div>
                                ) : (
                                    currentRemarks.map((log) => (
                                        <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start gap-3 group">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800 mb-1">{log.action_details}</p>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                    <User size={10} /> {log.staff_name}
                                                    <span>•</span>
                                                    {new Date(log.created_at).toLocaleString('th-TH')}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteRemark(log.id)}
                                                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                                title="ลบหมายเหตุ"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="pt-6 mt-4 border-t border-slate-100 flex-none">
                                <button
                                    onClick={() => setIsManageRemarksOpen(false)}
                                    className="w-full py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
                                >
                                    ปิดหน้าต่าง
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>

            {/* Profile Modal */}
            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                userId={userId}
                currentName={personnelName}
            />
        </div >
    );
}

export default function WorkstationPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen text-slate-500">Loading...</div>}>
            <WorkstationContent />
        </Suspense>
    );
}
