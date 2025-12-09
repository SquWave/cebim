import { Wallet, TrendingUp, PieChart, ArrowRightLeft, BarChart3, Coins } from 'lucide-react';

/**
 * Widget Registry
 * Defines all available widgets with their metadata
 */
export const WIDGET_REGISTRY = {
    market_rates: {
        id: 'market_rates',
        name: 'Döviz & Altın Kurları',
        description: 'USD, EUR ve Gram Altın güncel fiyatları',
        icon: Coins,
        order: 1
    },
    balance_trend: {
        id: 'balance_trend',
        name: 'Bakiye Eğilimi',
        description: 'Son 30 günlük bakiye grafiği',
        icon: TrendingUp,
        order: 2
    },
    cash_flow: {
        id: 'cash_flow',
        name: 'Nakit Akışı',
        description: 'Net durum, toplam gelir ve gider',
        icon: ArrowRightLeft,
        order: 3
    },
    spending_distribution: {
        id: 'spending_distribution',
        name: 'Harcama Dağılımı',
        description: 'Kategorilere göre harcama pasta grafiği',
        icon: PieChart,
        order: 4
    },
    asset_allocation: {
        id: 'asset_allocation',
        name: 'Varlık Dağılımı',
        description: 'Yatırım portföyü pasta grafiği',
        icon: BarChart3,
        order: 5
    },
    quick_transaction: {
        id: 'quick_transaction',
        name: 'Hızlı İşlem & Son İşlemler',
        description: 'Hızlı işlem ekleme ve son 5 işlem',
        icon: Wallet,
        order: 6
    }
};

/**
 * Get ordered list of all widgets
 */
export const getOrderedWidgets = () => {
    return Object.values(WIDGET_REGISTRY).sort((a, b) => a.order - b.order);
};

/**
 * Get ordered list of enabled widgets
 */
export const getEnabledWidgetsOrdered = (enabledWidgetIds) => {
    return getOrderedWidgets().filter(widget => enabledWidgetIds.includes(widget.id));
};
