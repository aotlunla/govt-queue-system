'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
    Ticket, Plus, Trash2, Edit2, X,
    Palette, Smartphone, Check, RefreshCw
} from 'lucide-react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Portal from '@/components/Portal';

interface QueueType {
    id: number;
    name: string;
    code: string;
    badge_color: string;
    sort_order: number;
    default_department_id?: number;
}

interface Department {
    id: number;
    name: string;
}

// Premium Color Palette
const COLORS = [
    '#e72289', // Pink (Brand)
    '#6366f1', // Indigo
    '#3b82f6', // Blue
    '#0ea5e9', // Sky
    '#10b981', // Emerald
    '#84cc16', // Lime
    '#f59e0b', // Amber
    '#f97316', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#64748b', // Slate
    '#1e293b', // Slate Dark
];

export default function QueueTypesPage() {
    const [types, setTypes] = useState<QueueType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);

    // Form Data
    const [formData, setFormData] = useState<{
        name: string;
        code: string;
        badge_color: string;
        default_department_id: string;
        sort_order?: number; // Added to preserve sort order
    }>({ name: '', code: '', badge_color: '#e72289', default_department_id: '' });

    // 1. Fetch Data
    const fetchTypes = async () => {
        try {
            setLoading(true);
            const [typesRes, deptsRes] = await Promise.all([
                api.get('/admin/queue-types'),
                api.get('/admin/departments')
            ]);
            setTypes(typesRes.data);
            setDepartments(deptsRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTypes(); }, []);

    // 2. Handlers
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/admin/queue-types/${editingId}`, {
                    ...formData,
                    default_department_id: formData.default_department_id ? Number(formData.default_department_id) : null
                });
            } else {
                await api.post('/admin/queue-types', {
                    ...formData,
                    default_department_id: formData.default_department_id ? Number(formData.default_department_id) : null
                });
            }
            // Reset form
            setFormData({ name: '', code: '', badge_color: '#e72289', default_department_id: '' });
            setEditingId(null);
            setShowModal(false);
            fetchTypes();
        } catch (err) { alert('บันทึกไม่สำเร็จ'); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('ยืนยันการลบประเภทคิวนี้?')) return;
        try {
            await api.delete(`/admin/queue-types/${id}`);
            fetchTypes();
        } catch (err) { alert('ลบไม่สำเร็จ'); }
    };

    const openEdit = (t: QueueType) => {
        setFormData({
            name: t.name,
            code: t.code,
            badge_color: t.badge_color,
            default_department_id: t.default_department_id ? String(t.default_department_id) : '',
            sort_order: t.sort_order // Preserve sort order
        });
        setEditingId(t.id);
        setShowModal(true);
    };

    const handleSortOrderChange = async (type: QueueType, newOrder: string) => {
        const order = parseInt(newOrder);
        if (isNaN(order) || order === type.sort_order) return;

        try {
            await api.put(`/admin/queue-types/${type.id}`, { ...type, sort_order: order });
            fetchTypes(); // Refetch to show swapped items
        } catch (err) {
            console.error('Update sort order failed', err);
            alert('Failed to update order');
        }
    };

    return (
        <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${GeistSans.className}`}>

            {/* Header */}
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                        <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800">จัดการประเภทคิว</h1>
                        <p className="text-sm text-slate-500">กำหนดประเภทคิวและสีปุ่มกดบัตรคิว</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setFormData({ name: '', code: '', badge_color: '#e72289', default_department_id: '' });
                        setEditingId(null);
                        setShowModal(true);
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 font-medium"
                >
                    <Plus size={18} /> เพิ่มประเภทคิว
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-64 bg-white/50 rounded-[2rem] border border-white/60 shadow-sm animate-pulse flex flex-col items-center justify-center">
                            <RefreshCw className="animate-spin text-slate-300" size={32} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {types.map((t, idx) => (
                        <div
                            key={t.id}
                            className="group relative bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            {/* Manual Sort Order Input */}
                            <div className="absolute top-4 right-4 z-10 group/input">
                                <div className="absolute -top-2 -right-2 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover/input:opacity-100 transition-opacity z-20 pointer-events-none">
                                    ORDER
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    defaultValue={t.sort_order}
                                    onBlur={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (val < 1) {
                                            e.target.value = t.sort_order.toString();
                                            return;
                                        }
                                        handleSortOrderChange(t, e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    className={`w-10 h-10 text-center font-black text-lg rounded-xl border-2 border-white/50 bg-white/80 text-slate-700 shadow-sm focus:border-[#e72289] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all ${GeistMono.className}`}
                                />
                            </div>

                            {/* Color Strip */}
                            <div className="h-2 w-full" style={{ backgroundColor: t.badge_color }}></div>

                            <div className="p-6">
                                {/* Preview Card */}
                                <div className="mb-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100/50 flex justify-center items-center h-40 relative overflow-hidden group-hover:bg-white transition-colors">
                                    <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>

                                    <div
                                        className="relative w-full max-w-[180px] py-5 rounded-2xl shadow-lg text-center transform group-hover:scale-105 transition-transform duration-300 flex flex-col items-center justify-center gap-2"
                                        style={{ backgroundColor: t.badge_color }}
                                    >
                                        <div className="text-white font-bold text-lg drop-shadow-md px-2 leading-tight">{t.name}</div>
                                        <div className={`text-white/90 text-[10px] font-bold bg-black/20 px-2 py-0.5 rounded-md backdrop-blur-sm ${GeistMono.className}`}>
                                            PREFIX: {t.code}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{t.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200 ${GeistMono.className}`}>
                                                {t.code}
                                            </span>
                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: t.badge_color }}></div>
                                        </div>
                                    </div>

                                    <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity md:translate-y-2 md:group-hover:translate-y-0">
                                        <button onClick={() => openEdit(t)} className="p-2 text-slate-400 hover:text-[#e72289] hover:bg-pink-50 rounded-xl transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- Modal Form --- */}
            {showModal && (
                <Portal>
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white/90 backdrop-blur-2xl w-full max-w-lg rounded-[2rem] shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 duration-300 border border-white/50 max-h-[95vh] overflow-y-auto">

                            <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-black/5 flex justify-between items-center bg-white/50">
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <div className="p-2.5 bg-pink-100 text-[#e72289] rounded-xl">
                                        {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
                                    </div>
                                    {editingId ? 'แก้ไขประเภทคิว' : 'เพิ่มประเภทคิวใหม่'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 sm:space-y-8">

                                {/* Preview Box */}
                                <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 border border-slate-200/50 border-dashed rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-4 left-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Smartphone size={12} /> Live Preview
                                    </div>

                                    <div
                                        className="w-full max-w-[240px] py-6 rounded-2xl shadow-xl text-center transition-all duration-300 transform hover:scale-105 cursor-default flex flex-col items-center gap-2"
                                        style={{ backgroundColor: formData.badge_color }}
                                    >
                                        <div className="text-white font-bold text-2xl drop-shadow-sm px-4 leading-tight">{formData.name || 'ชื่อปุ่ม'}</div>
                                        <div className={`inline-block text-white/90 text-sm font-bold bg-black/20 px-3 py-1 rounded-lg backdrop-blur-sm ${GeistMono.className}`}>
                                            PREFIX: {formData.code || '?'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">ชื่อประเภทคิว</label>
                                        <input required type="text" className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/10 focus:border-[#e72289] outline-none transition-all font-medium"
                                            placeholder="เช่น ติดต่องานทะเบียน"
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} autoFocus />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">รหัสย่อ</label>
                                        <input required type="text" maxLength={2} className={`w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/10 focus:border-[#e72289] outline-none uppercase text-center font-black text-lg tracking-wider ${GeistMono.className}`}
                                            placeholder="A"
                                            value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">แผนกเริ่มต้น (Default Department)</label>
                                    <select
                                        value={formData.default_department_id}
                                        onChange={(e) => setFormData({ ...formData, default_department_id: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-slate-200 focus:border-[#e72289] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-medium text-slate-700 appearance-none"
                                    >
                                        <option value="">-- เลือกแผนก (Optional) --</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400 ml-1">
                                        * ถ้าไม่เลือก จะใช้แผนกแรกสุดตามลำดับ
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                                        <Palette size={14} /> เลือกสีปุ่ม (Theme Color)
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, badge_color: color })}
                                                className={`w-10 h-10 rounded-full shadow-sm transition-all flex items-center justify-center ${formData.badge_color === color ? 'ring-2 ring-offset-2 ring-[#e72289] scale-110' : 'hover:scale-110'}`}
                                                style={{ backgroundColor: color }}
                                            >
                                                {formData.badge_color === color && <Check size={16} className="text-white drop-shadow-md" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-[#e72289] hover:bg-[#c01b70] text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-pink-500/30 transition-all active:scale-95">
                                    {editingId ? 'บันทึกการแก้ไข' : 'สร้างประเภทคิว'}
                                </button>

                            </form>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
}
