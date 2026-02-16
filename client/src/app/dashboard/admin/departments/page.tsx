'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
    Building2, Plus, Trash2, Edit2, X,
    ArrowRight, LayoutGrid, Monitor
} from 'lucide-react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Portal from '@/components/Portal';

interface Department {
    id: number;
    name: string;
    code: string;
    sort_order: number;
    status_message?: string;
}

interface Counter {
    id: number;
    name: string;
    department_id: number;
}

export default function DepartmentsPage() {
    const [depts, setDepts] = useState<Department[]>([]);
    const [counters, setCounters] = useState<Counter[]>([]);
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [showCounterModal, setShowCounterModal] = useState(false);

    // Form Data
    const [deptForm, setDeptForm] = useState<{ id: number; name: string; code: string; sort_order: number; status_message?: string }>({ id: 0, name: '', code: '', sort_order: 0, status_message: '' });
    const [counterForm, setCounterForm] = useState({ id: 0, name: '' });

    // 1. Initial Load
    useEffect(() => { fetchDepartments(); }, []);

    // 2. Fetch Departments
    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/departments');
            setDepts(res.data);
            if (selectedDept) {
                const updated = res.data.find((d: Department) => d.id === selectedDept.id);
                if (updated) setSelectedDept(updated);
                else setSelectedDept(null); // Clear if deleted
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // 3. Fetch Counters
    const fetchCounters = async (deptId: number) => {
        try {
            const res = await api.get(`/admin/counters?department_id=${deptId}`);
            setCounters(res.data.filter((c: Counter) => c.department_id === deptId));
        } catch (err) { console.error(err); }
    };

    // --- Handlers ---

    const handleSelectDept = (dept: Department) => {
        setSelectedDept(dept);
        fetchCounters(dept.id);
    };

    const handleSaveDept = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (deptForm.id) {
                await api.put(`/admin/departments/${deptForm.id}`, deptForm);
            } else {
                await api.post('/admin/departments', deptForm);
            }
            setShowDeptModal(false);
            fetchDepartments();
        } catch (err) { alert('บันทึกไม่สำเร็จ'); }
    };

    const handleDeleteDept = async (id: number) => {
        if (!confirm('คำเตือน: การลบฝ่ายงานจะทำให้ช่องบริการและคิวที่เกี่ยวข้องหายไป\nยืนยันที่จะลบ?')) return;
        try {
            await api.delete(`/admin/departments/${id}`);
            setSelectedDept(null);
            setCounters([]);
            fetchDepartments();
        } catch (err) { alert('ลบไม่สำเร็จ'); }
    };

    const handleSaveCounter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDept) return;
        try {
            if (counterForm.id) {
                await api.put(`/admin/counters/${counterForm.id}`, { ...counterForm, department_id: selectedDept.id });
            } else {
                await api.post('/admin/counters', { ...counterForm, department_id: selectedDept.id });
            }
            setShowCounterModal(false);
            setCounterForm({ id: 0, name: '' });
            fetchCounters(selectedDept.id);
        } catch (err) { alert('บันทึกไม่สำเร็จ'); }
    };

    const handleDeleteCounter = async (id: number) => {
        if (!confirm('ลบช่องบริการนี้?')) return;
        if (!selectedDept) return;
        try {
            await api.delete(`/admin/counters/${id}`);
            fetchCounters(selectedDept.id);
        } catch (err) { alert('ลบไม่สำเร็จ'); }
    };

    const handleSortOrderChange = async (dept: Department, newOrder: string) => {
        const order = parseInt(newOrder);
        if (isNaN(order) || order === dept.sort_order) return;

        try {
            await api.put(`/admin/departments/${dept.id}`, { ...dept, sort_order: order });
            fetchDepartments(); // Refetch to show swapped items
        } catch (err) {
            console.error('Update sort order failed', err);
            alert('Failed to update order');
        }
    };

    return (
        <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-100px)] flex flex-col ${GeistSans.className}`}>

            {/* Header */}
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 flex-none">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800">แผนกและจุดบริการ</h1>
                        <p className="text-sm text-slate-500">จัดการโครงสร้างฝ่ายงานและจุดให้บริการ (Counters)</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">

                {/* ================= LEFT: DEPARTMENTS LIST ================= */}
                <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
                    <div className="flex justify-between items-center px-1 flex-none">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Building2 size={16} /> รายชื่อแผนก
                        </h2>
                        <button
                            onClick={() => { setDeptForm({ id: 0, name: '', code: '', sort_order: 0, status_message: '' }); setShowDeptModal(true); }}
                            className="text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all flex items-center gap-1.5"
                        >
                            <Plus size={16} /> เพิ่มแผนก
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 custom-scrollbar pb-4 space-y-3">
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/50 rounded-2xl animate-pulse border border-slate-100" />)}
                            </div>
                        ) : (
                            depts.map((d) => (
                                <div
                                    key={d.id}
                                    onClick={() => handleSelectDept(d)}
                                    className={`group relative p-4 rounded-2xl border cursor-pointer transition-all duration-300
                    ${selectedDept?.id === d.id
                                            ? 'bg-[#e72289] border-[#e72289] text-white ring-2 ring-pink-100 scale-[1.02]'
                                            : 'bg-white/80 backdrop-blur-xl border-white/60 text-slate-800 hover:border-pink-200 hover:shadow-lg'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Manual Sort Order Input */}
                                        <div onClick={(e) => e.stopPropagation()} className="relative group/input">
                                            <div className="absolute -top-2 -right-2 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover/input:opacity-100 transition-opacity z-20 pointer-events-none">
                                                ORDER
                                            </div>
                                            <input
                                                type="number"
                                                min="1"
                                                defaultValue={d.sort_order}
                                                onBlur={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (val < 1) {
                                                        e.target.value = d.sort_order.toString();
                                                        return;
                                                    }
                                                    handleSortOrderChange(d, e.target.value);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.currentTarget.blur();
                                                    }
                                                }}
                                                className={`w-10 h-10 text-center font-black text-lg rounded-xl border-2 transition-all outline-none shadow-sm ${GeistMono.className}
                          ${selectedDept?.id === d.id
                                                        ? 'bg-white/20 border-white/40 text-white placeholder-white/50 focus:bg-white focus:text-[#e72289]'
                                                        : 'bg-white border-slate-200 text-slate-700 focus:border-[#e72289] focus:ring-4 focus:ring-pink-500/10'
                                                    }`}
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg leading-tight mb-1">{d.name}</h3>
                                            <div className={`text-[10px] font-bold inline-block px-2 py-0.5 rounded-md ${GeistMono.className} ${selectedDept?.id === d.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                CODE: {d.code}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className={`absolute top-3 right-3 flex gap-1 ${selectedDept?.id === d.id ? 'opacity-100' : 'md:opacity-0 md:group-hover:opacity-100'} transition-all`}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeptForm(d); setShowDeptModal(true); }}
                                            className={`p-1.5 rounded-lg transition-colors ${selectedDept?.id === d.id ? 'text-white hover:bg-white/20' : 'text-slate-400 hover:text-[#e72289] hover:bg-pink-50'}`}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        {selectedDept?.id !== d.id && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteDept(d.id); }}
                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ================= RIGHT: COUNTERS LIST ================= */}
                <div className="lg:col-span-8 bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-sm flex flex-col min-h-0 overflow-hidden">
                    {selectedDept ? (
                        <>
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/40">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                        <Monitor className="text-[#e72289]" />
                                        {selectedDept.name}
                                    </h2>
                                    <p className="text-slate-500 text-sm font-medium">จัดการจุดให้บริการ (Counters) ภายในแผนกนี้</p>
                                </div>
                                <button
                                    onClick={() => { setCounterForm({ id: 0, name: '' }); setShowCounterModal(true); }}
                                    className="bg-[#e72289] hover:bg-[#c01b70] text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-pink-500/30 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Plus size={18} /> เพิ่มจุดบริการ
                                </button>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                {counters.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                        <LayoutGrid size={48} className="mb-4" />
                                        <p className="font-medium">ยังไม่มีจุดบริการในแผนกนี้</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {counters.map((c) => (
                                            <div key={c.id} className="group bg-white/60 border border-slate-200 p-4 rounded-2xl hover:border-pink-300 hover:shadow-md transition-all relative">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className={`w-10 h-10 bg-pink-50 text-[#e72289] rounded-xl flex items-center justify-center font-black text-lg ${GeistMono.className}`}>
                                                        {c.id}
                                                    </div>
                                                    <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => { setCounterForm(c); setShowCounterModal(true); }}
                                                            className="p-1.5 text-slate-400 hover:text-[#e72289] hover:bg-pink-50 rounded-lg"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCounter(c.id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-slate-900 text-lg">{c.name}</h3>
                                                <div className={`text-xs text-slate-400 mt-1 font-bold ${GeistMono.className}`}>ID: {c.id}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                <ArrowRight size={32} className="text-slate-300" />
                            </div>
                            <p className="font-medium">กรุณาเลือกแผนกทางด้านซ้าย</p>
                            <p className="text-sm opacity-60">เพื่อจัดการจุดให้บริการ</p>
                        </div>
                    )}
                </div>

            </div>

            {/* ================= MODAL: DEPARTMENT ================= */}
            {showDeptModal && (
                <Portal>
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/50">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
                                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    <div className="p-2 bg-pink-100 text-[#e72289] rounded-xl">
                                        {deptForm.id ? <Edit2 size={24} /> : <Plus size={24} />}
                                    </div>
                                    {deptForm.id ? 'แก้ไขแผนก' : 'เพิ่มแผนกใหม่'}
                                </h3>
                                <button onClick={() => setShowDeptModal(false)} className="p-2 hover:bg-black/5 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveDept} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">ชื่อแผนก</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-[#e72289] transition-all font-medium"
                                        placeholder="เช่น ฝ่ายทะเบียน, ฝ่ายการเงิน"
                                        value={deptForm.name}
                                        onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">รหัสแผนก (Code)</label>
                                    <input
                                        type="text"
                                        required
                                        className={`w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-[#e72289] uppercase transition-all font-bold ${GeistMono.className}`}
                                        placeholder="เช่น REG, FIN"
                                        value={deptForm.code}
                                        onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                                    />
                                </div>

                                {/* Status Message Input */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">ข้อความสถานะ (Optional)</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-[#e72289] transition-all font-medium h-24 resize-none"
                                        placeholder="เช่น รอเรียกคิวที่ห้องการเงิน&#10;โปรดเตรียมบัตรประชาชน"
                                        value={deptForm.status_message || ''}
                                        onChange={(e) => setDeptForm({ ...deptForm, status_message: e.target.value })}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 ml-1 font-medium">* ข้อความนี้จะแสดงในหน้าติดตามสถานะแทนคำว่า &quot;รอเรียกคิว&quot; (รองรับการเว้นบรรทัด)</p>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeptModal(false)}
                                        className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3.5 bg-[#e72289] hover:bg-[#c01b70] text-white font-bold rounded-2xl shadow-lg shadow-pink-500/30 transition-all transform active:scale-[0.98]"
                                    >
                                        บันทึก
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </Portal>
            )}

            {/* ================= MODAL: COUNTER ================= */}
            {showCounterModal && (
                <Portal>
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/50">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
                                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    <div className="p-2 bg-pink-100 text-[#e72289] rounded-xl">
                                        {counterForm.id ? <Edit2 size={24} /> : <Plus size={24} />}
                                    </div>
                                    {counterForm.id ? 'แก้ไขจุดบริการ' : 'เพิ่มจุดบริการใหม่'}
                                </h3>
                                <button onClick={() => setShowCounterModal(false)} className="p-2 hover:bg-black/5 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveCounter} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">ชื่อจุดบริการ / ช่องบริการ</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-[#e72289] transition-all font-medium"
                                        placeholder="เช่น ช่อง 1, โต๊ะ 5"
                                        value={counterForm.name}
                                        onChange={(e) => setCounterForm({ ...counterForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCounterModal(false)}
                                        className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3.5 bg-[#e72289] hover:bg-[#c01b70] text-white font-bold rounded-2xl shadow-lg shadow-pink-500/30 transition-all transform active:scale-[0.98]"
                                    >
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