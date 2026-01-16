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
        }],
        sales: flatAsset.sales || [] // Ensure sales is always defined
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
        lots: lotBasedAsset.lots || [],
        sales: lotBasedAsset.sales || []
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
    gold: { label: 'Kıymetli Madenler', order: 1 },
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

/**
 * Compute realized profit/loss from all sales across assets
 * @param {Array} assets - Array of assets with sales data
 * @returns {Object} Realized P/L statistics
 */
export const computeRealizedPL = (assets = []) => {
    let totalRevenue = 0;      // Toplam satış geliri
    let totalCost = 0;         // Toplam satış maliyeti
    let totalProfit = 0;       // Toplam kar/zarar
    let totalSaleCount = 0;    // Toplam satış adedi
    let profitableSales = 0;   // Karlı satış sayısı
    let lossSales = 0;         // Zararlı satış sayısı
    const salesByAsset = {};   // Varlık bazlı satışlar

    assets.forEach(asset => {
        // Get sales from periods first, fallback to direct sales array
        let allSales = [];

        if (asset.periods && asset.periods.length > 0) {
            asset.periods.forEach(period => {
                if (period.sales && period.sales.length > 0) {
                    allSales = [...allSales, ...period.sales];
                }
            });
        }

        // Also check direct sales array (backward compat)
        if (asset.sales && asset.sales.length > 0) {
            // Avoid duplicates - only add if not already in allSales
            asset.sales.forEach(sale => {
                if (!allSales.some(s => s.id === sale.id)) {
                    allSales.push(sale);
                }
            });
        }

        if (allSales.length === 0) return;

        const assetSales = {
            name: asset.name,
            type: asset.type,
            sales: [],
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0
        };

        allSales.forEach(sale => {
            const amount = Number(sale.amount) || 0;
            const salePrice = Number(sale.salePrice) || 0;
            const avgCost = Number(sale.avgCost) || 0;

            const revenue = amount * salePrice;
            const cost = amount * avgCost;
            // Use stored profit if available, otherwise calculate
            const profit = sale.profit !== undefined ? Number(sale.profit) : (revenue - cost);

            totalRevenue += revenue;
            totalCost += cost;
            totalProfit += profit;
            totalSaleCount++;

            if (profit > 0) profitableSales++;
            else if (profit < 0) lossSales++;

            assetSales.sales.push({
                ...sale,
                revenue,
                cost,
                calculatedProfit: profit
            });
            assetSales.totalRevenue += revenue;
            assetSales.totalCost += cost;
            assetSales.totalProfit += profit;
        });

        if (assetSales.sales.length > 0) {
            salesByAsset[asset.id] = assetSales;
        }
    });

    const profitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    const successRate = totalSaleCount > 0 ? (profitableSales / totalSaleCount) * 100 : 0;

    return {
        totalRevenue,
        totalCost,
        totalProfit,
        profitPercentage,
        totalSaleCount,
        profitableSales,
        lossSales,
        successRate,
        salesByAsset
    };
};

/**
 * Compute realized P/L grouped by month
 * @param {Array} assets - Array of assets with sales data
 * @returns {Array} Monthly P/L data sorted by date
 */
export const computeRealizedPLByMonth = (assets = []) => {
    const monthlyData = {};

    assets.forEach(asset => {
        let allSales = [];

        if (asset.periods && asset.periods.length > 0) {
            asset.periods.forEach(period => {
                if (period.sales && period.sales.length > 0) {
                    allSales = [...allSales, ...period.sales];
                }
            });
        }

        if (asset.sales && asset.sales.length > 0) {
            asset.sales.forEach(sale => {
                if (!allSales.some(s => s.id === sale.id)) {
                    allSales.push(sale);
                }
            });
        }

        allSales.forEach(sale => {
            if (!sale.soldAt) return;

            const date = new Date(sale.soldAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    month: monthKey,
                    label: monthLabel,
                    profit: 0,
                    revenue: 0,
                    cost: 0,
                    count: 0
                };
            }

            const amount = Number(sale.amount) || 0;
            const salePrice = Number(sale.salePrice) || 0;
            const avgCost = Number(sale.avgCost) || 0;
            const profit = sale.profit !== undefined ? Number(sale.profit) : (amount * salePrice - amount * avgCost);

            monthlyData[monthKey].profit += profit;
            monthlyData[monthKey].revenue += amount * salePrice;
            monthlyData[monthKey].cost += amount * avgCost;
            monthlyData[monthKey].count++;
        });
    });

    // Sort by month and return array
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * Compute average holding period using FIFO method
 * @param {Array} assets - Array of assets with lots and sales data
 * @returns {Object} Average holding stats
 */
export const computeAverageHoldingPeriod = (assets = []) => {
    let totalHoldingDays = 0;
    let totalSalesWithDates = 0;

    assets.forEach(asset => {
        // Get all lots sorted by date (FIFO)
        let allLots = [];
        if (asset.periods && asset.periods.length > 0) {
            asset.periods.forEach(period => {
                if (period.lots && period.lots.length > 0) {
                    allLots = [...allLots, ...period.lots];
                }
            });
        }
        if (asset.lots && asset.lots.length > 0) {
            asset.lots.forEach(lot => {
                if (!allLots.some(l => l.id === lot.id)) {
                    allLots.push(lot);
                }
            });
        }

        // Sort lots by addedAt (FIFO)
        allLots.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));

        // Get all sales
        let allSales = [];
        if (asset.periods && asset.periods.length > 0) {
            asset.periods.forEach(period => {
                if (period.sales && period.sales.length > 0) {
                    allSales = [...allSales, ...period.sales];
                }
            });
        }
        if (asset.sales && asset.sales.length > 0) {
            asset.sales.forEach(sale => {
                if (!allSales.some(s => s.id === sale.id)) {
                    allSales.push(sale);
                }
            });
        }

        // Sort sales by soldAt
        allSales.sort((a, b) => (a.soldAt || 0) - (b.soldAt || 0));

        // FIFO matching
        let lotIndex = 0;
        let remainingInLot = allLots[0]?.amount || 0;

        allSales.forEach(sale => {
            if (!sale.soldAt) return;

            let remainingToSell = Number(sale.amount) || 0;

            while (remainingToSell > 0 && lotIndex < allLots.length) {
                const lot = allLots[lotIndex];
                if (!lot.addedAt) {
                    lotIndex++;
                    remainingInLot = allLots[lotIndex]?.amount || 0;
                    continue;
                }

                const amountFromThisLot = Math.min(remainingToSell, remainingInLot);
                const holdingDays = (sale.soldAt - lot.addedAt) / (1000 * 60 * 60 * 24);

                if (holdingDays >= 0) {
                    totalHoldingDays += holdingDays * amountFromThisLot;
                    totalSalesWithDates += amountFromThisLot;
                }

                remainingToSell -= amountFromThisLot;
                remainingInLot -= amountFromThisLot;

                if (remainingInLot <= 0) {
                    lotIndex++;
                    remainingInLot = allLots[lotIndex]?.amount || 0;
                }
            }
        });
    });

    const averageDays = totalSalesWithDates > 0 ? Math.round(totalHoldingDays / totalSalesWithDates) : 0;

    return {
        averageDays,
        totalSalesWithDates
    };
};
