'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Ticket, Plus, Trash2, Edit2, Save, X, 
  Palette, Smartphone 
} from 'lucide-react';

interface QueueType {
  id: number;
  name: string;
  code: string;
  badge_color: string;
}

// สี Preset สวยๆ สไตล์ Fluent
const COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-orange-500', 
  'bg-rose-600', 'bg-purple-600', 'bg-slate-700'
];

export default function QueueTypesPage() {
  const [types, setTypes] = useState<QueueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form Data
  const [formData, setFormData] = useState({ name: '', code: '', badge_color: 'bg-blue-600' });

  // 1. Fetch Data
  const fetchTypes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/queue-types');
      setTypes(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTypes(); }, []);

  // 2. Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/queue-types/${editingId}`, formData);
      } else {
        await api.post('/admin/queue-types', formData);
      }
      setFormData({ name: '', code: '', badge_color: 'bg-blue-600' });
      setEditingId(null);
      setShowModal(false);
      fetchTypes();
    } catch (err) { alert('บันทึกไม่สำเร็จ'); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm('ยืนยันการลบประเภทคิวนี้?')) return;
    try {
      await api.delete(`/admin/queue-types/${id}`);
      fetchTypes();
    } catch (err) { alert('ลบไม่สำเร็จ'); }
  };

  const openEdit = (t: QueueType) => {
    setFormData({ name: t.name, code: t.code, badge_color: t.badge_color });
    setEditingId(t.id);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen p-8 font-sans text-slate-900 bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">ประเภทคิว (Queue Types)</h1>
            <p className="text-slate-500 mt-1">ตั้งค่าปุ่มกดบัตรคิวที่หน้าตู้ Kiosk</p>
          </div>
          <button 
            onClick={() => { setFormData({ name: '', code: '', badge_color: 'bg-blue-600' }); setEditingId(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-[#0078D4] hover:bg-[#006cbd] text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all"
          >
            <Plus size={20} /> เพิ่มประเภทคิว
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse" />)
          ) : types.map((t) => (
            <div 
              key={t.id} 
              className="group relative bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300"
            >
              {/* Preview Button (Kiosk Style) */}
              <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-center items-center h-32">
                <div className={`${t.badge_color} w-full max-w-[200px] py-4 rounded-xl shadow-md text-center transform group-hover:scale-105 transition-transform duration-300`}>
                  <div className="text-white font-bold text-lg drop-shadow-sm">{t.name}</div>
                  <div className="text-white/80 text-xs font-mono mt-1 bg-black/10 inline-block px-2 py-0.5 rounded">
                    Code: {t.code}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800">{t.name}</h3>
                  <p className="text-xs text-slate-400">Prefix: {t.code}</p>
                </div>
                
                <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* --- Modal Form --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-0 overflow-hidden animate-in zoom-in-95">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <Edit2 size={18}/> : <Plus size={18}/>}
                {editingId ? 'แก้ไขปุ่มกด' : 'เพิ่มปุ่มใหม่'}
              </h2>
              <button onClick={() => setShowModal(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Preview Box */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 border-dashed rounded-xl">
                <span className="text-xs text-slate-400 mb-2 uppercase tracking-widest font-bold flex items-center gap-1">
                  <Smartphone size={12} /> Live Preview
                </span>
                <div className={`${formData.badge_color} w-full py-4 rounded-xl shadow-lg text-center transition-all duration-300`}>
                  <div className="text-white font-bold text-xl">{formData.name || 'ชื่อปุ่ม'}</div>
                  <div className="text-white/70 text-sm font-mono mt-1">Code: {formData.code || '?'}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-slate-700">ชื่อปุ่มกด</label>
                  <input required type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="เช่น ติดต่องานทะเบียน"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} autoFocus />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">รหัสย่อ</label>
                  <input required type="text" maxLength={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-center font-mono font-bold"
                    placeholder="A"
                    value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Palette size={16} /> เลือกสีปุ่ม
                </label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({...formData, badge_color: color})}
                      className={`w-8 h-8 rounded-full ${color} shadow-sm transition-transform hover:scale-110 ${formData.badge_color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border text-slate-600 hover:bg-slate-50">ยกเลิก</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-[#0078D4] hover:bg-[#006cbd] text-white shadow-md">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}