import React, { useState } from 'react';
import { LayoutDashboard, Wallet, TrendingUp } from 'lucide-react';
import Dashboard from './components/Dashboard';
import WalletComponent from './components/Wallet';
import Portfolio from './components/Portfolio';
import useLocalStorage from './hooks/useLocalStorage';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useLocalStorage('cebim_transactions', []);
  const [assets, setAssets] = useLocalStorage('cebim_assets', []);

  const addTransaction = (transaction) => {
    setTransactions([transaction, ...transactions]);
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const addAsset = (asset) => {
    setAssets([...assets, asset]);
  };

  const updateAsset = (updatedAsset) => {
    setAssets(assets.map(a => a.id === updatedAsset.id ? updatedAsset : a));
  };

  const deleteAsset = (id) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard transactions={transactions} assets={assets} />;
      case 'wallet':
        return (
          <WalletComponent
            transactions={transactions}
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        );
      case 'portfolio':
        return (
          <Portfolio
            assets={assets}
            onAddAsset={addAsset}
            onUpdateAsset={updateAsset}
            onDeleteAsset={deleteAsset}
          />
        );
      default:
        return <Dashboard transactions={transactions} assets={assets} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
        {/* Header */}
        <header className="p-6 pb-2 sticky top-0 bg-slate-950/80 backdrop-blur-md z-10">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Cebim
          </h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 pt-4">
          {renderContent()}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 pb-safe">
          <div className="max-w-md mx-auto flex justify-around p-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <LayoutDashboard className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Özet</span>
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'wallet' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <Wallet className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Cüzdan</span>
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'portfolio' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <TrendingUp className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Portföy</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

export default App;
