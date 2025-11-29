import React, { useState } from 'react';
import { LayoutDashboard, Wallet, PieChart, Settings as SettingsIcon, BarChart3 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import WalletComponent from './components/Wallet';
import Portfolio from './components/Portfolio';
import Settings from './components/Settings';
import LoginScreen from './components/LoginScreen';
import Statistics from './components/Statistics';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useFirestore } from './hooks/useFirestore';
import { useMarketData } from './hooks/useMarketData';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from './data/defaultCategories';

const AuthenticatedApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'portfolio', 'wallet', 'statistics', 'settings'
  const { user } = useAuth();

  // Firestore Hooks
  const { data: transactions, add: addTransaction, update: updateTransaction, remove: removeTransaction } = useFirestore('transactions');
  const { data: assets, add: addAsset, update: updateAsset, remove: removeAsset } = useFirestore('assets');
  const { data: accounts, add: addAccount, update: updateAccount, remove: removeAccount } = useFirestore('accounts');
  const { data: categories, add: addCategory } = useFirestore('categories');
  const marketData = useMarketData(assets);

  // Seed Categories
  React.useEffect(() => {
    if (user && categories && categories.length === 0) {
      const seedCategories = async () => {
        console.log("Seeding default categories...");
        const allCategories = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
        for (const cat of allCategories) {
          await addCategory(cat);
        }
        console.log("Categories seeded.");
      };
      seedCategories();
    }
  }, [user, categories, addCategory]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard transactions={transactions} assets={assets} accounts={accounts} />;
      case 'wallet':
        return <WalletComponent
          transactions={transactions}
          onAddTransaction={addTransaction}
          onUpdateTransaction={updateTransaction}
          onDeleteTransaction={removeTransaction}
          accounts={accounts}
          onAddAccount={addAccount}
          onUpdateAccount={updateAccount}
          onDeleteAccount={removeAccount}
          categories={categories}
        />;
      case 'portfolio':
        return <Portfolio assets={assets} onAddAsset={addAsset} onUpdateAsset={updateAsset} onDeleteAsset={removeAsset} />;
      case 'settings':
        return <Settings />;
      case 'statistics':
        return <Statistics transactions={transactions} accounts={accounts} categories={categories} assets={assets} marketData={marketData} />;
      default:
        return <Dashboard transactions={transactions} assets={assets} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Cebim
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-full transition-colors ${activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4 max-w-md mx-auto">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 z-10 pb-safe">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-medium">Özet</span>
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'wallet' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <Wallet className="h-5 w-5" />
            <span className="text-[10px] font-medium">Cüzdan</span>
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'portfolio' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <PieChart className="h-5 w-5" />
            <span className="text-[10px] font-medium">Yatırım</span>
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'statistics' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px] font-medium">Analiz</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return user ? <AuthenticatedApp /> : <LoginScreen />;
};

export default App;
