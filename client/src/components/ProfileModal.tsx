'use client';

import { useState, useEffect } from 'react';
import { X, User, Lock, Save } from 'lucide-react';
import { api } from '@/lib/api';
import Portal from './Portal';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    currentName: string;
}

export function ProfileModal({ isOpen, onClose, userId, currentName }: ProfileModalProps) {
    const [fullname, setFullname] = useState(currentName);
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setFullname(currentName);
    }, [currentName]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/auth/profile', {
                id: userId,
                fullname,
                password, // Current password for verification
                newPassword: newPassword || undefined
            });
            alert('บันทึกข้อมูลเรียบร้อยแล้ว');
            onClose();
            // Optional: Update local storage name
            localStorage.setItem('user_name', fullname);
            window.location.reload();
        } catch (err: any) {
            console.error('Update Error:', err);
            const msg = err.response?.data?.error || err.message || 'เกิดข้อผิดพลาด';
            const details = err.response?.data?.details || '';
            alert(`${msg}\n${details}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800">ตั้งค่าโปรไฟล์</h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อ-นามสกุล</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    value={fullname}
                                    onChange={(e) => setFullname(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium text-slate-700"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">เปลี่ยนรหัสผ่าน (ถ้ามี)</h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">รหัสผ่านปัจจุบัน (ยืนยันตัวตน)</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium text-slate-700"
                                            required
                                            placeholder="ต้องระบุเพื่อบันทึกการเปลี่ยนแปลง"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">รหัสผ่านใหม่</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium text-slate-700"
                                            placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-[#e72289] hover:bg-[#c01b70] text-white rounded-xl font-bold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                            บันทึกการเปลี่ยนแปลง
                        </button>
                    </form>
                </div>
            </div>
        </Portal>
    );
}
