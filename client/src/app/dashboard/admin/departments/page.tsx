'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Building2, Plus, Trash2, Edit2, Save, X, 
  MapPin, ArrowRight, LayoutGrid, Monitor 
} from 'lucide-react';

interface Department {
  id: number;
  name: string;
  code: string;
  sort_order: number;
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
  const [deptForm, setDeptForm] = useState({ id: 0, name: '', code: '', sort_order: 0 });
  const [counterForm, setCounterForm] = useState({ name: '' });

  // 1. Initial Load
  useEffect(() => { fetchDepartments(); }, []);

  // 2. Fetch Departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/departments');
      setDepts(res.data);
      // ถ้ามีเลือกฝ่ายอยู่แล้ว ให้รีโหลดฝ่ายนั้นด้วย (เผื่อชื่อเปลี่ยน)
      if (selectedDept) {
        const updated = res.data.find((d: Department) => d.id === selectedDept.id);
        if (updated) setSelectedDept(updated);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // 3. Fetch Counters (เมื่อเลือกฝ่าย)
  const fetchCounters = async (deptId: number) => {
    try {
      const res = await api.get(`/admin/counters?department_id=${deptId}`);
      setCounters(res.data);
    } catch (err) { console.error(err); }
  };

  // --- Handlers: Department ---

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
    if (!confirm('คำเตือน: การลบฝ่ายงานจะทำให้ช่องบริการและคิวที่เกี่ยวข้องหายไป หรือเกิดข้อผิดพลาดได้\nยืนยันที่จะลบ?')) return;
    try {
      await api.delete(`/admin/departments/${id}`);
      setSelectedDept(null);
      setCounters([]);
      fetchDepartments();
    } catch (err) { alert('ลบไม่สำเร็จ (อาจมีข้อมูลคิวค้างอยู่)'); }
  };

  // --- Handlers: Counter ---

  const handleSaveCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    try {
      await api.post('/admin/counters', { ...counterForm, department_id: selectedDept.id });
      setShowCounterModal(false);
      setCounterForm({ name: '' });
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

  // --- UI Components ---

  return (
    <div className="min-h-screen p-8 font-sans text-slate-900 bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">โครงสร้างองค์กร</h1>
            <p className="text-slate-500 mt-1">จัดการฝ่ายงาน (Departments) และช่องบริการ (Counters)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          
          {/* ================= LEFT: DEPARTMENTS LIST (4 Columns) ================= */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Building2 className="text-blue-600" size={20} /> ฝ่ายงานทั้งหมด
              </h2>
              <button 
                onClick={() => { setDeptForm({ id: 0, name: '', code: '', sort_order: 0 }); setShowDeptModal(true); }}
                className="text-sm bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 px-3 py-1.5 rounded-lg shadow-sm transition-all"
              >
                + เพิ่มฝ่าย
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)
              ) : depts.map((d) => (
                <div 
                  key={d.id}
                  onClick={() => handleSelectDept(d)}
                  className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md
                    ${selectedDept?.id === d.id 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-100' 
                      : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{d.name}</h3>
                      <div className={`text-xs mt-1 font-mono inline-block px-1.5 py-0.5 rounded ${selectedDept?.id === d.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        CODE: {d.code}
                      </div>
                    </div>
                    {selectedDept?.id === d.id && <ArrowRight size={20} className="animate-pulse" />}
                  </div>

                  {/* Actions (Edit/Delete) */}
                  <div className={`absolute top-2 right-2 flex gap-1 ${selectedDept?.id === d.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeptForm(d); setShowDeptModal(true); }}
                      className={`p-1.5 rounded-md transition-colors ${selectedDept?.id === d.id ? 'text-white hover:bg-white/20' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    {/* ไม่ให้ลบฝ่ายที่เลือกอยู่เพื่อกันงง */}
                    {selectedDept?.id !== d.id && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteDept(d.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ================= RIGHT: COUNTERS LIST (8 Columns) ================= */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            {selectedDept ? (
              <>
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <MapPin className="text-blue-600" /> 
                      ช่องบริการใน "{selectedDept.name}"
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">จัดการจุดให้บริการภายในฝ่ายงานนี้</p>
                  </div>
                  <button 
                    onClick={() => { setCounterForm({ name: '' }); setShowCounterModal(true); }}
                    className="flex items-center gap-2 bg-[#0078D4] hover:bg-[#006cbd] text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all active:scale-95"
                  >
                    <Plus size={18} /> เพิ่มช่องบริการ
                  </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto bg-[#FAFAFA]">
                  {counters.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <Monitor size={48} className="mb-4 opacity-20" />
                      <p>ยังไม่มีช่องบริการในฝ่ายนี้</p>
                      <button onClick={() => setShowCounterModal(true)} className="mt-2 text-blue-600 hover:underline text-sm">
                        + เพิ่มช่องแรกเลย
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {counters.map((c) => (
                        <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-blue-400 hover:shadow-md transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                              {c.name.replace(/\D/g, '') || '#'}
                            </div>
                            <span className="font-semibold text-slate-700">{c.name}</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteCounter(c.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Empty State (No Dept Selected)
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <LayoutGrid size={64} className="mb-6 opacity-10" />
                <p className="text-lg">กรุณาเลือก "ฝ่ายงาน" ทางด้านซ้าย</p>
                <p className="text-sm">เพื่อจัดการช่องบริการภายใน</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* --- Modal: Add/Edit Department --- */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">{deptForm.id ? 'แก้ไขฝ่ายงาน' : 'เพิ่มฝ่ายงานใหม่'}</h2>
            <form onSubmit={handleSaveDept} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">ชื่อฝ่ายงาน</label>
                <input required type="text" className="input-field" placeholder="เช่น การเงิน"
                  value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} autoFocus />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700">รหัสย่อ (Code)</label>
                  <input required type="text" className="input-field uppercase" placeholder="FIN"
                    value={deptForm.code} onChange={e => setDeptForm({...deptForm, code: e.target.value.toUpperCase()})} />
                </div>
                <div className="w-1/3">
                  <label className="text-sm font-medium text-slate-700">ลำดับ</label>
                  <input type="number" className="input-field"
                    value={deptForm.sort_order} onChange={e => setDeptForm({...deptForm, sort_order: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowDeptModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
                <button type="submit" className="btn-primary flex-1">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal: Add Counter --- */}
      {showCounterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">เพิ่มช่องบริการ</h2>
            <p className="text-sm text-slate-500 mb-4">ในฝ่าย: <span className="font-bold text-blue-600">{selectedDept?.name}</span></p>
            <form onSubmit={handleSaveCounter} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">ชื่อช่องบริการ</label>
                <input required type="text" className="input-field" placeholder="เช่น ช่อง 10"
                  value={counterForm.name} onChange={e => setCounterForm({...counterForm, name: e.target.value})} autoFocus />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCounterModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
                <button type="submit" className="btn-primary flex-1">เพิ่มเลย</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-field {
          @apply w-full px-4 py-2 mt-1 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all;
        }
        .btn-primary {
          @apply py-2.5 rounded-lg bg-[#0078D4] hover:bg-[#006cbd] text-white font-medium shadow-sm transition-all;
        }
        .btn-secondary {
          @apply py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all;
        }
        /* Custom Scrollbar for list */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>
    </div>
  );
}