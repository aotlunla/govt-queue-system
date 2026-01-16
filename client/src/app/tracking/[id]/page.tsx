// src/app/tracking/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { RefreshCw } from 'lucide-react';

export default function TrackingPage() {
  const params = useParams();
  const queueId = params.id;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // เราต้องเพิ่ม API เส้นนี้ใน Server ภายหลัง (หรือใช้เส้นเดิมถ้าแก้ query)
      // เบื้องต้นใช้เส้น debug หรือสร้างเส้นใหม่
      // สมมติว่าใช้เส้น GET /queues/:id
       const res = await api.get(`/queues/${queueId}`); 
       setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto refresh ทุก 10 วินาที
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [queueId]);

  if (loading && !data) return <div className="p-8 text-center">กำลังโหลด...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">ไม่พบข้อมูลคิวนี้</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center text-white">
          <h1 className="text-xl font-bold">ติดตามสถานะ</h1>
          <p className="opacity-80">สำนักงานบังคับคดี</p>
        </div>
        
        <div className="p-8 text-center">
          <p className="text-gray-500 mb-2">หมายเลขคิวของคุณ</p>
          <div className="text-6xl font-black text-slate-800 mb-6 tracking-wider">
            {data.queue_number}
          </div>
          
          <div className="py-4 px-6 bg-blue-50 rounded-xl border border-blue-100 mb-6">
            <span className="block text-sm text-gray-500 mb-1">สถานะปัจจุบัน</span>
            <span className="text-2xl font-bold text-blue-700">
              {data.status_id === 'ISSUED' && 'รอเรียกคิว'}
              {data.status_id === 'WAITING_FILE' && 'กำลังค้นหาสำนวน'}
              {data.status_id === 'FILE_READY' && 'พบสำนวนแล้ว'}
              {data.status_id === 'CALLED' && 'กำลังให้บริการ'}
              {data.status_id === 'COMPLETED' && 'เสร็จสิ้น'}
            </span>
          </div>

          <button 
            onClick={fetchStatus} 
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
          >
            <RefreshCw size={18} /> อัปเดตสถานะล่าสุด
          </button>
        </div>
      </div>
      <p className="mt-8 text-gray-400 text-sm">ระบบจะอัปเดตอัตโนมัติทุก 10 วินาที</p>
    </div>
  );
}