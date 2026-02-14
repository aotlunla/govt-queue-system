'use client';

import { useState, useEffect } from 'react';
import { Save, Globe, type LucideIcon, Type, Building2, Clock, Image as ImageIcon, FileText } from 'lucide-react';
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { api } from '@/lib/api';
import { GeistSans } from 'geist/font/sans';


export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [orgName, setOrgName] = useState('');

    // Announcement State


    // Overdue Alert State
    const [overdueAlertMinutes, setOverdueAlertMinutes] = useState<number | ''>(0);
    const [overdueAlertEnabled, setOverdueAlertEnabled] = useState(false);

    // Logo and Footer State
    const [logoUrl, setLogoUrl] = useState('');
    const [footerText, setFooterText] = useState('');

    // Turnstile State
    const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
    const [turnstileSecretKey, setTurnstileSecretKey] = useState('');
    const [turnstileEnabled, setTurnstileEnabled] = useState(true);

    // Load settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Use the protected endpoint to get all settings including secrets
                const res = await api.get('/admin/system-settings');
                if (res.data.agency_name) setOrgName(res.data.agency_name);

                if (res.data.overdue_alert_minutes !== undefined) {
                    setOverdueAlertMinutes(res.data.overdue_alert_minutes);
                    setOverdueAlertEnabled(res.data.overdue_alert_minutes > 0);
                }
                if (res.data.logo_url) setLogoUrl(res.data.logo_url);
                if (res.data.footer_text) setFooterText(res.data.footer_text);
                if (res.data.turnstile_site_key) setTurnstileSiteKey(res.data.turnstile_site_key);
                if (res.data.turnstile_secret_key) setTurnstileSecretKey(res.data.turnstile_secret_key);
                // Default to true if undefined
                if (res.data.turnstile_enabled !== undefined) setTurnstileEnabled(!!res.data.turnstile_enabled);
                else setTurnstileEnabled(true);
            } catch (err) {
                console.error('Failed to fetch settings:', err);
                // Fallback to public endpoint if protected fails?
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);

        try {
            await api.put('/admin/settings', {
                agency_name: orgName,

                overdue_alert_minutes: overdueAlertEnabled ? (overdueAlertMinutes === '' ? 0 : overdueAlertMinutes) : 0,
                logo_url: logoUrl,
                footer_text: footerText,
                turnstile_site_key: turnstileSiteKey,
                turnstile_secret_key: turnstileSecretKey,
                turnstile_enabled: turnstileEnabled
            });
            alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700 ${GeistSans.className}`}>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                        <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800">ตั้งค่าเว็บไซต์</h1>
                        <p className="text-sm text-slate-500">จัดการข้อมูลทั่วไปและการแสดงผลของเว็บไซต์</p>
                    </div>
                </div>
                <button
                    onClick={() => handleSave()}
                    disabled={loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                    บันทึกการตั้งค่า
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* General Settings */}
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/60 hover:shadow-xl hover:border-pink-200 transition-all duration-300 group">
                    <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h2 className="font-black text-xl text-slate-900">ข้อมูลทั่วไป</h2>
                            <p className="text-sm font-medium text-slate-500">ชื่อเว็บไซต์และรายละเอียดพื้นฐาน</p>
                        </div>
                    </div>

                    <div className="space-y-6 mt-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">ชื่อหน่วยงาน / องค์กร</label>
                            <div className="relative group/input">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors" size={20} />
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    placeholder="เช่น สำนักงานเขต..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">คำอธิบายเว็บไซต์ (Meta Description)</label>
                            <textarea
                                className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium resize-none h-32 text-slate-700"
                                defaultValue="ระบบจองคิวออนไลน์ ให้บริการประชาชน สะดวก รวดเร็ว ทันสมัย"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Turnstile Settings */}
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/60 hover:shadow-xl hover:border-pink-200 transition-all duration-300 group">
                    <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <div>
                            <h2 className="font-black text-xl text-slate-900">Cloudflare Turnstile</h2>
                            <p className="text-sm font-medium text-slate-500">ตั้งค่าระบบป้องกัน Spam (Captcha)</p>
                        </div>
                        <div className="ml-auto">
                            <ToggleSwitch
                                checked={turnstileEnabled}
                                onChange={setTurnstileEnabled}
                                label="Enable Turnstile"
                                color="#f97316" // Orange like before
                            />
                        </div>
                    </div>

                    <div className={`space-y-6 mt-6 transition-all duration-300 ${turnstileEnabled ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Site Key</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium text-slate-700"
                                value={turnstileSiteKey}
                                onChange={(e) => setTurnstileSiteKey(e.target.value)}
                                placeholder="0x4AAAAAA..."
                                disabled={!turnstileEnabled}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Secret Key</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium text-slate-700"
                                value={turnstileSecretKey}
                                onChange={(e) => setTurnstileSecretKey(e.target.value)}
                                placeholder="0x4AAAAAA..."
                                disabled={!turnstileEnabled}
                            />
                            <p className="text-xs text-slate-400 font-medium mt-2">
                                * หากไม่ระบุ จะใช้ค่า Test Key สำหรับการทดสอบ
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overdue Alert Settings */}
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/60 hover:shadow-xl hover:border-pink-200 transition-all duration-300 group">
                    <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${overdueAlertEnabled ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <Clock size={24} />
                            </div>
                            <div>
                                <h2 className="font-black text-xl text-slate-900">แจ้งเตือนคิวรอนาน</h2>
                                <p className="text-sm font-medium text-slate-500">ตั้งค่าเวลาเพื่อแจ้งเตือนเมื่อคิวรอนานเกินกำหนด</p>
                            </div>
                        </div>

                        {/* Toggle Switch */}
                        <div className="ml-auto">
                            <ToggleSwitch
                                checked={overdueAlertEnabled}
                                onChange={(checked) => {
                                    setOverdueAlertEnabled(checked);
                                    if (!checked) {
                                        setOverdueAlertMinutes(0); // Turn off, set minutes to 0
                                    } else if (overdueAlertMinutes === 0 || overdueAlertMinutes === '') {
                                        setOverdueAlertMinutes(5); // Turn on, default to 5 mins if currently 0 or empty
                                    }
                                }}
                                label="Enable Overdue Alert"
                                color="#94a3b8" // Slate-400
                            />
                        </div>
                    </div>

                    <div className={`space-y-6 mt-6 transition-all duration-300 ${overdueAlertEnabled ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">เวลาที่กำหนด (นาที)</label>
                            <div className="relative group/input">
                                <Clock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${overdueAlertEnabled ? 'text-slate-400 group-focus-within/input:text-orange-600' : 'text-slate-300'}`} size={20} />
                                <input
                                    type="number"
                                    min="0"
                                    disabled={!overdueAlertEnabled}
                                    className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                                    value={overdueAlertMinutes === 0 && !overdueAlertEnabled ? '' : overdueAlertMinutes}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '') {
                                            setOverdueAlertMinutes('');
                                        } else {
                                            setOverdueAlertMinutes(Number(val));
                                        }
                                    }}
                                    placeholder={!overdueAlertEnabled ? "ปิดการใช้งาน" : "ระบุจำนวนนาที"}
                                />
                            </div>
                            <p className="text-xs text-slate-400 font-medium mt-2">
                                * หากปิดการใช้งานจะไม่แสดงการแจ้งเตือนคิวรอนาน
                            </p>
                        </div>
                    </div>
                </div>



                {/* Logo and Footer Settings */}
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/60 hover:shadow-xl hover:border-pink-200 transition-all duration-300 group">
                    <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                            <ImageIcon size={24} />
                        </div>
                        <div>
                            <h2 className="font-black text-xl text-slate-900">โลโก้และ Footer</h2>
                            <p className="text-sm font-medium text-slate-500">ตั้งค่าโลโก้และข้อความท้ายหน้า</p>
                        </div>
                    </div>

                    <div className="space-y-6 mt-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">โลโก้หน่วยงาน (URL)</label>
                        <div className="relative group/input">
                            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-600 transition-colors" size={20} />
                            <input
                                type="url"
                                className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-800"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://example.com/logo.png"
                            />
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-2">
                            * ใส่ URL ของรูปภาพโลโก้ (แนะนำขนาด 512x512 px) สามารถใช้ลิงก์จาก Google Drive, Imgur หรือเว็บฝากรูปอื่นๆ
                        </p>
                        {logoUrl && (
                            <div className="mt-4 flex items-center gap-4 animate-in fade-in zoom-in duration-300">
                                <div className="w-20 h-20 rounded-full border border-slate-200 bg-white flex items-center justify-center overflow-hidden shadow-sm relative">
                                    <div className="absolute inset-0 opacity-20" style={{
                                        backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                                        backgroundSize: '10px 10px'
                                    }}></div>
                                    <img
                                        src={logoUrl}
                                        alt="Logo Preview"
                                        className="max-w-full max-h-full object-contain relative z-10"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">รูปภาพปัจจุบัน</p>
                                    <button
                                        type="button"
                                        onClick={() => setLogoUrl('')}
                                        className="text-xs text-pink-500 font-bold hover:underline mt-1"
                                    >
                                        ลบรูปภาพ
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">ข้อความ Footer</label>
                        <div className="relative group/input">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-600 transition-colors" size={20} />
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-800"
                                value={footerText}
                                onChange={(e) => setFooterText(e.target.value)}
                                placeholder="Developed by Antigravity"
                            />
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-2">
                            * ข้อความที่แสดงด้านล่างสุดของทุกหน้า
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
