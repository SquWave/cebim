import React, { useState } from 'react';
import { Key, ArrowRight, ShieldCheck, Copy, Check, RefreshCw, QrCode, X, Camera } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [key, setKey] = useState('');
    const [generatedKey, setGeneratedKey] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [hasBackedUp, setHasBackedUp] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const { login } = useAuth();

    const generateKey = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const segments = 6;
        const segmentLength = 4;
        let result = '';

        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segmentLength; j++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            if (i < segments - 1) result += '-';
        }
        setGeneratedKey(result);
        setIsCopied(false);
        setHasBackedUp(false);
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generatedKey);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (key.trim().length < 10) return;
        login(key);
    };

    const handleRegister = () => {
        if (!hasBackedUp) return;
        login(generatedKey);
    };

    const handleScan = (result) => {
        if (result) {
            const scannedKey = result[0].rawValue;
            setKey(scannedKey);
            setShowScanner(false);
            login(scannedKey);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
                        <ShieldCheck className="h-8 w-8 text-indigo-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Cebim'e Hoşgeldin</h2>
                    <p className="text-slate-400">
                        {mode === 'login'
                            ? 'Mevcut anahtarınla giriş yap ve verilerine ulaş.'
                            : 'Yeni bir güvenli anahtar oluştur ve hemen başla.'}
                    </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-slate-900 p-1 rounded-xl">
                    <button
                        onClick={() => setMode('login')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Giriş Yap
                    </button>
                    <button
                        onClick={() => {
                            setMode('register');
                            if (!generatedKey) generateKey();
                        }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'register' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Yeni Hesap
                    </button>
                </div>

                {mode === 'login' ? (
                    <div className="space-y-6">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Key className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-3 py-4 border border-slate-800 rounded-xl leading-5 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors font-mono"
                                    placeholder="Anahtarını buraya yapıştır"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={key.trim().length < 10}
                                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <ArrowRight className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300" />
                                </span>
                                Giriş Yap
                            </button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-slate-950 text-slate-500">veya</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowScanner(true)}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                            <QrCode className="h-5 w-5" />
                            QR Kod ile Giriş Yap
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative group">
                            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                                Sana Özel Güvenli Anahtar
                            </label>
                            <div className="font-mono text-lg text-emerald-400 break-all pr-10">
                                {generatedKey}
                            </div>
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={generateKey}
                                    className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
                                    title="Yeni Anahtar Üret"
                                >
                                    <RefreshCw className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
                                    title="Kopyala"
                                >
                                    {isCopied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* QR Code Display for Registration */}
                        <div className="bg-white p-4 rounded-xl flex justify-center">
                            <QRCodeSVG value={generatedKey} size={160} level="H" />
                        </div>
                        <p className="text-center text-xs text-slate-500">
                            Bu QR kodu başka bir cihazdan taratarak hızlıca giriş yapabilirsiniz.
                        </p>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <ShieldCheck className="h-5 w-5 text-amber-500" />
                                </div>
                                <p className="text-sm text-amber-200/80">
                                    <strong>Dikkat:</strong> Bu anahtarı kaybederseniz verilerinize bir daha asla erişemezsiniz. Lütfen güvenli bir yere kaydedin.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-2">
                            <input
                                type="checkbox"
                                id="backup-confirm"
                                checked={hasBackedUp}
                                onChange={(e) => setHasBackedUp(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="backup-confirm" className="text-sm text-slate-300 cursor-pointer select-none">
                                Anahtarımı kopyaladım ve güvenli bir yere kaydettim.
                            </label>
                        </div>

                        <button
                            onClick={handleRegister}
                            disabled={!hasBackedUp}
                            className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Hesabı Oluştur ve Giriş Yap
                        </button>
                    </div>
                )}
            </div>

            {/* QR Scanner Modal */}
            {showScanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                    <div className="w-full max-w-sm bg-slate-900 rounded-2xl overflow-hidden relative">
                        <button
                            onClick={() => setShowScanner(false)}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <div className="p-4 text-center">
                            <h3 className="text-lg font-bold text-white mb-2">QR Kodu Taratın</h3>
                            <p className="text-slate-400 text-sm mb-4">Bilgisayar ekranındaki QR kodu kameraya gösterin.</p>
                        </div>
                        <div className="aspect-square relative bg-black">
                            <Scanner
                                onScan={handleScan}
                                onError={(error) => {
                                    console.error(error);
                                    alert("Kamera hatası: " + error?.message || "Kameraya erişilemedi. Lütfen izinleri kontrol edin veya HTTPS bağlantısı kullandığınızdan emin olun.");
                                    setShowScanner(false);
                                }}
                                styles={{ container: { width: '100%', height: '100%' } }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginScreen;
