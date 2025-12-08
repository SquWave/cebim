/**
 * Asset Helper Functions
 * Shared utilities for portfolio asset management
 */

/**
 * Convert old flat asset structure to new lot-based structure
 */
export const migrateFlatAssetToLots = (flatAsset) => {
    if (flatAsset.lots) return flatAsset; // Already migrated

    return {
        id: flatAsset.id,
        name: flatAsset.name,
        type: flatAsset.type,
        expanded: false,
        lots: [{
            id: `lot_${Date.now()}`,
            amount: flatAsset.amount,
            cost: flatAsset.cost,
            price: flatAsset.price,
            addedAt: Date.now()
        }]
    };
};

/**
 * Compute aggregated values from a lot-based asset
 */
export const computeAggregatedValues = (lotsAsset) => {
    if (!lotsAsset.lots || lotsAsset.lots.length === 0) {
        return { totalAmount: 0, avgCost: 0, currentPrice: 0, totalValue: 0, totalProfit: 0, profitPercentage: 0 };
    }

    // Calculate totals from LOTS (Purchases)
    const totalPurchasedAmount = lotsAsset.lots.reduce((sum, lot) => sum + lot.amount, 0);
    const totalPurchasedCost = lotsAsset.lots.reduce((sum, lot) => sum + (lot.amount * lot.cost), 0);

    // Calculate totals from SALES
    const totalSoldAmount = (lotsAsset.sales || []).reduce((sum, sale) => sum + sale.amount, 0);

    // Net Amount
    const totalAmount = totalPurchasedAmount - totalSoldAmount;

    // Avg Cost (based on purchases)
    const avgCost = totalPurchasedAmount > 0 ? totalPurchasedCost / totalPurchasedAmount : 0;

    const currentPrice = lotsAsset.lots[0]?.price || 0;
    const totalValue = totalAmount * currentPrice;

    // Total Cost of REMAINING assets
    const totalCostValue = totalAmount * avgCost;

    const totalProfit = totalValue - totalCostValue;
    const profitPercentage = totalCostValue > 0 ? (totalProfit / totalCostValue) * 100 : 0;

    return { totalAmount, avgCost, currentPrice, totalValue, totalProfit, profitPercentage };
};

/**
 * Format currency in Turkish Lira
 */
export const formatCurrency = (value, privacyMode = false) => {
    if (privacyMode) return '₺***';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2
    }).format(value);
};

/**
 * Category configuration for asset types
 */
export const categoryConfig = {
    gold: { label: 'Altın', order: 1 },
    stock: { label: 'Hisse Senedi', order: 2 },
    fund: { label: 'Yatırım Fonu', order: 3 },
    currency: { label: 'Döviz', order: 4 }
};

/**
 * Get category label for asset type
 */
export const getCategoryLabel = (type) => {
    return categoryConfig[type]?.label || type;
};
