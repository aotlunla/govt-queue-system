'use client';

import { useEffect, useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { api } from '@/lib/api';
import { RefreshCcw, Ticket, Loader2, ChevronLeft, User } from 'lucide-react';
import { QueueTicketPrint } from '@/components/QueueTicketPrint';
import { DynamicLogo } from '@/components/DynamicLogo';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

interface QueueType {
  id: number;
  name: string;
  code: string;
  badge_color: string;
}
interface CaseRole { id: number; name: string; badge_color?: string; }

interface KioskSettings {
  title_type: string;
  title_role: string;
  icon_size: 'small' | 'medium' | 'large' | 'auto';
  font_size: 'small' | 'medium' | 'large' | 'auto';
  grid_columns: 'auto' | '1' | '2' | '3' | '4';
  grid_gap: 'small' | 'medium' | 'large';
}

const defaultKioskSettings: KioskSettings = {
  title_type: 'กรุณาเลือกประเภทบริการ',
  title_role: 'กรุณาระบุสถานะของผู้ติดต่อ',
  icon_size: 'auto',
  font_size: 'auto',
  grid_columns: 'auto',
  grid_gap: 'medium'
};

// ฟังก์ชันสำหรับส่งคำสั่งปริ้นแบบเงียบ
async function sendToSilentPrint(base64String: string) {
  try {
    const response = await fetch('http://localhost:3003/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Pdf: base64String // ส่งไฟล์ PDF ในรูปแบบ Base64
      })
    });

    const result = await response.json();
    if (result.status === "Success") {
      console.log("ปริ้นสำเร็จ!");
    } else {
      console.error("เกิดข้อผิดพลาด:", result.message);
    }
  } catch (error) {
    console.error("เชื่อมต่อ Print Server ไม่ได้:", error);
  }
}

export default function KioskPage() {
  const [types, setTypes] = useState<QueueType[]>([]);
  const [roles, setRoles] = useState<CaseRole[]>([]);
  const [selectedType, setSelectedType] = useState<QueueType | null>(null);
  const [loading, setLoading] = useState(false);

  // State for new ticket
  const [ticket, setTicket] = useState<{ id: number, queue_number: string } | null>(null);
  const [trackingUrl, setTrackingUrl] = useState('');

  // Printing State
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStep, setPrintStep] = useState<'idle' | 'printing' | 'success'>('idle');

  // Settings (Logo, Agency Name)
  const [agencyName, setAgencyName] = useState('ศูนย์บริการภาครัฐ');
  const [footerText, setFooterText] = useState('');

  // Kiosk Settings
  const [kioskSettings, setKioskSettings] = useState<KioskSettings>(defaultKioskSettings);

  // Print Component Ref
  const printRef = useRef<HTMLDivElement>(null);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/queues/config');
      setTypes(res.data.types);
      setRoles(res.data.roles);
    } catch (err) { console.error(err); }
  };

  const fetchSettings = async () => {
    try {
      const [settingsRes, kioskRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/kiosk-settings')
      ]);
      if (settingsRes.data.agency_name) setAgencyName(settingsRes.data.agency_name);
      if (settingsRes.data.footer_text) setFooterText(settingsRes.data.footer_text);
      setKioskSettings({ ...defaultKioskSettings, ...kioskRes.data });
    } catch (err) { console.error(err); }
  };

  const resetFlow = () => {
    setSelectedType(null);
    setTicket(null);
    setLoading(false);
    setPrintStep('idle');
    setIsPrinting(false);
  };

  useEffect(() => {
    // Responsive font base
    const handleResize = () => {
      if (window.innerWidth < 768) {
        document.documentElement.style.fontSize = '14px';
      } else {
        document.documentElement.style.fontSize = '16px';
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Init

    const initData = async () => {
      await Promise.all([
        fetchConfig(),
        fetchSettings()
      ]);
      setTrackingUrl(window.location.origin);
    };
    initData();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.documentElement.style.fontSize = '';
    };
  }, []);

  const handleSilentPrint = async () => {
    if (!printRef.current) {
      console.error("Print ref not found");
      return;
    }

    try {
      // Wait a bit for DOM to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find the two slips
      const slips = printRef.current.querySelectorAll('.ticket-slip');
      if (slips.length < 2) {
        console.error("Could not find both ticket slips");
        alert("เกิดข้อผิดพลาดในการจับภาพบัตรคิว");
        setPrintStep('idle');
        setLoading(false);
        return;
      }

      // Defined output width (mm) - slightly less than 80mm to safe margin
      const contentWidth = 72;
      const xOffset = (80 - contentWidth) / 2; // = 4mm margin

      // Capture Slip 1 (Visitor) first to get dimensions
      const canvas1 = await html2canvas(slips[0] as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 378
      });
      const imgData1 = canvas1.toDataURL('image/png');
      const calcHeight1 = (canvas1.height * contentWidth) / canvas1.width;
      const pdfHeight1 = Math.max(calcHeight1, 80); // Min height 80mm to prevent rotation

      // Initialize PDF with the exact height of the first page + small padding if needed
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [80, pdfHeight1]
      });

      pdf.addImage(imgData1, 'PNG', xOffset, 0, contentWidth, calcHeight1);

      // Capture Slip 2 (Officer)
      const canvas2 = await html2canvas(slips[1] as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 378
      });
      const imgData2 = canvas2.toDataURL('image/png');
      const calcHeight2 = (canvas2.height * contentWidth) / canvas2.width;
      const pdfHeight2 = Math.max(calcHeight2, 80); // Min height 80mm to prevent rotation

      pdf.addPage([80, pdfHeight2], 'p');
      pdf.addImage(imgData2, 'PNG', xOffset, 0, contentWidth, calcHeight2);

      const base64Pdf = pdf.output('datauristring').split(',')[1];

      await sendToSilentPrint(base64Pdf);
      setPrintStep('success');

      setTimeout(() => {
        resetFlow();
      }, 3000);

    } catch (err) {
      console.error("Silent print generation failed:", err);
      alert("การพิมพ์ล้มเหลว");
      setPrintStep('idle');
      setLoading(false);
    }
  };

  const handleCreateQueue = async (roleId: number) => {
    if (!selectedType) return;
    setLoading(true);
    setIsPrinting(true);
    setPrintStep('printing');

    try {
      const res = await api.post('/queues/create', { type_id: selectedType.id, role_id: roleId });
      setTicket(res.data);

      // Trigger silent print after state update
      // We use a small timeout to let React render the ticket into the DOM
      setTimeout(() => {
        handleSilentPrint();
      }, 500);

    } catch {
      alert("เกิดข้อผิดพลาดในการสร้างคิว");
      setLoading(false);
      setIsPrinting(false);
    }
  };

  // Dynamic grid calculation based on count  // Get grid style with auto-fill rows to fill available viewport
  const getGridStyle = (count: number): React.CSSProperties => {
    if (count <= 0) return {};

    // Calculate gap based on settings
    const gapMap = { small: '0.5rem', medium: '1rem', large: '1.5rem' };
    const gap = gapMap[kioskSettings.grid_gap] || '1rem';

    // For mobile, single column
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: gap,
        gridAutoRows: 'minmax(100px, 1fr)'
      };
    }

    // Calculate columns
    let cols: number;
    if (kioskSettings.grid_columns !== 'auto') {
      cols = parseInt(kioskSettings.grid_columns);
    } else {
      // Auto calculate based on count
      if (count === 1) cols = 1;
      else if (count === 2) cols = 2;
      else if (count <= 4) cols = 2;
      else if (count <= 6) cols = 3;
      else if (count <= 9) cols = 3;
      else cols = 4;
    }

    // Calculate rows needed
    const rows = Math.ceil(count / cols);

    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: gap,
      height: '100%'
    };
  };

  // Dynamic font size based on item count and settings
  const getCardFontSize = (count: number) => {
    if (kioskSettings.font_size === 'small') return 'text-sm md:text-base';
    if (kioskSettings.font_size === 'medium') return 'text-base md:text-xl';
    if (kioskSettings.font_size === 'large') return 'text-xl md:text-3xl';
    // Auto mode
    if (count <= 2) return 'text-xl md:text-3xl';
    if (count <= 4) return 'text-lg md:text-2xl';
    if (count <= 6) return 'text-base md:text-xl';
    if (count <= 9) return 'text-sm md:text-lg';
    return 'text-sm md:text-base';
  };

  // Dynamic icon size based on item count and settings
  const getIconSize = (count: number) => {
    if (kioskSettings.icon_size === 'small') return 'w-10 h-10 md:w-14 md:h-14';
    if (kioskSettings.icon_size === 'medium') return 'w-14 h-14 md:w-20 md:h-20';
    if (kioskSettings.icon_size === 'large') return 'w-20 h-20 md:w-28 md:h-28';
    // Auto mode
    if (count <= 2) return 'w-20 h-20 md:w-28 md:h-28';
    if (count <= 4) return 'w-16 h-16 md:w-24 md:h-24';
    if (count <= 6) return 'w-14 h-14 md:w-20 md:h-20';
    if (count <= 9) return 'w-12 h-12 md:w-16 md:h-16';
    return 'w-10 h-10 md:w-14 md:h-14';
  };

  // Dynamic code text size
  const getCodeSize = (count: number) => {
    if (kioskSettings.font_size === 'small') return 'text-lg md:text-2xl';
    if (kioskSettings.font_size === 'medium') return 'text-2xl md:text-4xl';
    if (kioskSettings.font_size === 'large') return 'text-4xl md:text-6xl';
    // Auto mode
    if (count <= 2) return 'text-4xl md:text-6xl';
    if (count <= 4) return 'text-3xl md:text-5xl';
    if (count <= 6) return 'text-2xl md:text-4xl';
    if (count <= 9) return 'text-xl md:text-3xl';
    return 'text-lg md:text-2xl';
  };

  const typeGridStyle = getGridStyle(types.length);
  const roleGridStyle = getGridStyle(roles.length);

  return (
    <div className={`h-[100dvh] bg-slate-50 flex flex-col overflow-hidden relative ${GeistSans.className}`}>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-60">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-200/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-pink-200/40 rounded-full blur-[120px]"></div>
      </div>

      {/* 1. Printing Modal */}
      {isPrinting && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-3xl flex flex-col items-center justify-center text-slate-900 animate-in fade-in duration-500">
          <div className="flex flex-col items-center justify-center py-20 scale-125">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50">
              {printStep === 'success' ? (
                <div className="text-[#e72289] animate-in zoom-in duration-300">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              ) : (
                <div className="text-[#e72289] animate-spin">
                  <Loader2 size={80} />
                </div>
              )}
            </div>
            <h2 className={`text-5xl md:text-7xl font-bold text-slate-900 mb-4 tracking-tighter ${GeistMono.className}`}>
              {ticket ? ticket.queue_number : 'กำลังพิมพ์...'}
            </h2>
            <p className="text-slate-500 text-xl md:text-2xl font-medium">
              {printStep === 'success' ? 'กรุณารับบัตรคิว' : 'กำลังพิมพ์บัตรคิว...'}
            </p>
          </div>
        </div>
      )}

      {/* 2. Hidden Print Component (For Silent Print Capture) */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', width: '80mm', background: 'white' }}>
        <QueueTicketPrint
          ref={printRef}
          ticket={ticket!}
          queueType={selectedType}
          roleName={roles.find(r => r.name)?.name || 'ผู้ติดต่อ'}
          trackingUrl={trackingUrl}
          className="block" // Force block display for capture
        />
      </div>

      {/* 3. Kiosk UI */}
      <header className="bg-white/60 backdrop-blur-xl shadow-sm px-4 md:px-8 py-4 md:py-6 flex justify-between items-center z-20 border-b border-white/40 flex-none h-[80px] md:h-[100px]">
        <div className="flex items-center gap-4 md:gap-6">
          <DynamicLogo
            fallbackIcon={<Ticket size={24} className="md:w-8 md:h-8 text-white" />}
          />
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">ระบบบัตรคิวอัตโนมัติ</h1>
            <p className="text-slate-500 text-sm md:text-lg font-medium">ยินดีต้อนรับสู่{agencyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="text-right hidden md:block">
            <div className={`text-2xl md:text-3xl font-bold text-slate-800 ${GeistMono.className}`}>{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-xs md:text-sm text-slate-500 font-medium">{new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-3 md:p-4 clay-btn-secondary rounded-2xl transition-all text-slate-500 hover:text-[#e72289] active:scale-95"
          >
            <RefreshCcw size={24} className="md:w-7 md:h-7" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 w-full flex flex-col min-h-0 overflow-hidden overflow-y-auto">
        {!selectedType ? (
          <div className="flex flex-col h-full">
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-4 md:mb-6 text-center flex-none drop-shadow-sm">{kioskSettings.title_type}</h2>

            <div className="grid flex-1 min-h-0 content-start" style={typeGridStyle}>
              {types.map((type, index) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type)}
                  className="relative overflow-hidden clay-card clay-card-hover w-full h-full flex flex-col items-center justify-center group hover:shadow-lg transition-all"
                  style={{
                    animationDelay: `${index * 80}ms`,
                    backgroundColor: type.badge_color ? `${type.badge_color}12` : 'rgba(255, 255, 255, 0.8)'
                  }}
                >
                  <div className="relative z-10 flex flex-col items-center justify-center p-3 md:p-5 w-full h-full">
                    {/* Code Badge */}
                    <div
                      className={`${getIconSize(types.length)} rounded-2xl md:rounded-3xl flex items-center justify-center mb-3 md:mb-4 border-2 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}
                      style={{
                        backgroundColor: type.badge_color ? `${type.badge_color}20` : '#f1f5f9',
                        borderColor: type.badge_color ? `${type.badge_color}40` : '#e2e8f0'
                      }}
                    >
                      <span className={`${getCodeSize(types.length)} font-black ${GeistMono.className}`} style={{ color: type.badge_color || '#334155' }}>{type.code}</span>
                    </div>

                    {/* Type Name - Always visible */}
                    <div className="flex-1 flex items-center justify-center w-full min-h-[2.5rem] md:min-h-[3rem]">
                      <span className={`${getCardFontSize(types.length)} font-bold text-center leading-tight text-slate-800 px-2 group-hover:text-[#e72289] transition-colors`}>
                        {type.name || 'ประเภทบริการ'}
                      </span>
                    </div>

                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 md:mb-8 flex-none px-2 gap-4">
              <button
                onClick={() => setSelectedType(null)}
                className="group flex items-center gap-2 md:gap-3 px-8 md:px-10 py-4 md:py-5 clay-btn-secondary rounded-full text-slate-600 font-bold text-lg md:text-xl hover:text-[#e72289] transition-all w-full md:w-auto justify-center"
              >
                <div className="bg-slate-100 p-2 rounded-full group-hover:bg-pink-50 transition-colors">
                  <ChevronLeft size={24} className="md:w-6 md:h-6" />
                </div>
                <span>ย้อนกลับ</span>
              </button>

              <div className="flex items-center gap-4 md:gap-6 clay-card px-6 md:px-10 py-3 md:py-4 rounded-full animate-in slide-in-from-right-8 duration-500 w-full md:w-auto justify-center md:justify-start bg-white/80">
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-white text-2xl md:text-4xl font-black shadow-inner"
                  style={{ backgroundColor: selectedType.badge_color || '#e72289' }}>
                  {selectedType.code}
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-1">บริการที่เลือก</p>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-none">{selectedType.name}</h2>
                </div>
              </div>
            </div>

            <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-4 md:mb-6 text-center flex-none drop-shadow-sm">{kioskSettings.title_role}</h2>

            <div className="grid flex-1 min-h-0 content-start" style={roleGridStyle}>
              {roles.map((role, index) => (
                <button
                  key={role.id}
                  onClick={() => handleCreateQueue(role.id)}
                  disabled={loading}
                  className="relative overflow-hidden clay-card clay-card-hover p-4 md:p-6 flex flex-col items-center justify-center group animate-in fade-in zoom-in duration-500 w-full h-full hover:shadow-lg transition-all"
                  style={{
                    animationDelay: `${index * 80}ms`,
                    backgroundColor: role.badge_color ? `${role.badge_color}12` : 'rgba(255, 255, 255, 0.8)'
                  }}
                >
                  {/* Icon */}
                  <div
                    className={`${getIconSize(roles.length)} rounded-2xl md:rounded-3xl flex items-center justify-center mb-3 md:mb-4 transition-all shadow-sm border flex-shrink-0 group-hover:scale-105 duration-300`}
                    style={{
                      backgroundColor: role.badge_color ? `${role.badge_color}20` : '#f1f5f9',
                      borderColor: role.badge_color ? `${role.badge_color}40` : '#e2e8f0'
                    }}
                  >
                    <User
                      className={`${roles.length <= 4 ? 'w-8 h-8 md:w-12 md:h-12' : roles.length <= 6 ? 'w-6 h-6 md:w-10 md:h-10' : 'w-5 h-5 md:w-8 md:h-8'} transition-colors`}
                      style={{ color: role.badge_color || '#64748b' }}
                    />
                  </div>

                  {/* Role Name - Always visible */}
                  <div className="flex-1 flex items-center justify-center w-full min-h-[2.5rem] md:min-h-[3rem]">
                    <span
                      className={`${getCardFontSize(roles.length)} font-bold text-center leading-tight px-2 transition-colors`}
                      style={{ color: role.badge_color || '#1e293b' }}
                    >
                      {role.name || 'ผู้ติดต่อ'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="p-4 md:p-6 text-center text-slate-400 text-xs md:text-sm font-medium flex-none bg-white/40 backdrop-blur-md border-t border-white/30">
        © {new Date().getFullYear()} {footerText || 'Developed by Antigravity'}
      </footer>
    </div>
  );
}