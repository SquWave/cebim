import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Eye, EyeOff, Copy, Check, ShieldAlert, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { user, logout } = useAuth();
    const [showKey, setShowKey] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(user.key);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const toggleKey = () => {
        if (!showKey) {
            if (window.confirm('Gizli anahtarınız ekranda görünecek. Etrafınızda kimsenin olmadığından emin misiniz?')) {
                setShowKey(true);
            }
        } else {
            setShowKey(false);
        }
    };

    const toggleQR = () => {
        if (!showQR) {
            if (window.confirm('QR kodunuz ekranda görünecek. Bu kodu taratan herkes hesabınıza erişebilir. Emin misiniz?')) {
                setShowQR(true);
            }
        } else {
            setShowQR(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
                <p className="text-slate-400 text-sm">Hesap güvenliği ve tercihleri</p>
            </header>

            {/* Secret Key Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <ShieldAlert className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white">Gizli Anahtar</h3>
                        <p className="text-slate-400 text-xs">Bu anahtarı kaybetmeyin, hesabınıza erişimin tek yolu budur.</p>
                    </div>
                </div>

                <div className="bg-slate-950 rounded-lg p-4 flex items-center justify-between border border-slate-800">
                    <div className="font-mono text-slate-300 break-all mr-4">
                        {showKey ? user.key : '••••-••••-••••-••••-••••-••••'}
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={toggleKey}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title={showKey ? "Gizle" : "Göster"}
                        >
                            {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                        {showKey && (
                            <button
                                onClick={handleCopy}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title="Kopyala"
                            >
                                {isCopied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* QR Code Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <QrCode className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white">Giriş QR Kodu</h3>
                        <p className="text-slate-400 text-xs">Mobil cihazlardan hızlı giriş yapmak için kullanın.</p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-lg border border-slate-800 min-h-[200px]">
                    {showQR ? (
                        <div className="bg-white p-4 rounded-xl">
                            <QRCodeSVG value={user.key} size={180} level="H" />
                        </div>
                    ) : (
                        <div className="text-center">
                            <QrCode className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                            <button
                                onClick={toggleQR}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                QR Kodu Göster
                            </button>
                        </div>
                    )}
                    {showQR && (
                        <button
                            onClick={() => setShowQR(false)}
                            className="mt-4 text-sm text-slate-500 hover:text-slate-300"
                        >
                            Gizle
                        </button>
                    )}
                </div>
            </div>

            <div className="text-center text-xs text-slate-600 mt-8">
                Cebim v1.3.4 • Güvenli Bağlantı
            </div>

            <div className="mt-8">
                <button
                    onClick={() => {
                        if (window.confirm('Çıkış yapmak istediğinize emin misiniz?')) {
                            logout();
                        }
                    }}
                    className="w-full py-4 text-red-500 font-medium bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors"
                >
                    Çıkış Yap
                </button>
            </div>
        </div>
    );
};

export default Settings;
