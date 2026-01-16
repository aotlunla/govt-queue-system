'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, socket } from '@/lib/api';
import { 
  Clock, ArrowRight, User, RefreshCw, Search, 
  CheckSquare, Square, History, Send, MapPin, Calendar 
} from 'lucide-react';

interface Queue {
  id: number;
  queue_number: string;
  type_name: string;
  role_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Log {
  id: number;
  action_type: string;
  action_details: string;
  staff_name: string;
  created_at: string;
}

export default function WorkstationPage() {
  const router = useRouter();
  
  // Data State
  const [stationName, setStationName] = useState('');
  const [queues, setQueues] = useState<Queue[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]); // สำหรับ Checkbox (Bulk)
  const [focusedQueue, setFocusedQueue] = useState<Queue | null>(null); // สำหรับ Sidebar (Detail)
  const [queueLogs, setQueueLogs] = useState<Log[]>([]); // ประวัติ Timeline
  const [loadingLogs, setLoadingLogs] = useState(false);

  // 1. Initial Load
  useEffect(() => {
    const dId = localStorage.getItem('station_dept_id');
    const dName = localStorage.getItem('station_dept_name');
    if (!dId) { router.push('/dashboard'); return; }

    setStationName(dName || 'Workstation');
    fetchQueues(dId);
    fetchConfig();

    socket.on('queue_update', () => fetchQueues(dId));
    return () => { socket.off('queue_update'); };
  }, []);

  // 2. Fetch Data
  const fetchQueues = async (dId: string) => {
    try {
      const res = await api.get(`/queues?dept_id=${dId}`);
      setQueues(res.data);
      // ถ้าคิวที่ Focus อยู่หายไป (เช่นถูกย้าย) ให้เคลียร์ Sidebar
      if (focusedQueue && !res.data.find((q: Queue) => q.id === focusedQueue.id)) {
        setFocusedQueue(null);
      }
    } catch (err) { console.error(err); }
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get('/queues/config');
      setDepartments(res.data.departments);
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

  // 3. Handlers
  const handleCardClick = (queue: Queue) => {
    setFocusedQueue(queue);
    fetchLogs(queue.id);
  };

  const toggleSelect = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // กันไม่ให้ไป trigger handleCardClick
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleTransfer = async (targetDeptId: number) => {
    const personnelId = localStorage.getItem('current_personnel_id');
    
    // ตัดสินใจว่าจะส่ง Bulk หรือ Single
    const isBulk = selectedIds.length > 0;
    const url = isBulk ? '/queues/transfer-bulk' : `/queues/${focusedQueue?.id}/transfer`;
    const payload = isBulk 
      ? { queue_ids: selectedIds, target_dept_id: targetDeptId, personnel_id: personnelId }
      : { target_dept_id: targetDeptId, personnel_id: personnelId };

    try {
      if (!confirm(`ยืนยันการส่งงานไปยังฝ่ายใหม่?`)) return;
      
      if (isBulk) {
        await api.post(url, payload);
        setSelectedIds([]);
      } else {
        await api.put(url, payload);
        setFocusedQueue(null);
      }
    } catch (err) { alert('เกิดข้อผิดพลาดในการส่งงาน'); }
  };

  // Filter & Logic
  const filteredQueues = queues.filter(q => 
    q.queue_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // คำนวณระยะเวลา (Duration) ระหว่าง Log
  const getDuration = (current: string, prev: string) => {
    const diff = new Date(current).getTime() - new Date(prev).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '< 1 นาที';
    if (mins > 60) return `${Math.floor(mins/60)} ชม. ${mins%60} นาที`;
    return `${mins} นาที`;
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* ================= LEFT CONTENT (Main) ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
          <div>
             <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">จุดปฏิบัติงาน</div>
             <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               {stationName}
             </div>
          </div>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-slate-500 hover:text-red-500 underline">
            เปลี่ยนจุด
          </button>
        </header>

        {/* Search Bar Area */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex justify-center sticky top-0 z-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
           <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาเลขคิว (พิมพ์เพื่อกรองทันที)..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-center placeholder-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* Grid Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {filteredQueues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <RefreshCw size={48} className="mb-4 opacity-20" />
              <p>ไม่พบรายการคิว</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredQueues.map((q) => {
                const isSelected = selectedIds.includes(q.id);
                const isFocused = focusedQueue?.id === q.id;
                
                return (
                  <div 
                    key={q.id} 
                    onClick={() => handleCardClick(q)}
                    className={`relative p-4 rounded-xl border cursor-pointer select-none transition-all shadow-sm hover:shadow-md
                      ${isFocused ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'bg-white border-slate-200 hover:border-blue-300'}
                    `}
                  >
                     {/* Checkbox */}
                     <div 
                        onClick={(e) => toggleSelect(e, q.id)}
                        className="absolute top-3 right-3 text-slate-300 hover:text-blue-500 transition-colors z-10"
                     >
                        {isSelected ? <CheckSquare className="text-blue-600" /> : <Square />}
                     </div>

                     {/* Card Content (Small Size) */}
                     <div className="mb-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                          {q.type_name}
                        </span>
                     </div>
                     <div className="text-3xl font-black text-slate-800 mb-1 tracking-tight">{q.queue_number}</div>
                     <div className="flex items-center gap-1 text-slate-500 text-xs truncate">
                        <User size={12} /> {q.role_name}
                     </div>
                     <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> 
                        {new Date(q.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                     </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT SIDEBAR ================= */}
      <aside className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 transition-all duration-300 transform translate-x-0">
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50">
           {selectedIds.length > 0 ? (
             // Bulk Mode Header
             <div>
               <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                 <CheckSquare size={24}/> เลือก {selectedIds.length} รายการ
               </h2>
               <p className="text-sm text-slate-500 mt-1">จัดการส่งต่อหลายรายการพร้อมกัน</p>
             </div>
           ) : focusedQueue ? (
             // Single Mode Header
             <div>
               <div className="flex justify-between items-start">
                 <h2 className="text-4xl font-black text-slate-800 mb-2">{focusedQueue.queue_number}</h2>
                 <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                   {focusedQueue.status}
                 </span>
               </div>
               <div className="space-y-1">
                 <p className="text-sm text-slate-600 flex items-center gap-2"><User size={14}/> {focusedQueue.role_name}</p>
                 <p className="text-sm text-slate-600 flex items-center gap-2"><Calendar size={14}/> {focusedQueue.type_name}</p>
               </div>
             </div>
           ) : (
             // Empty State Header
             <div className="text-center py-4 text-slate-400">
               <MapPin size={48} className="mx-auto mb-2 opacity-20"/>
               <p>เลือกคิวเพื่อดูรายละเอียด</p>
             </div>
           )}
        </div>

        {/* Sidebar Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           
           {/* Timeline Section (Only Single Mode) */}
           {focusedQueue && selectedIds.length === 0 && (
             <div className="animate-in slide-in-from-right duration-300">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <History size={16}/> ประวัติการเดินทาง
                </h3>
                
                {loadingLogs ? (
                  <div className="text-center py-4"><RefreshCw className="animate-spin mx-auto text-slate-300"/></div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                    {queueLogs.map((log, idx) => {
                      // คำนวณเวลากับ log ก่อนหน้า (ถ้ามี)
                      const prevLog = queueLogs[idx + 1]; // เพราะเรา sort DESC ตัวถัดไปคือตัวเก่ากว่า
                      const duration = prevLog ? getDuration(log.created_at, prevLog.created_at) : 'จุดเริ่มต้น';

                      return (
                        <div key={log.id} className="relative pl-6">
                          {/* Dot */}
                          <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${idx===0 ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                          
                          {/* Content */}
                          <div>
                            <div className="flex justify-between items-baseline mb-1">
                              <span className={`text-sm font-bold ${idx===0 ? 'text-blue-700' : 'text-slate-700'}`}>
                                {log.action_type === 'CREATE' ? 'รับบัตรคิว' : log.action_type === 'TRANSFER' ? 'รับงานเข้า' : log.action_type}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                {new Date(log.created_at).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            
                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mb-1">
                              {log.action_details}
                            </p>
                            
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                               <span>โดย: {log.staff_name || 'ระบบ'}</span>
                               <span className="text-blue-400 font-medium">({duration})</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
             </div>
           )}

           {/* Actions Section (Transfer) */}
           {(focusedQueue || selectedIds.length > 0) && (
             <div className="pt-6 border-t border-slate-100 animate-in slide-in-from-bottom duration-300">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Send size={16}/> ส่งต่องานไปยัง
                </h3>
                <div className="space-y-2">
                  {departments
                    .filter(d => d.id !== Number(localStorage.getItem('station_dept_id'))) // ไม่โชว์ฝ่ายตัวเอง
                    .map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => handleTransfer(dept.id)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all flex justify-between items-center group bg-white"
                    >
                      <span className="font-semibold">{dept.name}</span>
                      <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
             </div>
           )}
        </div>

      </aside>
    </div>
  );
}