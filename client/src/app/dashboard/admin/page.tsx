'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users, Building2, Ticket, ArrowUpRight,
  Clock, CheckCircle2, XCircle, Activity,
  TrendingUp, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

import { Palette, Trash2, Plus, Edit2, Check } from 'lucide-react';
import Portal from '@/components/Portal';

interface QuickMenuItem {
  id: string;
  label: string;
  subLabel: string;
  href: string;
  icon: string; // We'll store icon name, but for now we might map it or just use a few presets
  color: string;
}

const defaultQuickMenus: QuickMenuItem[] = [
  { id: '1', label: 'ประเภทคิว', subLabel: 'จัดการประเภทคิว รหัส และสีป้ายกำกับ', href: '/dashboard/admin/queues', icon: 'Ticket', color: 'blue' },
  { id: '2', label: 'แผนก/ช่องบริการ', subLabel: 'จัดการจุดให้บริการและเคาน์เตอร์', href: '/dashboard/admin/departments', icon: 'Building2', color: 'purple' },
  { id: '3', label: 'บุคลากร', subLabel: 'จัดการเจ้าหน้าที่และสิทธิ์การใช้งาน', href: '/dashboard/admin/personnel', icon: 'Users', color: 'orange' },
  { id: '4', label: 'สถานะผู้ติดต่อ', subLabel: 'จัดการบทบาทและประเภทผู้มาติดต่อ', href: '/dashboard/admin/case-roles', icon: 'Users', color: 'pink' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Settings / Quick Menu Config
  const [quickMenus, setQuickMenus] = useState<QuickMenuItem[]>(defaultQuickMenus);
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState<any>(null); // Full kiosk settings object

  // Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [newMenu, setNewMenu] = useState<Partial<QuickMenuItem>>({ color: 'blue', icon: 'Ticket' });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchSettings();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
      const res = await api.get(`/queues/stats/summary?start_date=${today}&end_date=${today}`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/kiosk-settings');
      setSettings(res.data);
      if (res.data.quick_menus && Array.isArray(res.data.quick_menus) && res.data.quick_menus.length > 0) {
        setQuickMenus(res.data.quick_menus);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const saveSettings = async (updatedMenus: QuickMenuItem[]) => {
    setSavingSettings(true);
    try {
      const updatedSettings = { ...settings, quick_menus: updatedMenus };
      await api.put('/admin/kiosk-settings', updatedSettings);
      setSettings(updatedSettings);
      setQuickMenus(updatedMenus);
    } catch (err) {
      console.error('Failed to save settings', err);
      alert('บันทึกไม่สำเร็จ');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteMenu = (id: string) => {
    if (!confirm('ยืนยันลบเมนูนี้?')) return;
    const updated = quickMenus.filter(m => m.id !== id);
    setQuickMenus(updated);
    // Auto save on delete? Or wait for "Finish Editing"? 
    // Let's auto save for simplicity or maybe user wants to batch.
    // Let's do batch save only when user clicks "Done" to be safe, BUT the requirement implies easy add/remove. 
    // Actually, let's just update local state and have a "Save" button or Auto-save on mode exit.
    // For better UX, let's just save immediately on Add/Delete in this "Edit Mode".
    saveSettings(updated);
  };

  const handleAddMenu = () => {
    if (!newMenu.label || !newMenu.href) return alert('กรุณาระบุชื่อและลิงก์');
    const item: QuickMenuItem = {
      id: Date.now().toString(),
      label: newMenu.label,
      subLabel: newMenu.subLabel || '',
      href: newMenu.href,
      icon: newMenu.icon || 'Ticket',
      color: newMenu.color || 'blue'
    };
    const updated = [...quickMenus, item];
    saveSettings(updated);
    setShowModal(false);
    setNewMenu({ color: 'blue', icon: 'Ticket' });
  };

  const iconMap: Record<string, any> = {
    Ticket: Ticket,
    Building2: Building2,
    Users: Users,
    Clock: Clock,
    Activity: Activity,
    Settings: Palette // Just mapping generic settings icon
  };

  const getColorClass = (color: string, type: 'bg' | 'text' | 'border' | 'hover') => {
    const colors: Record<string, any> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', hover: 'group-hover:text-blue-600', hoverBg: 'group-hover:bg-blue-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', hover: 'group-hover:text-purple-600', hoverBg: 'group-hover:bg-purple-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', hover: 'group-hover:text-orange-600', hoverBg: 'group-hover:bg-orange-600' },
      pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100', hover: 'group-hover:text-pink-600', hoverBg: 'group-hover:bg-pink-600' },
      green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', hover: 'group-hover:text-emerald-600', hoverBg: 'group-hover:bg-emerald-600' },
      red: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', hover: 'group-hover:text-rose-600', hoverBg: 'group-hover:bg-rose-600' },
    };
    const c = colors[color] || colors.blue;
    if (type === 'bg') return c.bg;
    if (type === 'text') return c.text;
    if (type === 'border') return c.border;
    if (type === 'hover') return c.hover;
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 animate-pulse">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  const overview = stats?.overview || { total: 0, completed: 0, waiting: 0, cancelled: 0 };
  const successRate = overview.total > 0
    ? Math.round((overview.completed / overview.total) * 100)
    : 0;

  const cards = [
    {
      label: 'คิวทั้งหมด (วันนี้)',
      value: overview.total,
      icon: Ticket,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      desc: 'Total Queues'
    },
    {
      label: 'ให้บริการแล้ว',
      value: overview.completed,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      desc: 'Completed'
    },
    {
      label: 'กำลังรอ/บริการ',
      value: overview.waiting,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      desc: 'In Progress'
    },
    {
      label: 'ยกเลิก/ไม่มา',
      value: overview.cancelled,
      icon: XCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      desc: 'Cancelled'
    },
  ];

  return (
    <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${GeistSans.className}`}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-1">ภาพรวมระบบ</h2>
          <p className="text-slate-500 font-medium">สรุปข้อมูลการให้บริการประจำวันนี้</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 text-sm font-medium text-slate-600">
          <Calendar size={16} className="text-[#e72289]" />
          {new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`clay-card clay-card-hover p-6 flex flex-col justify-between group relative overflow-hidden h-full min-h-[180px]`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon size={100} className={card.color} />
              </div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-4 rounded-2xl ${card.bg} ${card.color} shadow-sm group-hover:scale-110 transition-transform duration-300 border border-white/50`}>
                  <Icon size={28} />
                </div>
                {idx === 1 && (
                  <span className="bg-emerald-100/80 backdrop-blur-sm text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm border border-emerald-200">
                    <TrendingUp size={12} />
                    {successRate}%
                  </span>
                )}
              </div>

              <div className="relative z-10 mt-auto">
                <div className={`text-5xl font-black text-slate-800 mb-1 tracking-tighter ${GeistMono.className}`}>{card.value}</div>
                <div className="text-sm font-bold text-slate-500">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-pink-100 text-[#e72289] rounded-xl shadow-sm">
              <Activity size={20} />
            </div>
            เมนูด่วน
          </h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isEditing ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
            {isEditing ? 'เสร็จสิ้น' : 'แก้ไขเมนู'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {quickMenus.map((menu) => {
            const Icon = iconMap[menu.icon] || Ticket;
            const colorBg = getColorClass(menu.color, 'bg');
            const colorText = getColorClass(menu.color, 'text');
            const colorBorder = getColorClass(menu.color, 'border');
            const colorHover = getColorClass(menu.color, 'hover');

            if (isEditing) {
              return (
                <div key={menu.id} className="relative group p-6 clay-card flex flex-col h-full border-2 border-dashed border-slate-300 bg-slate-50/50">
                  <button
                    onClick={() => handleDeleteMenu(menu.id)}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition z-20"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center justify-between mb-6 opacity-60">
                    <div className={`p-4 ${colorBg} ${colorText} rounded-2xl border ${colorBorder}`}>
                      <Icon size={28} />
                    </div>
                  </div>
                  <h4 className="text-xl font-black text-slate-800 mb-2">{menu.label}</h4>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">{menu.subLabel}</p>
                </div>
              );
            }

            return (
              <Link key={menu.id} href={menu.href} className="group p-6 clay-card clay-card-hover flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 ${colorBg} ${colorText} rounded-2xl group-hover:bg-opacity-100 transition-all duration-300 shadow-sm border ${colorBorder}`}>
                    <Icon size={28} />
                  </div>
                  <div className={`p-2 rounded-full bg-slate-50 text-slate-300 transition-colors ${colorHover.replace('text', 'bg').replace('600', '50')} ${colorHover}`}>
                    <ArrowUpRight size={20} />
                  </div>
                </div>
                <h4 className={`text-xl font-black text-slate-800 mb-2 ${colorHover} transition-colors`}>{menu.label}</h4>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{menu.subLabel}</p>
              </Link>
            );
          })}

          {isEditing && (
            <button
              onClick={() => setShowModal(true)}
              className="group p-6 rounded-[2rem] border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50/30 transition-all min-h-[180px]"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 group-hover:bg-pink-100 flex items-center justify-center mb-4 transition-colors">
                <Plus size={32} />
              </div>
              <span className="font-bold">เพิ่มเมนู</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Menu Modal */}
      {/* Add Menu Modal */}
      {showModal && (
        <Portal>
          <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 ${GeistSans.className} animate-in fade-in duration-200`}>
            <div
              className="fixed inset-0"
              onClick={() => setShowModal(false)}
            ></div>
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
              <h3 className="text-2xl font-black text-slate-900 mb-6">เพิ่มเมนูด่วน</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1 block">ชื่อเมนู</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="เช่น: หน้าจอเรียกคิว"
                    value={newMenu.label || ''}
                    onChange={e => setNewMenu({ ...newMenu, label: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1 block">คำอธิบายสั้นๆ</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="เช่น: สำหรับแสดงผลบนทีวี"
                    value={newMenu.subLabel || ''}
                    onChange={e => setNewMenu({ ...newMenu, subLabel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1 block">ลิงก์ (URL)</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="/display"
                    value={newMenu.href || ''}
                    onChange={e => setNewMenu({ ...newMenu, href: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-1 block">ไอคอน</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-500 outline-none bg-white"
                      value={newMenu.icon}
                      onChange={e => setNewMenu({ ...newMenu, icon: e.target.value })}
                    >
                      {Object.keys(iconMap).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-1 block">สี</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-500 outline-none bg-white"
                      value={newMenu.color}
                      onChange={e => setNewMenu({ ...newMenu, color: e.target.value })}
                    >
                      <option value="blue">Blue</option>
                      <option value="purple">Purple</option>
                      <option value="orange">Orange</option>
                      <option value="pink">Pink</option>
                      <option value="green">Green</option>
                      <option value="red">Red</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleAddMenu}
                    disabled={savingSettings}
                    className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50"
                  >
                    {savingSettings ? 'กำลังบันทึก...' : 'เพิ่มเมนู'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}