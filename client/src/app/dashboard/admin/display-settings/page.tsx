'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
    Plus, Monitor, Trash2, Check, ExternalLink, Edit2, X, LayoutGrid
} from 'lucide-react';
import Portal from '@/components/Portal';
import { GeistSans } from 'geist/font/sans';

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
    slug?: string;
    config: {
        // Legacy fields (optional for backward compat)
        departments?: number[];
        statuses?: string[];
        show_calling?: boolean;
        show_waiting?: boolean;

        // New fields
        marquee_text?: string;
        sections?: DisplaySection[];
        items_per_page?: number;
        page_interval?: number;
        max_columns?: number;

        show_queue_number?: boolean;
        show_service_channel?: boolean;
        show_waiting_count?: boolean;
    };
    is_active: boolean;
    created_at: string;
}

interface Department {
    id: number;
    name: string;
}

export default function DisplaySettingsPage() {
    const [displays, setDisplays] = useState<DisplayConfig[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<DisplayConfig | null>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        marquee_text: '',
        sections: [] as DisplaySection[],
        is_active: true,
        items_per_page: 12,
        page_interval: 8,
        max_columns: 4
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [configsRes, deptsRes] = await Promise.all([
                api.get('/admin/display-configs'),
                api.get('/admin/departments')
            ]);

            // Parse config JSON if it comes as string
            const parsedConfigs = configsRes.data.map((c: any) => ({
                ...c,
                config: typeof c.config === 'string' ? JSON.parse(c.config) : c.config,
                is_active: Boolean(c.is_active)
            }));

            setDisplays(parsedConfigs);
            setDepartments(deptsRes.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (config?: DisplayConfig) => {
        if (config) {
            setEditingConfig(config);
            // Migrate legacy config to sections if needed
            let initialSections = config.config.sections || [];

            // Migration logic: If no sections but legacy data exists, create default layout
            if (initialSections.length === 0) {
                const legacyDepts = config.config.departments || [];

                const showCalling = config.config.show_calling !== false;
                const showWaiting = config.config.show_waiting !== false;

                if (showCalling) {
                    initialSections.push({
                        id: crypto.randomUUID(),
                        title: 'กำลังเรียก (Calling)',
                        department_ids: legacyDepts,
                        statuses: ['PROCESSING'],
                        col_span: showWaiting ? 7 : 12,
                        type: 'recent-list'
                    });
                }
                if (showWaiting) {
                    initialSections.push({
                        id: crypto.randomUUID(),
                        title: 'รอเรียก (Waiting)',
                        department_ids: legacyDepts,
                        statuses: ['WAITING'],
                        col_span: showCalling ? 5 : 12,
                        type: 'grid-list'
                    });
                }
            }

            setFormData({
                name: config.name,
                slug: config.slug || '',
                marquee_text: config.config.marquee_text || 'ยินดีต้อนรับสู่สำนักงานเทศบาลนครนนทบุรี • กรุณารอเรียกคิวตามลำดับ • หากท่านไม่อยู่เมื่อถึงคิวของท่าน กรุณาติดต่อเจ้าหน้าที่ • ขอบคุณที่ใช้บริการ',
                sections: initialSections,
                is_active: config.is_active,
                items_per_page: config.config.items_per_page || 12,
                page_interval: config.config.page_interval || 8,
                max_columns: config.config.max_columns || 4
            });
        } else {
            setEditingConfig(null);
            // Default New Layout
            setFormData({
                name: '',
                slug: '',
                marquee_text: 'ยินดีต้อนรับสู่สำนักงานเทศบาลนครนนทบุรี • กรุณารอเรียกคิวตามลำดับ • หากท่านไม่อยู่เมื่อถึงคิวของท่าน กรุณาติดต่อเจ้าหน้าที่ • ขอบคุณที่ใช้บริการ',
                sections: [
                    {
                        id: crypto.randomUUID(),
                        title: 'กำลังเรียก (Calling)',
                        department_ids: [], // All
                        statuses: ['PROCESSING'],
                        col_span: 7,
                        type: 'recent-list'
                    },
                    {
                        id: crypto.randomUUID(),
                        title: 'รอเรียก (Waiting)',
                        department_ids: [],
                        statuses: ['WAITING'],
                        col_span: 5,
                        type: 'grid-list'
                    }
                ],
                is_active: true,
                items_per_page: 12,
                page_interval: 8,
                max_columns: 4
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                slug: formData.slug || null,
                config: {
                    marquee_text: formData.marquee_text,
                    sections: formData.sections,
                    items_per_page: formData.items_per_page,
                    page_interval: formData.page_interval,
                    max_columns: formData.max_columns
                },
                is_active: formData.is_active
            };

            if (editingConfig) {
                await api.put(`/admin/display-configs/${editingConfig.id}`, payload);
            } else {
                await api.post('/admin/display-configs', payload);
            }

            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            console.error('Failed to save:', err);
            const msg = err.response?.data?.error || err.message || 'บันทึกไม่สำเร็จ';
            const details = err.response?.data?.details || '';
            alert(`${msg}\n${details}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('ยืนยันการลบ?')) return;
        try {
            await api.delete(`/admin/display-configs/${id}`);
            fetchData();
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };



    return (
        <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${GeistSans.className}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                        <Monitor className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800">ตั้งค่าจอแสดงผล</h1>
                        <p className="text-sm text-slate-500">จัดการหน้าจอแสดงผลคิวสำหรับจุดต่างๆ</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 font-medium"
                >
                    <Plus size={18} />
                    เพิ่มจอแสดงผล
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="h-48 bg-white/50 rounded-[2rem] border border-slate-100 animate-pulse" />
                    ))
                ) : displays.length === 0 ? (
                    <div className="col-span-full py-24 text-center bg-white/50 rounded-[2rem] border border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Monitor size={40} className="text-slate-300" />
                        </div>
                        <p className="text-lg font-bold text-slate-600">ไม่พบการตั้งค่าจอแสดงผล</p>
                        <p className="text-slate-400 text-sm font-medium">เริ่มต้นด้วยการเพิ่มจอแสดงผลใหม่</p>
                    </div>
                ) : (
                    displays.map((config, idx) => (
                        <div
                            key={config.id}
                            className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-white/60 hover:shadow-xl hover:border-pink-200 hover:-translate-y-1 transition-all duration-300 group"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-14 h-14 bg-pink-50 text-[#e72289] rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-[#e72289] group-hover:text-white transition-all duration-300">
                                    <Monitor size={28} />
                                </div>
                                <div className={`px-3 py-1 rounded-xl text-xs font-bold border ${config.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                    {config.is_active ? 'Active' : 'Inactive'}
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight line-clamp-1">{config.name}</h3>

                            <div className="space-y-3 mb-8">
                                <div className="text-sm text-slate-500 flex items-center gap-2 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                    แผนก: <span className="text-slate-700 font-bold">{(config.config.departments?.length || 0) > 0
                                        ? `${config.config.departments?.length} แผนก`
                                        : 'ทั้งหมด (All)'}</span>
                                </div>
                                <div className="text-sm text-slate-500 flex items-center gap-2 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                    สถานะ: <span className="text-slate-700 font-bold">{config.config.statuses?.join(', ') || 'All'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                <a
                                    href={`/display/${config.slug || config.id}`}
                                    target="_blank"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-[#e72289] hover:text-white transition-all border border-slate-200 hover:border-[#e72289]"
                                >
                                    <ExternalLink size={16} />
                                    เปิดหน้าจอ
                                </a>
                                <button
                                    onClick={() => handleOpenModal(config)}
                                    className="p-2.5 text-slate-400 hover:text-[#e72289] hover:bg-pink-50 rounded-xl transition-colors border border-transparent hover:border-pink-100"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(config.id)}
                                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
                        <div
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <div className="relative w-full h-full md:w-[90vw] md:h-[90vh] max-w-7xl bg-[#f8fafc] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                            {/* Modal Header - Fixed */}
                            <div className="flex-none px-6 py-5 md:px-8 border-b border-slate-200 bg-white flex justify-between items-center z-10">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                        {editingConfig ? 'แก้ไขจอแสดงผล' : 'เพิ่มจอแสดงผลใหม่'}
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium">กำหนดค่าการแสดงผลและ Layout ของหน้าจอ</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={28} />
                                </button>
                            </div>

                            {/* Modal Body - Scrollable */}
                            <form id="settings-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">

                                {/* Status & Name Header */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">ชื่อจุดเรียก (Display Name)</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#e72289]/20 focus:border-[#e72289] font-bold text-slate-700 transition-all"
                                                placeholder="Ex. จุดรับบริการช่อง 1-3"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <label className="flex items-center gap-3 cursor-pointer w-full p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.is_active ? 'bg-[#e72289] border-[#e72289]' : 'border-slate-300 bg-white'}`}>
                                                    {formData.is_active && <Check size={16} className="text-white" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_active}
                                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                                    className="hidden"
                                                />
                                                <span className="text-sm font-bold text-slate-700">
                                                    เปิดใช้งาน (Active)
                                                </span>
                                            </label>
                                        </div>
                                    </div>



                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Short URL / ID (Slug)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3.5 text-slate-400 font-medium text-sm">/display/</span>
                                            <input
                                                type="text"
                                                value={formData.slug || ''}
                                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                                className="w-full pl-20 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#e72289]/20 focus:border-[#e72289] font-bold text-slate-700 transition-all"
                                                placeholder="my-screen"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1 ml-1">เว้นว่างเพื่อใช้ ID ปกติ /5 (ใช้ภาษาอังกฤษ ตัวเลข และขีด - เท่านั้น)</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">ข้อความวิ่ง (Marquee Text)</label>
                                        <input
                                            type="text"
                                            value={formData.marquee_text}
                                            onChange={e => setFormData({ ...formData, marquee_text: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#e72289]/20 focus:border-[#e72289] transition-all"
                                            placeholder="ใส่ข้อความที่ต้องการแสดงด้านล่างจอ..."
                                        />
                                    </div>
                                </div>

                                {/* Section Builder */}
                                {/* Pagination Settings */}
                                <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-sm">
                                    <h4 className="text-lg font-black text-slate-800 mb-4">ตั้งค่า Pagination & Grid</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-600 mb-2">จำนวนคิวต่อหน้า</label>
                                            <input
                                                type="number"
                                                value={formData.items_per_page}
                                                onChange={(e) => setFormData({ ...formData, items_per_page: parseInt(e.target.value) || 12 })}
                                                min={4}
                                                max={24}
                                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-[#e72289] focus:outline-none transition-all text-lg font-semibold"
                                            />
                                            <p className="text-xs text-slate-400 mt-1">แนะนำ: 8-16 คิว</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-600 mb-2">เวลาแสดงต่อหน้า (วินาที)</label>
                                            <input
                                                type="number"
                                                value={formData.page_interval}
                                                onChange={(e) => setFormData({ ...formData, page_interval: parseInt(e.target.value) || 8 })}
                                                min={3}
                                                max={30}
                                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-[#e72289] focus:outline-none transition-all text-lg font-semibold"
                                            />
                                            <p className="text-xs text-slate-400 mt-1">แนะนำ: 5-10 วินาที</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-600 mb-2">จำนวน Column ต่อแถว (สูงสุด)</label>
                                            <input
                                                type="number"
                                                value={formData.max_columns}
                                                onChange={(e) => setFormData({ ...formData, max_columns: parseInt(e.target.value) || 4 })}
                                                min={2}
                                                max={8}
                                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-[#e72289] focus:outline-none transition-all text-lg font-semibold"
                                            />
                                            <p className="text-xs text-slate-400 mt-1">แนะนำ: 3-5 คอลัมน์</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <div>
                                            <h4 className="text-lg font-black text-slate-800">การจัดวาง (Layout Sections)</h4>
                                            <p className="text-sm text-slate-500">เพิ่มและกำหนดค่าส่วนต่างๆ บนหน้าจอ</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newSection: DisplaySection = {
                                                    id: crypto.randomUUID(),
                                                    title: 'Section ใหม่',
                                                    department_ids: [],
                                                    statuses: [],
                                                    col_span: 6,
                                                    type: 'recent-list'
                                                };
                                                setFormData(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
                                            }}
                                            className="bg-white border-2 border-[#e72289]/10 hover:border-[#e72289] text-[#e72289] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
                                        >
                                            <Plus size={18} /> เพิ่มส่วนแสดงผล
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        {formData.sections.map((section, index) => (
                                            <div key={section.id} className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm relative group hover:border-[#e72289]/30 transition-all hover:shadow-xl hover:shadow-pink-500/5">
                                                <div className="absolute top-4 right-4 z-10">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newSections = formData.sections.filter(s => s.id !== section.id);
                                                            setFormData({ ...formData, sections: newSections });
                                                        }}
                                                        className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>

                                                <div className="space-y-6">
                                                    {/* Title & Type Row */}
                                                    <div className="grid grid-cols-2 gap-4 mr-8">
                                                        <div className="col-span-2 md:col-span-1">
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ชื่อส่วน (Title)</label>
                                                            <input
                                                                type="text"
                                                                value={section.title}
                                                                onChange={e => {
                                                                    const newSections = [...formData.sections];
                                                                    newSections[index].title = e.target.value;
                                                                    setFormData({ ...formData, sections: newSections });
                                                                }}
                                                                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#e72289] font-semibold"
                                                            />
                                                        </div>
                                                        <div className="col-span-2 md:col-span-1">
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ประเภท (Type)</label>
                                                            <select
                                                                value={section.type}
                                                                onChange={e => {
                                                                    const newSections = [...formData.sections];
                                                                    newSections[index].type = e.target.value as any;
                                                                    setFormData({ ...formData, sections: newSections });
                                                                }}
                                                                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#e72289] font-medium"
                                                            >
                                                                <option value="recent-list">แนวตั้ง (Calling View)</option>
                                                                <option value="grid-list">ตาราง (Waiting Grid)</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Width Slider/Select */}
                                                    <div>
                                                        <div className="flex justify-between mb-1">
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase">ความกว้าง (Width)</label>
                                                            <span className="text-[10px] font-bold text-[#e72289]">{Math.round((section.col_span / 12) * 100)}%</span>
                                                        </div>
                                                        <div className="relative h-10 bg-slate-50 rounded-lg p-1 flex gap-1 border border-slate-200">
                                                            {[3, 4, 5, 6, 7, 8, 9, 12].map(span => (
                                                                <button
                                                                    key={span}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newSections = [...formData.sections];
                                                                        newSections[index].col_span = span;
                                                                        setFormData({ ...formData, sections: newSections });
                                                                    }}
                                                                    className={`flex-1 rounded-md text-[10px] font-bold transition-all ${section.col_span === span ? 'bg-[#e72289] text-white shadow-sm' : 'text-slate-400 hover:bg-slate-200'}`}
                                                                >
                                                                    {span === 12 ? 'FULL' : `${Math.round((span / 12) * 100)}%`}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Departments */}
                                                    <div>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase">แผนกที่แสดง (Departments)</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newSections = [...formData.sections];
                                                                    if (newSections[index].department_ids.length === departments.length) {
                                                                        newSections[index].department_ids = [];
                                                                    } else {
                                                                        newSections[index].department_ids = departments.map(d => d.id);
                                                                    }
                                                                    setFormData({ ...formData, sections: newSections });
                                                                }}
                                                                className="text-[10px] font-bold text-[#e72289] hover:underline"
                                                            >
                                                                {section.department_ids.length === departments.length ? 'Clear All' : 'Select All'}
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {departments.map(dept => (
                                                                <button
                                                                    key={dept.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newSections = [...formData.sections];
                                                                        const currentIds = newSections[index].department_ids;
                                                                        if (currentIds.includes(dept.id)) {
                                                                            newSections[index].department_ids = currentIds.filter(id => id !== dept.id);
                                                                        } else {
                                                                            newSections[index].department_ids = [...currentIds, dept.id];
                                                                        }
                                                                        setFormData({ ...formData, sections: newSections });
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${section.department_ids.includes(dept.id) ? 'bg-[#e72289] text-white border-[#e72289] shadow-sm shadow-pink-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                                                >
                                                                    {dept.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Statuses */}
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">สถานะที่แสดง (Statuses)</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {[
                                                                { value: 'WAITING', label: 'รอเรียก' },
                                                                { value: 'PROCESSING', label: 'กำลังเรียก' },
                                                                { value: 'COMPLETED', label: 'เสร็จสิ้น' },
                                                                { value: 'CANCELLED', label: 'ยกเลิก' }
                                                            ].map(status => (
                                                                <button
                                                                    key={status.value}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newSections = [...formData.sections];
                                                                        const currentStatuses = newSections[index].statuses;
                                                                        if (currentStatuses.includes(status.value)) {
                                                                            newSections[index].statuses = currentStatuses.filter(s => s !== status.value);
                                                                        } else {
                                                                            newSections[index].statuses = [...currentStatuses, status.value];
                                                                        }
                                                                        setFormData({ ...formData, sections: newSections });
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${section.statuses.includes(status.value) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                                                >
                                                                    {status.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {formData.sections.length === 0 && (
                                            <div className="col-span-full py-12 text-center border-3 border-dashed border-slate-200 rounded-3xl">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <LayoutGrid size={24} className="text-slate-300" />
                                                </div>
                                                <p className="text-slate-500 font-medium">ยังไม่มีส่วนแสดงผล</p>
                                                <p className="text-slate-400 text-sm mb-4">กดปุ่ม "เพิ่มส่วนแสดงผล" เพื่อเริ่มจัด Layout</p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newSection: DisplaySection = {
                                                            id: crypto.randomUUID(),
                                                            title: 'Section ใหม่',
                                                            department_ids: [],
                                                            statuses: [],
                                                            col_span: 6,
                                                            type: 'recent-list'
                                                        };
                                                        setFormData(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
                                                    }}
                                                    className="text-[#e72289] text-sm font-bold hover:underline"
                                                >
                                                    + เพิ่มเลยทันที
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>

                            {/* Modal Footer - Fixed */}
                            <div className="flex-none p-6 md:px-8 md:py-6 border-t border-slate-200 bg-white flex justify-end gap-3 z-10">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    form="settings-form"
                                    className="px-8 py-3 rounded-xl bg-[#e72289] text-white font-bold hover:bg-[#c01b70] shadow-lg shadow-pink-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center gap-2"
                                >
                                    <Check size={20} />
                                    บันทึกการตั้งค่า
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal >
            )
            }
        </div >
    );
}
