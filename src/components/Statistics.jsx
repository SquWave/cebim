import React, { useState } from 'react';
import { PieChart, Wallet } from 'lucide-react';
import WalletAnalysis from './stats/WalletAnalysis';
import PortfolioPerformance from './stats/PortfolioPerformance';

const Statistics = ({ transactions = [], accounts = [], categories = [], assets = [], marketData = {}, privacyMode = false }) => {
    const [activeTab, setActiveTab] = useState('wallet'); // 'wallet' or 'portfolio'

    return (
        <div className="pb-24 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">İstatistikler</h2>
            </div>

            {/* Segmented Control */}
            <div className="flex p-1 bg-slate-800 rounded-xl">
                <button
                    onClick={() => setActiveTab('wallet')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'wallet' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Wallet className="w-4 h-4" />
                    Cüzdan Analizi
                </button>
                <button
                    onClick={() => setActiveTab('portfolio')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'portfolio' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <PieChart className="w-4 h-4" />
                    Portföy Performansı
                </button>
            </div>

            {/* Content Area */}
            <div className="space-y-6">
                {activeTab === 'wallet' ? (
                    <WalletAnalysis transactions={transactions} categories={categories} accounts={accounts} privacyMode={privacyMode} />
                ) : (
                    <PortfolioPerformance assets={assets} marketData={marketData} privacyMode={privacyMode} />
                )}
            </div>
        </div>
    );
};

export default Statistics;
