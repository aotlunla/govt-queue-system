'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, socket } from '@/lib/api';
import { Clock, ArrowRight, User, RefreshCw } from 'lucide-react';

// Interface ของคิว
interface Queue {
  id: number;
  queue_number: string;
  type_name: string;
  role_name: string;
  status: string;
  created_at: string;
  dept_name?: string;
}

export default function WorkstationPage() {
  const router = useRouter();
  const [stationName, setStationName] = useState('');
  const [deptId, setDeptId] = useState<string | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  
  // State สำหรับ Modal ส่งงาน
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [targetDepts, setTargetDepts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // 1. ตรวจสอบว่าเลือก Station หรือยัง
  useEffect(() => {
    const dId = localStorage.getItem('station_dept_id');
    const dName = localStorage.getItem('station_dept_name');
    const cName = localStorage.getItem('station_counter_name');

    if (!dId) {
      router.push('/dashboard'); // ถ้ายังไม่เลือก ดีดกลับไปหน้าเลือก
      return;
    }

    setDeptId(dId);
    setStationName(`${dName} ${cName ? `(${cName})` : ''}`);
    
    fetchQueues(dId);
    fetchConfig(); // โหลดรายชื่อแผนกเพื่อใช้ใน Dropdown ส่งงาน

    // Realtime Listener
    socket.on('queue_update', () => fetchQueues(dId));
    return () => { socket.off('queue_update'); };
  }, []);

  // 2. โหลดรายการคิว
  const fetchQueues = async (dId: string) => {
    try {
      const res = await api.get(`/queues?dept_id=${dId}`);
      setQueues(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get('/queues/config');
      setTargetDepts(res.data.departments);
    } catch (err) { console.error(err); }
  };

  // 3. เปิด Modal ส่งงาน
  const openTransferModal = (queue: Queue) => {
    setSelectedQueue(queue);
    setShowModal(true);
  };

  // 4. สั่งย้ายงาน (Transfer API)
  const handleTransfer = async (targetDeptId: number) => {
    if (!selectedQueue) return;
    try {
      await api.put(`/queues/${selectedQueue.id}/transfer`, {
        target_dept_id: targetDeptId,
        status: 'WAITING' // สถานะที่แผนกใหม่
      });
      setShowModal(false);
      // ไม่ต้อง fetch ใหม่ เพราะ Socket จะสั่งทำเอง
    } catch (err) {
      alert('ส่งงานไม่สำเร็จ');
    }
  };

  // 5. จบงาน (ส่งกลับบ้าน)
  const handleComplete = async () => {
     if (!selectedQueue) return;
     if(!confirm('ยืนยันจบงานคิวนี้?')) return;
     // TODO: ยิง API จบงาน (Phase ถัดไป) แต่ตอนนี้ใช้ Transfer ไปแผนกอื่นก่อนได้
     alert("ฟังก์ชันจบงานจะมาในส่วนถัดไป");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
           <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Station</div>
           <div className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
             {stationName}
           </div>
        </div>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-slate-500 hover:text-red-500 underline">
          เปลี่ยนจุดปฏิบัติงาน
        </button>
      </header>

      {/* Main Content */}
      <main className="p-8 max-w-7xl mx-auto w-full">
        {queues.length === 0 ? (
          <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-200">
            <RefreshCw size={48} className="mx-auto mb-4 opacity-20" />
            <p>ยังไม่มีคิวงานเข้ามาในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queues.map((q) => (
              <div key={q.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col">
                 <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">{q.type_name}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {new Date(q.created_at).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})}
                    </span>
                 </div>
                 
                 <div className="text-5xl font-black text-slate-800 mb-2 tracking-tight">{q.queue_number}</div>
                 
                 <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
                    <User size={16} /> {q.role_name}
                 </div>

                 <div className="mt-auto pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => openTransferModal(q)}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      จัดการ / ส่งต่อ <ArrowRight size={18} />
                    </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="bg-slate-900 text-white p-6">
                <h3 className="text-xl font-bold">ส่งต่องาน</h3>
                <p className="text-slate-400 text-sm">คิวหมายเลข {selectedQueue?.queue_number}</p>
             </div>
             
             <div className="p-6">
                <p className="text-slate-700 font-semibold mb-4">เลือกปลายทาง:</p>
                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
                   {targetDepts.map((dept) => (
                     <button
                       key={dept.id}
                       onClick={() => handleTransfer(dept.id)}
                       className="flex items-center p-4 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-500 transition-all text-left"
                     >
                        <div className="flex-1 font-semibold text-slate-700">{dept.name}</div>
                        <ArrowRight size={16} className="text-slate-300" />
                     </button>
                   ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                   <button 
                     onClick={() => setShowModal(false)}
                     className="flex-1 py-3 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl"
                   >
                     ยกเลิก
                   </button>
                   {/* ปุ่มจบงานชั่วคราว */}
                   {/* <button className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700">จบงาน</button> */}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}