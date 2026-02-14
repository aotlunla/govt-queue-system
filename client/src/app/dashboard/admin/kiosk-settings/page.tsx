'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Save, RotateCcw, Monitor, Type, Square, Loader2, LayoutGrid } from 'lucide-react';
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { GeistSans } from 'geist/font/sans';

interface KioskSettings {
    title_type: string;
    title_role: string;
    icon_size: 'small' | 'medium' | 'large' | 'auto';
    font_size: 'small' | 'medium' | 'large' | 'auto';
    grid_columns: 'auto' | '1' | '2' | '3' | '4';
    grid_gap: 'small' | 'medium' | 'large';
    tracking_message_calling?: string;
    tracking_message_cancelled?: string;
    tracking_message_completed?: string;
}

const defaultSettings: KioskSettings = {
    title_type: 'กรุณาเลือกประเภทบริการ',
    title_role: 'กรุณาระบุสถานะของผู้ติดต่อ',
    icon_size: 'auto',
    font_size: 'auto',
    grid_columns: 'auto',
    grid_gap: 'medium',
    tracking_message_calling: 'คิวของท่าน {queue} ถูกเรียกแล้วที่ {department} {counter} โปรดติดต่อเพื่อรับบริการ',
    tracking_message_cancelled: 'คิวของท่าน {queue} ถูกยกเลิก หากมีข้อสงสัยโปรดติดต่อเจ้าหน้าที่',
    tracking_message_completed: 'คิวของท่าน {queue} ได้รับบริการเรียบร้อยแล้ว'
};

const sizeOptions = [
    { value: 'auto', label: 'อัตโนมัติ' },
    { value: 'small', label: 'เล็ก' },
    { value: 'medium', label: 'กลาง' },
    { value: 'large', label: 'ใหญ่' },
];

const columnOptions = [
    { value: 'auto', label: 'อัตโนมัติ' },
    { value: '1', label: '1 คอลัมน์' },
    { value: '2', label: '2 คอลัมน์' },
    { value: '3', label: '3 คอลัมน์' },
    { value: '4', label: '4 คอลัมน์' },
];

const gapOptions = [
    { value: 'small', label: 'แคบ' },
    { value: 'medium', label: 'ปกติ' },
    { value: 'large', label: 'กว้าง' },
];

export default function KioskSettingsPage() {
    const [settings, setSettings] = useState<KioskSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'kiosk' | 'tracking'>('kiosk');

    // Announcement State
    const [announcementText, setAnnouncementText] = useState('');
    const [announcementStart, setAnnouncementStart] = useState('');
    const [announcementEnd, setAnnouncementEnd] = useState('');
    const [announcementActive, setAnnouncementActive] = useState(false);

    // Other system settings needed for the PUT /settings endpoint
    const [systemSettings, setSystemSettings] = useState<any>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            // Fetch ALL system settings to get both kiosk_settings and announcement_*, plus others needed for save
            const res = await api.get('/admin/system-settings');

            // Set Kiosk Settings
            if (res.data.kiosk_settings) {
                setSettings({ ...defaultSettings, ...res.data.kiosk_settings });
            }

            // Set Announcement Settings
            if (res.data.announcement_text) setAnnouncementText(res.data.announcement_text);
            if (res.data.announcement_start) setAnnouncementStart(new Date(res.data.announcement_start).toISOString().slice(0, 16));
            if (res.data.announcement_end) setAnnouncementEnd(new Date(res.data.announcement_end).toISOString().slice(0, 16));
            if (res.data.announcement_active !== undefined) setAnnouncementActive(!!res.data.announcement_active);

            // Store other settings for preservation when saving
            setSystemSettings(res.data);

        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Save Kiosk Settings
            const kioskPromise = api.put('/admin/kiosk-settings', settings);

            // 2. Save Announcement Settings (via general settings endpoint)
            // We need to send other required fields too, so we use systemSettings state
            const settingsPromise = api.put('/admin/settings', {
                ...systemSettings,
                announcement_text: announcementText,
                announcement_start: announcementStart || null,
                announcement_end: announcementEnd || null,
                announcement_active: announcementActive
            });

            await Promise.all([kioskPromise, settingsPromise]);

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save:', err);
            alert('ไม่สามารถบันทึกได้');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setSettings(defaultSettings);
        // Reset announcement settings if needed, or re-fetch
        fetchSettings();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className={`p-4 md:p-6 w-full ${GeistSans.className}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                        <Monitor className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800">ตั้งค่าหน้า Kiosk & Tracking</h1>
                        <p className="text-sm text-slate-500">ปรับแต่งหน้าจอกดบัตรคิวและหน้าติดตามสถานะ</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex-1 md:flex-none px-4 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 transition flex items-center justify-center gap-2 font-medium"
                    >
                        <RotateCcw size={18} />
                        <span className="hidden md:inline">รีเซ็ต</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saved ? 'บันทึกแล้ว!' : 'บันทึก'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('kiosk')}
                    className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'kiosk' ? 'border-pink-500 text-[#e72289]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    หน้า Kiosk
                </button>
                <button
                    onClick={() => setActiveTab('tracking')}
                    className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'tracking' ? 'border-pink-500 text-[#e72289]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    หน้า Tracking
                </button>
            </div>

            {/* Settings Content */}
            {activeTab === 'kiosk' ? (
                <div className="grid lg:grid-cols-2 gap-4 md:gap-6 animate-in fade-in duration-300">
                    {/* Title Settings */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <Type className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">ข้อความหัวเรื่อง</h2>
                                <p className="text-xs text-slate-500">ข้อความที่แสดงบนหน้า Kiosk</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    หน้าเลือกประเภทบริการ
                                </label>
                                <input
                                    type="text"
                                    value={settings.title_type}
                                    onChange={(e) => setSettings({ ...settings, title_type: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                                    placeholder="กรุณาเลือกประเภทบริการ"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    หน้าเลือกสถานะผู้ติดต่อ
                                </label>
                                <input
                                    type="text"
                                    value={settings.title_role}
                                    onChange={(e) => setSettings({ ...settings, title_role: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                                    placeholder="กรุณาระบุสถานะของผู้ติดต่อ"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Size Settings */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                                <Square className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">ขนาดไอคอนและตัวอักษร</h2>
                                <p className="text-xs text-slate-500">ปรับขนาดองค์ประกอบบนการ์ด</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    ขนาดไอคอน
                                </label>
                                <select
                                    value={settings.icon_size}
                                    onChange={(e) => setSettings({ ...settings, icon_size: e.target.value as KioskSettings['icon_size'] })}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition bg-white"
                                >
                                    {sizeOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    ขนาดตัวอักษร
                                </label>
                                <select
                                    value={settings.font_size}
                                    onChange={(e) => setSettings({ ...settings, font_size: e.target.value as KioskSettings['font_size'] })}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition bg-white"
                                >
                                    {sizeOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Grid Settings */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm lg:col-span-2">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                <LayoutGrid className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">ตั้งค่า Grid</h2>
                                <p className="text-xs text-slate-500">กำหนดจำนวนคอลัมน์และระยะห่างของการ์ด</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    จำนวนคอลัมน์
                                </label>
                                <select
                                    value={settings.grid_columns}
                                    onChange={(e) => setSettings({ ...settings, grid_columns: e.target.value as KioskSettings['grid_columns'] })}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition bg-white"
                                >
                                    {columnOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    ระยะห่างระหว่างการ์ด
                                </label>
                                <select
                                    value={settings.grid_gap}
                                    onChange={(e) => setSettings({ ...settings, grid_gap: e.target.value as KioskSettings['grid_gap'] })}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition bg-white"
                                >
                                    {gapOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* External Link */}
                    <div className="lg:col-span-2 mt-2 text-center">
                        <a
                            href="/kiosk"
                            target="_blank"
                            className="text-pink-500 hover:text-pink-600 font-medium inline-flex items-center gap-2 transition"
                        >
                            <Monitor size={18} />
                            เปิดหน้า Kiosk ในแท็บใหม่
                        </a>
                    </div>
                </div>
            ) : (
                <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                    {/* Marquee Settings (Moved from Settings Page) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
                        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#e72289] flex items-center justify-center shadow-sm">
                                <Type size={24} />
                            </div>
                            <div>
                                <h2 className="font-black text-xl text-slate-900">ประกาศวิ่ง (Marquee)</h2>
                                <p className="text-sm font-medium text-slate-500">ข้อความแจ้งเตือนหน้าติดตามสถานะ</p>
                            </div>
                            <div className="ml-auto">
                                <ToggleSwitch
                                    checked={announcementActive}
                                    onChange={setAnnouncementActive}
                                    label="Enable Announcement"
                                    color="#e72289" // Pink as before
                                />
                            </div>
                        </div>

                        <div className="space-y-6 mt-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">ข้อความประกาศ</label>
                                <div className="relative group/input">
                                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-[#e72289] transition-colors" size={20} />
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-[#e72289] transition-all font-bold text-slate-800"
                                        value={announcementText}
                                        onChange={(e) => setAnnouncementText(e.target.value)}
                                        placeholder="เช่น ระบบขัดข้องชั่วคราว..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">เริ่มแสดง (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-[#e72289] transition-all font-medium text-slate-700"
                                        value={announcementStart}
                                        onChange={(e) => setAnnouncementStart(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">สิ้นสุด (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-[#e72289] transition-all font-medium text-slate-700"
                                        value={announcementEnd}
                                        onChange={(e) => setAnnouncementEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">
                                * หากไม่ระบุเวลา จะแสดงตามสถานะเปิด/ปิดด้านบน
                            </p>
                        </div>
                    </div>

                    {/* Tracking Messages Settings */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                                <Type className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">ข้อความสถานะ Tracking</h2>
                                <p className="text-xs text-slate-500">ปรับแต่งข้อความเมื่อติดตามสถานะคิว</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4">
                                <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">ตัวแปรที่ใช้ได้</h3>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs font-mono text-blue-700">{'{queue}'}</span>
                                    <span className="px-2 py-1 bg-white border-blue-200 rounded-lg text-xs font-mono text-blue-700">{'{department}'}</span>
                                    <span className="px-2 py-1 bg-white border-blue-200 rounded-lg text-xs font-mono text-blue-700">{'{counter}'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    ข้อความเมื่อถูกเรียกคิว (Processing)
                                </label>
                                <textarea
                                    value={settings.tracking_message_calling}
                                    onChange={(e) => setSettings({ ...settings, tracking_message_calling: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition min-h-[100px]"
                                    placeholder="เช่น: คิวของท่าน {queue} ถูกเรียกแล้วที่ {department} {counter}"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    ข้อความเมื่อถูกยกเลิก (Cancelled)
                                </label>
                                <textarea
                                    value={settings.tracking_message_cancelled}
                                    onChange={(e) => setSettings({ ...settings, tracking_message_cancelled: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition min-h-[100px]"
                                    placeholder="เช่น: คิวของท่าน {queue} ถูกยกเลิก โปรดติดต่อเจ้าหน้าที่"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    ข้อความเมื่อเสร็จสิ้น (Completed)
                                </label>
                                <textarea
                                    value={settings.tracking_message_completed || ''}
                                    onChange={(e) => setSettings({ ...settings, tracking_message_completed: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition min-h-[100px]"
                                    placeholder="เช่น: คิวของท่าน {queue} ได้รับบริการเรียบร้อยแล้ว"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
