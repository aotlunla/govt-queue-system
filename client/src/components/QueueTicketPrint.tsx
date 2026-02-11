import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

import { api } from '@/lib/api';

interface QueueTicketPrintProps {
  ticket: { id: number, queue_number: string };
  queueType: { name: string } | null;
  roleName: string;
  trackingUrl: string;
}

export const QueueTicketPrint = React.forwardRef<HTMLDivElement, QueueTicketPrintProps & { className?: string }>(
  ({ ticket, queueType, roleName, trackingUrl, className }, ref) => {
    const [orgName, setOrgName] = React.useState('สนง.บังคับคดี จ.นนทบุรี');

    React.useEffect(() => {
      const fetchSettings = async () => {
        try {
          const res = await api.get('/admin/settings');
          if (res.data.agency_name) setOrgName(res.data.agency_name);
        } catch (err) {
          console.error('Failed to fetch settings:', err);
        }
      };
      fetchSettings();
    }, []);

    if (!ticket) return null;

    return (
      <div ref={ref} className={`bg-white text-black font-mono text-sm leading-tight ${className || 'hidden print:block'}`}>
        <style jsx global>{`
          /* Always apply these styles so html2canvas can see them */
          .print-container {
            width: 72mm;
            padding: 0;
            margin: 0 auto;
            background: white;
            box-sizing: border-box;
          }
          .ticket-slip {
            width: 100%;
            padding: 4px 0 10px 0;
            border-bottom: 1px dashed #000;
            box-sizing: border-box;
          }
          .dashed-line {
            border-top: 1px dashed #000;
            margin: 10px 0;
            width: 100%;
          }
          /* Print-specific overrides */
          @media print {
            @page { margin: 0; }
            body { margin: 0; padding: 0; width: 80mm; }
            .ticket-slip { page-break-after: always; break-after: page; }
            .ticket-slip:last-child { page-break-after: avoid; break-after: avoid; border-bottom: none; }
            .force-break { page-break-before: always; break-before: page; height: 1px; display: block; width: 100%; }
          }
      `}</style>

        <div className="print-container">
          {/* === Slip 1: Visitor === */}
          <div className="ticket-slip">
            <div className="text-center font-bold text-sm mb-1">บัตรคิว (ผู้ติดต่อ)</div>
            <div className="text-center text-[8px] mb-2">{orgName}</div>
            <div className="text-center py-1">
              <div className="text-[10px] font-bold mb-0.5">{queueType?.name}</div>
              <div className="text-3xl font-black my-1">{ticket.queue_number}</div>
              <div className="text-[9px]">({roleName})</div>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 my-2">
              {(() => {
                // Generate Tracking Code: YYMMDD + QueueNumber
                const now = new Date();
                const yy = String(now.getFullYear()).slice(-2);
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const trackingCode = `${yy}${mm}${dd}${ticket.queue_number}`;

                return <QRCodeSVG value={`${trackingUrl}/tracking/${trackingCode}`} size={80} />;
              })()}
              <div className="text-[8px] mt-0.5">สแกนเพื่อติดตามคิว</div>
            </div>
            <div className="text-center text-[8px]">
              {new Date().toLocaleDateString('th-TH')} {new Date().toLocaleTimeString('th-TH')}
            </div>
          </div>

          {/* === Slip 2: Officer === */}
          <div className="ticket-slip" style={{ borderBottom: 'none', paddingTop: '10px' }}>
            <div className="text-center font-bold text-sm mb-1">บัตรคิว (เจ้าหน้าที่)</div>
            <div className="text-center text-[8px] mb-2">{orgName}</div>
            <div className="text-center py-1">
              <div className="text-[10px] font-bold mb-0.5">{queueType?.name}</div>
              <div className="text-3xl font-black my-1">{ticket.queue_number}</div>
              <div className="text-[9px]">เจ้าหน้าที่รับเรื่อง</div>
            </div>
            <div className="text-center text-[8px] mt-2">
              {new Date().toLocaleDateString('th-TH')} {new Date().toLocaleTimeString('th-TH')}
            </div>
          </div>
        </div>
      </div>
    );
  });
QueueTicketPrint.displayName = 'QueueTicketPrint';
