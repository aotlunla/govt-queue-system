'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, Plus, Trash2, Edit2, UserCircle2, X, Palette, Check } from 'lucide-react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Portal from '@/components/Portal';

interface CaseRole {
    id: number;
    name: string;
    sort_order: number;
    badge_color?: string; // New field
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

export default function CaseRolesPage() {
    const [roles, setRoles] = useState<CaseRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<{ id: number; name: string; badge_color: string; sort_order?: number }>({ id: 0, name: '', badge_color: '' });

    useEffect(() => { fetchRoles(); }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/case-roles');
            setRoles(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (form.id) {
                // Keep existing sort_order if not provided (though backend handles it, best to be safe)
                const payload = { ...form };
                await api.put(`/admin/case-roles/${form.id}`, payload);
            } else {
                await api.post('/admin/case-roles', form);
            }
            setShowModal(false);
            fetchRoles();
        } catch { alert('บันทึกไม่สำเร็จ'); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('ยืนยันการลบ?')) return;
        try {
            await api.delete(`/admin/case-roles/${id}`);
            fetchRoles();
        } catch { alert('ลบไม่สำเร็จ'); }
    };

    const handleSortOrderChange = async (role: CaseRole, newOrder: string) => {
        // ... (existing code)
        const order = parseInt(newOrder);
        if (isNaN(order) || order === role.sort_order) return;

        try {
            await api.put(`/admin/case-roles/${role.id}`, { ...role, sort_order: order });
            fetchRoles(); // Refetch to show swapped items
        } catch (err) {
            console.error('Update sort order failed', err);
            alert('Failed to update order');
        }
    };

    return (
        <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${GeistSans.className}`}>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800">สถานะผู้ติดต่อ</h1>
                        <p className="text-sm text-slate-500">จัดการสถานะผู้ติดต่อ (เช่น โจทย์, จำเลย, ผู้ร้อง)</p>
                    </div>
                </div>
                <button
                    onClick={() => { setForm({ id: 0, name: '', badge_color: '' }); setShowModal(true); }}
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 font-medium"
                >
                    <Plus size={18} /> เพิ่มสถานะ
                </button>
            </div>

            {/* Content */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="p-8">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/50 rounded-2xl animate-pulse border border-slate-100" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {roles.map((role, idx) => (
                                <div
                                    key={role.id}
                                    className="group relative bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-pink-200 hover:-translate-y-1 transition-all duration-300"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {/* Manual Sort Order Input */}
                                    <div onClick={(e) => e.stopPropagation()} className="absolute top-3 right-3 z-10 group/input">
                                        <div className="absolute -top-2 -right-2 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover/input:opacity-100 transition-opacity z-20 pointer-events-none">
                                            ORDER
                                        </div>
                                        <input
                                            type="number"
                                            min="1"
                                            defaultValue={role.sort_order}
                                            onBlur={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (val < 1) {
                                                    e.target.value = role.sort_order.toString();
                                                    return;
                                                }
                                                handleSortOrderChange(role, e.target.value);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                            className={`w-10 h-10 text-center font-black text-lg rounded-xl border-2 border-white/50 bg-white/80 text-slate-700 shadow-sm focus:border-[#e72289] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all ${GeistMono.className}`}
                                        />
                                    </div>

                                    <div className="flex items-center gap-4 mb-4">
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm"
                                            style={{
                                                backgroundColor: role.badge_color ? `${role.badge_color}20` : '#fdf2f8',
                                                color: role.badge_color || '#e72289'
                                            }}
                                        >
                                            <UserCircle2 size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">{role.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <p className={`text-xs text-slate-400 font-bold ${GeistMono.className}`}>ID: {role.id}</p>
                                                {role.badge_color && (
                                                    <span className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: role.badge_color }} />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => { setForm({ id: role.id, name: role.name, badge_color: role.badge_color || '', sort_order: role.sort_order }); setShowModal(true); }}
                                            className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-white hover:bg-pink-50 hover:text-[#e72289] rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-100"
                                        >
                                            <Edit2 size={16} /> แก้ไข
                                        </button>
                                        <button
                                            onClick={() => handleDelete(role.id)}
                                            className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-white hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-100"
                                        >
                                            <Trash2 size={16} /> ลบ
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {!loading && roles.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        <Users size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium">ยังไม่มีข้อมูลสถานะผู้ติดต่อ</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <Portal>
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white/90 backdrop-blur-2xl w-full max-w-md rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 border border-white/50">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    <div className="p-2 bg-pink-100 text-[#e72289] rounded-xl">
                                        {form.id ? <Edit2 size={24} /> : <Plus size={24} />}
                                    </div>
                                    {form.id ? 'แก้ไขสถานะ' : 'เพิ่มสถานะใหม่'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">ชื่อสถานะ</label>
                                    <input required type="text"
                                        className="w-full px-4 py-3 mt-1.5 bg-white/50 border border-slate-200 rounded-2xl focus:border-[#e72289] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-medium text-slate-800"
                                        placeholder="เช่น โจทย์, จำเลย"
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                                        <Palette size={14} /> สีประจำสถานะ
                                    </label>
                                    <div className="mt-1.5 flex gap-3 items-center">
                                        <input
                                            type="color"
                                            value={form.badge_color || '#e72289'}
                                            onChange={e => setForm({ ...form, badge_color: e.target.value })}
                                            className="w-12 h-12 rounded-xl cursor-pointer border-0"
                                        />
                                        <input
                                            type="text"
                                            value={form.badge_color}
                                            onChange={e => setForm({ ...form, badge_color: e.target.value })}
                                            placeholder="#e72289"
                                            className="flex-1 px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:border-[#e72289] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-medium text-slate-800 font-mono"
                                        />
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setForm({ ...form, badge_color: color })}
                                                className={`w-8 h-8 rounded-full shadow-sm transition-all flex items-center justify-center border border-slate-200 ${form.badge_color === color ? 'ring-2 ring-offset-2 ring-[#e72289] scale-110' : 'hover:scale-110'}`}
                                                style={{ backgroundColor: color }}
                                            >
                                                {form.badge_color === color && <Check size={14} className="text-white drop-shadow-md" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)}
                                        className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all">
                                        ยกเลิก
                                    </button>
                                    <button type="submit"
                                        className="flex-1 py-3.5 rounded-2xl bg-[#e72289] hover:bg-[#c01b70] text-white font-bold shadow-lg shadow-pink-500/30 transition-all transform active:scale-[0.98]">
                                        บันทึก
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
}
