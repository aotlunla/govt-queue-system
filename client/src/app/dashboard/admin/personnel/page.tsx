'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Plus, Trash2, Edit2, Save, X, Search, 
  User, CheckCircle2, AlertCircle 
} from 'lucide-react';

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
  const [formData, setFormData] = useState({ fullname: '', nickname: '' });

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
        await api.put(`/admin/personnel/${editingId}`, formData);
      } else {
        await api.post('/admin/personnel', formData);
      }
      setFormData({ fullname: '', nickname: '' });
      setEditingId(null);
      setShowModal(false);
      fetchPersonnel();
    } catch (err) { alert('บันทึกไม่สำเร็จ'); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm('ยืนยันการลบรายชื่อ?')) return;
    try {
      await api.delete(`/admin/personnel/${id}`);
      fetchPersonnel();
    } catch (err) { alert('ลบไม่สำเร็จ'); }
  };

  const openEdit = (p: Personnel) => {
    setFormData({ fullname: p.fullname, nickname: p.nickname });
    setEditingId(p.id);
    setShowModal(true);
  };

  // Filter Logic
  const filtered = personnel.filter(p => 
    p.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.nickname && p.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    // ✨ พื้นหลังสีเทาอ่อน (Mica Alt) เพื่อดันให้การ์ดสีขาวเด่นขึ้น
    <div className="min-h-screen p-8 font-sans text-slate-900 bg-[#F5F7FA]">
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              บุคลากร (Personnel)
            </h1>
            <p className="text-slate-500 mt-1">จัดการรายชื่อเจ้าหน้าที่ผู้ปฏิบัติงาน</p>
          </div>
          
          <button 
            onClick={() => { setFormData({ fullname: '', nickname: '' }); setEditingId(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-[#0078D4] hover:bg-[#006cbd] text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all active:scale-95"
          >
            <Plus size={20} /> เพิ่มเจ้าหน้าที่
          </button>
        </div>

        {/* --- Toolbar (Solid White) --- */}
        <div className="sticky top-4 z-10 bg-white border border-slate-200 shadow-sm rounded-xl p-2 flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ..." 
              className="w-full pl-12 pr-4 py-2.5 bg-transparent border-none rounded-lg text-slate-900 focus:outline-none focus:bg-slate-50 transition-colors placeholder:text-slate-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="px-4 py-2 border-l border-slate-100 text-sm font-medium text-slate-500">
            {filtered.length} รายการ
          </div>
        </div>

        {/* --- Content Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <User size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">ไม่พบรายชื่อ</p>
            </div>
          ) : (
            filtered.map((p) => (
              <div 
                key={p.id} 
                className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-[#0078D4] transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar (Solid Colors) */}
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0078D4] border border-blue-100 flex items-center justify-center font-bold text-lg">
                      {p.fullname.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-[#0078D4] transition-colors">
                        {p.fullname}
                      </h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {p.nickname ? `(${p.nickname})` : '-'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons (Always Visible on Touch, Hover on Desktop) */}
                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEdit(p)}
                      className="p-2 text-slate-400 hover:text-[#0078D4] hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* --- Simple Modal --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'แก้ไขข้อมูล' : 'เพิ่มบุคลากร'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:border-[#0078D4] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  value={formData.fullname}
                  onChange={e => setFormData({...formData, fullname: e.target.value})}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อเล่น</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:border-[#0078D4] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  value={formData.nickname}
                  onChange={e => setFormData({...formData, nickname: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-[#0078D4] hover:bg-[#006cbd] text-white font-medium shadow-sm"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}