/**
 * Asset Helper Functions
 * Shared utilities for portfolio asset management
 */

/**
 * Format transaction date with fallback for missing dates
 * @param {number|null} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
export const formatTransactionDate = (timestamp) => {
    if (!timestamp) return 'Tarih belirtilmemiş';
    return new Date(timestamp).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Convert date string (YYYY-MM-DD) to timestamp
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {number} Unix timestamp
 */
export const dateStringToTimestamp = (dateString) => {
    if (!dateString) return Date.now();
    return new Date(dateString).getTime();
};

/**
 * Convert timestamp to date string for input[type="date"]
 * @param {number|null} timestamp - Unix timestamp
 * @returns {string} Date in YYYY-MM-DD format
 */
export const timestampToDateString = (timestamp) => {
    if (!timestamp) return new Date().toISOString().split('T')[0];
    return new Date(timestamp).toISOString().split('T')[0];
};

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
 * Migrate lot-based asset to period-based structure
 * This enables cost isolation when asset goes to 0 and is repurchased
 */
export const migrateAssetToPeriods = (asset) => {
    // If already has periods, return as is
    if (asset.periods && asset.periods.length > 0) {
        return asset;
    }

    // First ensure it's lot-based
    const lotBasedAsset = migrateFlatAssetToLots(asset);

    // Create initial period from existing lots and sales
    return {
        ...lotBasedAsset,
        currentPeriodId: 'period_initial',
        periods: [{
            id: 'period_initial',
            lots: lotBasedAsset.lots || [],
            sales: lotBasedAsset.sales || [],
            closedAt: null // null means active period
        }],
        // Keep old fields for backward compatibility during transition
        lots: lotBasedAsset.lots,
        sales: lotBasedAsset.sales
    };
};

/**
 * Get the active (non-closed) period from an asset
 */
export const getActivePeriod = (asset) => {
    const migrated = migrateAssetToPeriods(asset);
    return migrated.periods.find(p => p.closedAt === null) || null;
};

/**
 * Check if a period should be closed (totalAmount = 0)
 */
export const shouldClosePeriod = (period) => {
    if (!period || !period.lots) return false;
    
    const totalPurchased = period.lots.reduce((sum, lot) => sum + (lot.amount || 0), 0);
    const totalSold = (period.sales || []).reduce((sum, sale) => sum + (sale.amount || 0), 0);
    
    return totalPurchased - totalSold <= 0;
};

/**
 * Compute aggregated values from an asset (period-aware)
 * Only calculates from the ACTIVE period for current holdings
 */
export const computeAggregatedValues = (rawAsset) => {
    const asset = migrateAssetToPeriods(rawAsset);
    const activePeriod = getActivePeriod(asset);

    if (!activePeriod || !activePeriod.lots || activePeriod.lots.length === 0) {
        return { totalAmount: 0, avgCost: 0, currentPrice: 0, totalValue: 0, totalProfit: 0, profitPercentage: 0 };
    }

    // Calculate totals from LOTS (Purchases) in active period
    const totalPurchasedAmount = activePeriod.lots.reduce((sum, lot) => sum + (lot.amount || 0), 0);
    const totalPurchasedCost = activePeriod.lots.reduce((sum, lot) => sum + ((lot.amount || 0) * (lot.cost || 0)), 0);

    // Calculate totals from SALES in active period
    const totalSoldAmount = (activePeriod.sales || []).reduce((sum, sale) => sum + (sale.amount || 0), 0);

    // Net Amount
    const totalAmount = totalPurchasedAmount - totalSoldAmount;

    // Avg Cost (based on purchases in active period only)
    const avgCost = totalPurchasedAmount > 0 ? totalPurchasedCost / totalPurchasedAmount : 0;

    // Get current price from the most recent lot in active period
    const currentPrice = activePeriod.lots[activePeriod.lots.length - 1]?.price || activePeriod.lots[0]?.price || 0;
    const totalValue = totalAmount * currentPrice;

    // Total Cost of REMAINING assets
    const totalCostValue = totalAmount * avgCost;

    const totalProfit = totalValue - totalCostValue;
    const profitPercentage = totalCostValue > 0 ? (totalProfit / totalCostValue) * 100 : 0;

    return { totalAmount, avgCost, currentPrice, totalValue, totalProfit, profitPercentage };
};

/**
 * Get all transactions (lots + sales) from all periods for transaction history
 */
export const getAllTransactions = (asset) => {
    const migrated = migrateAssetToPeriods(asset);
    const transactions = [];

    migrated.periods.forEach(period => {
        // Add lots as "buy" transactions
        (period.lots || []).forEach(lot => {
            transactions.push({
                id: lot.id,
                type: 'buy',
                assetId: asset.id,
                assetName: asset.name,
                assetType: asset.type,
                amount: lot.amount,
                price: lot.cost,
                total: lot.amount * lot.cost,
                date: lot.addedAt,
                periodId: period.id
            });
        });

        // Add sales as "sell" transactions
        (period.sales || []).forEach(sale => {
            transactions.push({
                id: sale.id,
                type: 'sell',
                assetId: asset.id,
                assetName: asset.name,
                assetType: asset.type,
                amount: sale.amount,
                price: sale.salePrice,
                total: sale.amount * sale.salePrice,
                profit: sale.profit,
                date: sale.soldAt,
                periodId: period.id
            });
        });
    });

    return transactions;
};

// Re-export formatCurrency from formatters for backward compatibility
export { formatCurrency } from './formatters';

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
