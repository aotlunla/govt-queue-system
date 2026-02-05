'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, ChevronRight, User } from 'lucide-react';
import { api } from '@/lib/api';
import { GeistMono } from 'geist/font/mono';

interface QueueResult {
    id: number;
    queue_number: string;
    status: string;
    current_department_id: number;
    department_name: string;
}

export function QueueSearch() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<QueueResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (!term.trim()) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/queues/search?q=${term.trim()}`);
            setResults(res.data);
            setShowDropdown(true);
        } catch (err: any) {
            console.error(err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectQueue = (queue: QueueResult) => {
        // 1. Update LocalStorage to switch workstation
        localStorage.setItem('station_dept_id', queue.current_department_id.toString());
        localStorage.setItem('station_dept_name', queue.department_name || '');
        // Clear counter selection as we are just switching dept
        localStorage.removeItem('station_counter_id');
        localStorage.removeItem('station_counter_name');

        // 2. Redirect
        router.push(`/dashboard/workstation?deptId=${queue.current_department_id}&highlight_queue_id=${queue.id}`);
        setShowDropdown(false);
        setSearchTerm('');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'WAITING': return 'text-amber-500 bg-amber-50';
            case 'PROCESSING': return 'text-emerald-500 bg-emerald-50';
            case 'COMPLETED': return 'text-blue-500 bg-blue-50';
            case 'CANCELLED': return 'text-rose-500 bg-rose-50';
            default: return 'text-slate-500 bg-slate-50';
        }
    };

    return (
        <div className="relative w-full max-w-md" ref={dropdownRef}>
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </div>
                <input
                    type="text"
                    placeholder="ค้นหาหมายเลขคิว..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchTerm && setShowDropdown(true)}
                    className={`w-full h-12 pl-12 pr-4 rounded-xl bg-slate-100/50 border border-slate-200 focus:bg-white focus:border-[#e72289] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-400 ${GeistMono.className}`}
                />
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {results.length > 0 ? (
                        <div className="max-h-[300px] overflow-y-auto py-2">
                            {results.map((queue) => (
                                <button
                                    key={queue.id}
                                    onClick={() => handleSelectQueue(queue)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm ${getStatusColor(queue.status)}`}>
                                            {queue.queue_number}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                                {queue.department_name || 'Unknown Dept'}
                                            </div>
                                            <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${getStatusColor(queue.status)}`}>
                                                {queue.status}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-[#e72289] transition-colors" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm font-medium">
                            ไม่พบข้อมูลคิวที่ค้นหา
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
