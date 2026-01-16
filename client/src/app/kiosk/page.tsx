'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { RefreshCcw, Printer } from 'lucide-react'; // เพิ่ม icon printer
import { QRCodeSVG } from 'qrcode.react';

interface QueueType { id: number; name: string; code: string; badge_color: string; }
interface CaseRole { id: number; name: string; }

export default function KioskPage() {
  const [types, setTypes] = useState<QueueType[]>([]);
  const [roles, setRoles] = useState<CaseRole[]>([]);
  const [selectedType, setSelectedType] = useState<QueueType | null>(null);
  const [loading, setLoading] = useState(false);
  
  // State สำหรับคิวที่เพิ่งสร้าง
  const [ticket, setTicket] = useState<{ id: number, queue_number: string } | null>(null);
  const [trackingUrl, setTrackingUrl] = useState('');
  
  // State ควบคุมหน้าจอ "กำลังพิมพ์"
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchConfig();
    // แก้เป็น IP เครื่อง Server จริงเพื่อให้มือถือสแกนได้
    setTrackingUrl(window.location.origin); 
  }, []);

  // Logic การสั่งพิมพ์และ Reset หน้าจอ
  useEffect(() => {
    if (ticket) {
      setIsPrinting(true); // 1. ขึ้นหน้าจอเตือน "กำลังพิมพ์"

      // 2. หน่วงเวลาเล็กน้อยเพื่อให้หน้าจอ Render ข้อมูลบัตรที่จะพิมพ์เสร็จก่อน
      setTimeout(() => {
        window.print(); // 3. สั่ง Print (จะออกมา 2 ใบตาม CSS Page Break)
      }, 1000);

      // 4. ตรวจจับว่า Print เสร็จหรือปิดหน้าต่าง Print แล้ว -> กลับหน้าแรก
      const handleAfterPrint = () => {
        setIsPrinting(false);
        resetFlow();
      };

      window.addEventListener('afterprint', handleAfterPrint);
      return () => window.removeEventListener('afterprint', handleAfterPrint);
    }
  }, [ticket]);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/queues/config');
      setTypes(res.data.types);
      setRoles(res.data.roles);
    } catch (err) { console.error(err); }
  };

  const handleCreateQueue = async (roleId: number) => {
    if (!selectedType) return;
    setLoading(true);
    try {
      const res = await api.post('/queues/create', { type_id: selectedType.id, role_id: roleId });
      setTicket(res.data);
    } catch (err) { alert("เกิดข้อผิดพลาด"); setLoading(false); }
  };

  const resetFlow = () => {
    setSelectedType(null);
    setTicket(null);
    setLoading(false);
  };

  // ----------------------------------------------------------------
  // ส่วนแสดงผล (UI)
  // ----------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* 1. Modal แจ้งเตือน "กำลังพิมพ์" (แสดงทับหน้าจอเมื่อ isPrinting = true) */}
      {isPrinting && ticket && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white print:hidden">
          <div className="bg-white text-slate-900 p-10 rounded-3xl flex flex-col items-center shadow-2xl animate-in zoom-in duration-300 max-w-lg w-full text-center">
            <div className="bg-blue-100 p-6 rounded-full mb-6 animate-pulse">
               <Printer size={64} className="text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold mb-2">กำลังพิมพ์บัตรคิว...</h2>
            <div className="text-6xl font-black text-blue-600 my-4">{ticket.queue_number}</div>
            <p className="text-xl text-red-500 font-semibold bg-red-50 px-6 py-2 rounded-lg border border-red-100">
              กรุณารอรับบัตร 2 ใบ
            </p>
          </div>
        </div>
      )}

      {/* 2. ส่วนที่จะถูก Print (ซ่อนจากหน้าจอปกติ แสดงเฉพาะตอนสั่ง Print) */}
      {ticket && (
        <div className="hidden print:block bg-white text-black" style={{ width: '80mm', fontSize: '12px' }}>
           
           {/* === ใบที่ 1: ผู้ติดต่อ (มี QR) === */}
           <div style={{ pageBreakAfter: 'always', paddingBottom: '10px' }}>
               <div className="text-center mb-2">
                  <h1 className="text-lg font-bold">บัตรคิว (ผู้ติดต่อ)</h1>
                  <p>สำนักงานบังคับคดี</p>
               </div>
               <div className="text-center my-4 border-y-2 border-black py-4">
                  <div className="text-lg font-bold">{selectedType?.name}</div>
                  <div className="text-6xl font-black my-2">{ticket.queue_number}</div>
                  <div className="text-sm">({roles.find(r => r.name)?.name || 'ผู้ติดต่อ'})</div>
               </div>
               <div className="flex flex-col items-center justify-center gap-1 mb-2">
                  <QRCodeSVG value={`${trackingUrl}/tracking/${ticket.id}`} size={100} />
                  <p className="text-[10px] mt-1">สแกนเพื่อติดตามคิว</p>
               </div>
               <div className="text-center text-[10px]">
                  {new Date().toLocaleDateString('th-TH')} {new Date().toLocaleTimeString('th-TH')}
               </div>
           </div>

           {/* === ใบที่ 2: เจ้าหน้าที่ (ไม่มี QR) === */}
           <div style={{ paddingTop: '10px' }}>
               <div className="text-center mb-2">
                  <h1 className="text-lg font-bold">บัตรคิว (เจ้าหน้าที่)</h1>
                  <p>สำหรับติดแฟ้ม/เรียกขาน</p>
               </div>
               <div className="text-center my-4 border-y-2 border-black py-4">
                  <div className="text-lg font-bold">{selectedType?.name}</div>
                  <div className="text-6xl font-black my-2">{ticket.queue_number}</div>
                  <div className="text-sm">เจ้าหน้าที่รับเรื่อง</div>
               </div>
               <div className="text-center text-[10px] mt-4">
                  {new Date().toLocaleDateString('th-TH')} {new Date().toLocaleTimeString('th-TH')}
               </div>
           </div>
        </div>
      )}

      {/* 3. หน้าจอหลัก (Main Menu) - แสดงเมื่อไม่ได้ Print */}
      <header className="bg-slate-900 text-white p-6 shadow-lg flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold">ระบบบัตรคิว</h1>
        <button onClick={() => window.location.reload()} className="p-2 bg-slate-700 rounded-lg"><RefreshCcw /></button>
      </header>

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full flex flex-col gap-8 print:hidden">
        {!selectedType ? (
            <div className="grid grid-cols-2 gap-6 h-full">
              {types.map((type) => (
                <button key={type.id} onClick={() => setSelectedType(type)} className="bg-white hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-8 shadow-sm transition-all flex flex-col items-center justify-center gap-4 group">
                  <span className="text-6xl p-4 bg-slate-100 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">{type.code}</span>
                  <span className="text-3xl font-bold text-slate-700 group-hover:text-blue-700">{type.name}</span>
                </button>
              ))}
            </div>
        ) : (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-slate-700">เลือกสถานะ ({selectedType.name})</h2>
                <button onClick={() => setSelectedType(null)} className="text-slate-500 underline">ย้อนกลับ</button>
              </div>
              <div className="grid grid-cols-2 gap-6 flex-1">
                {roles.map((role) => (
                  <button key={role.id} onClick={() => handleCreateQueue(role.id)} disabled={loading} className="bg-white hover:bg-green-50 border-2 border-slate-200 hover:border-green-500 rounded-2xl p-8 shadow-sm transition-all flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-slate-700">{role.name}</span>
                  </button>
                ))}
              </div>
            </div>
        )}
      </main>
    </div>
  );
}