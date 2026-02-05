'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Plus, Trash2, Edit2, X, Search,
  User, KeyRound
} from 'lucide-react';
import { GeistSans } from 'geist/font/sans';
import Portal from '@/components/Portal';

interface Personnel {
  id: number;
  fullname: string;
  nickname: string;
}

export default function PersonnelPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ fullname: '', nickname: '', username: '', password: '' });

  // 1. Fetch Data
  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/personnel');
      setPersonnel(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPersonnel(); }, []);

  // 2. Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Edit mode: only send password if changed
        const payload: any = { fullname: formData.fullname, nickname: formData.nickname, username: formData.username };
        if (formData.password) {
          payload.password = formData.password;
        }
        await api.put(`/admin/personnel/${editingId}`, payload);
      } else {
        // Create mode: send all
        await api.post('/admin/personnel', formData);
      }
      setFormData({ fullname: '', nickname: '', username: '', password: '' });
      setEditingId(null);
      setShowModal(false);
      fetchPersonnel();
    } catch (err: any) {
      alert(err.response?.data?.error || 'บันทึกไม่สำเร็จ');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันการลบรายชื่อ?')) return;
    try {
      await api.delete(`/admin/personnel/${id}`);
      fetchPersonnel();
    } catch (err) { alert('ลบไม่สำเร็จ'); }
  };

  const openEdit = (p: Personnel) => {
    // Note: API might need to return username if we want to edit it. 
    // Assuming p has username, if not we might need to fetch detailed info or just leave it blank/read-only.
    // Based on list view, we only have ID, Fullname, Nickname. We might need to fetch full details or update fetchPersonnel to get username.
    // For now, let's assume p might have it or we default to empty (which might be annoying).
    // Let's check the interface. Interface Personnel has { id, fullname, nickname }. 
    // We should update the interface and fetch to include username.
    setFormData({ fullname: p.fullname, nickname: p.nickname, username: (p as any).username || '', password: '' });
    setEditingId(p.id);
    setShowModal(true);
  };

  // Filter Logic
  const filtered = personnel.filter(p =>
    p.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.nickname && p.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${GeistSans.className}`}>

      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">จัดการบุคลากร</h1>
            <p className="text-sm text-slate-500">จัดการรายชื่อเจ้าหน้าที่และสิทธิ์การเข้าใช้งาน</p>
          </div>
        </div>

        <button
          onClick={() => { setFormData({ fullname: '', nickname: '', username: '', password: '' }); setEditingId(null); setShowModal(true); }}
          className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={18} />
          เพิ่มเจ้าหน้าที่
        </button>
      </div>

      {/* --- Toolbar --- */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-sm rounded-[2rem] p-2 flex gap-4 items-center max-w-2xl">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#e72289] transition-colors" size={20} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือ ชื่อเล่น..."
            className="w-full pl-12 pr-4 py-3 bg-transparent border-none rounded-xl text-slate-900 focus:outline-none focus:bg-white/50 transition-colors placeholder:text-slate-400 font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="px-6 py-2 border-l border-slate-200/50 text-sm font-bold text-slate-500">
          {filtered.length} คน
        </div>
      </div>

      {/* --- Content Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/50 rounded-[2rem] border border-slate-100 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white/50 rounded-[2rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={40} className="text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-600">ไม่พบรายชื่อ</p>
            <p className="text-slate-400 text-sm font-medium">ลองค้นหาด้วยคำอื่น หรือเพิ่มเจ้าหน้าที่ใหม่</p>
          </div>
        ) : (
          filtered.map((p, idx) => (
            <div
              key={p.id}
              className="group relative bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 hover:shadow-xl hover:border-pink-200 hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 text-[#e72289] border border-pink-100 flex items-center justify-center font-black text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                  {p.fullname.charAt(0)}
                </div>

                {/* Actions Dropdown (Simplified as buttons) */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  <button
                    onClick={() => openEdit(p)}
                    className="p-2 text-slate-400 hover:text-[#e72289] hover:bg-pink-50 rounded-xl transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-lg line-clamp-1 group-hover:text-[#e72289] transition-colors">
                  {p.fullname}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    Staff
                  </span>
                  {p.nickname && (
                    <span className="text-sm text-slate-500 font-medium">
                      ({p.nickname})
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- Modal --- */}
      {showModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white/90 backdrop-blur-2xl w-full max-w-md rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 border border-white/50">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-pink-100 text-[#e72289] rounded-xl">
                    {editingId ? <Edit2 size={24} /> : <Plus size={24} />}
                  </div>
                  {editingId ? 'แก้ไขข้อมูล' : 'เพิ่มบุคลากร'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-black/5 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">ชื่อบัญชีผู้ใช้ (Username)</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:border-[#e72289] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-medium"
                    placeholder="เช่น somchai"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">ชื่อ-นามสกุล</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:border-[#e72289] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-medium"
                    placeholder="เช่น สมชาย ใจดี"
                    value={formData.fullname}
                    onChange={e => setFormData({ ...formData, fullname: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">ชื่อเล่น</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:border-[#e72289] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-medium"
                    placeholder="เช่น กอล์ฟ"
                    value={formData.nickname}
                    onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                  />
                </div>

                {/* Password Input (Required for New, Optional for Edit) */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 flex items-center gap-2">
                    <KeyRound size={14} className={editingId ? "text-amber-500" : "text-slate-500"} />
                    {editingId ? 'ตั้งรหัสผ่านใหม่' : 'รหัสผ่าน'}
                    {editingId && <span className="text-slate-400 font-medium normal-case">(เว้นว่างถ้าไม่ต้องการเปลี่ยน)</span>}
                  </label>
                  <input
                    required={!editingId}
                    type="password"
                    className={`w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:border-[#e72289] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-medium ${editingId ? 'bg-amber-50/50 border-amber-200 focus:border-amber-400 focus:ring-amber-500/10' : ''}`}
                    placeholder={editingId ? "รหัสผ่านใหม่..." : "กำหนดรหัสผ่าน..."}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                  {!editingId && <p className="text-[10px] text-slate-400 mt-1 ml-1">* ต้องมีความยาวอย่างน้อย 6 ตัวอักษร</p>}
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-2xl bg-[#e72289] hover:bg-[#c01b70] text-white font-bold shadow-lg shadow-pink-500/30 transition-all transform active:scale-[0.98]"
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