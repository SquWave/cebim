import { useState } from 'react';
import { computeAggregatedValues, migrateAssetToPeriods, migrateFlatAssetToLots, getActivePeriod, shouldClosePeriod, dateStringToTimestamp, timestampToDateString } from '../utils/assetHelpers';

/**
 * Custom hook for managing portfolio lot and sale operations
 * Handles lot editing, sale creation, and sale editing
 */
export const usePortfolioOperations = ({ onUpdateAsset, onDeleteAsset }) => {
    // Lot editing state
    const [editingLot, setEditingLot] = useState(null);
    const [editForm, setEditForm] = useState({ amount: '', cost: '', date: '' });

    // Sale state
    const [isSelling, setIsSelling] = useState(null);
    const [saleForm, setSaleForm] = useState({ amount: '', salePrice: '', date: new Date().toISOString().split('T')[0] });
    const [viewMode, setViewMode] = useState({});
    const [editingSale, setEditingSale] = useState(null);
    const [editSaleForm, setEditSaleForm] = useState({ amount: '', salePrice: '', date: '' });

    // Expanded assets state
    const [expandedAssets, setExpandedAssets] = useState(new Set());

    // --- Lot Operations ---
    const handleEditLot = (assetId, lot) => {
        setEditingLot({ assetId, lotId: lot.id });
        setEditForm({
            amount: lot.amount,
            cost: lot.cost,
            date: timestampToDateString(lot.addedAt)
        });
    };

    const handleSaveLot = async (asset, lotId) => {
        const newAmount = Number(editForm.amount);
        const newCost = Number(editForm.cost);

        if (!newAmount || newAmount <= 0) {
            alert("Lütfen 0'dan büyük bir adet girin.");
            return;
        }

        if (!newCost || newCost <= 0) {
            alert("Lütfen 0'dan büyük bir maliyet girin.");
            return;
        }

        try {
            const updatedLots = asset.lots.map(lot =>
                lot.id === lotId
                    ? { ...lot, amount: newAmount, cost: newCost, addedAt: dateStringToTimestamp(editForm.date) }
                    : lot
            );

            // Also update in periods if they exist
            let updatedPeriods = asset.periods;
            if (asset.periods) {
                updatedPeriods = asset.periods.map(period => ({
                    ...period,
                    lots: period.lots.map(lot =>
                        lot.id === lotId
                            ? { ...lot, amount: newAmount, cost: newCost, addedAt: dateStringToTimestamp(editForm.date) }
                            : lot
                    )
                }));
            }

            await onUpdateAsset({ ...asset, lots: updatedLots, periods: updatedPeriods });
            setEditingLot(null);
            setEditForm({ amount: '', cost: '', date: '' });
        } catch (error) {
            console.error("Error updating lot:", error);
            alert("Kayıt güncellenirken bir hata oluştu.");
        }
    };

    const handleCancelEdit = () => {
        setEditingLot(null);
        setEditForm({ amount: '', cost: '' });
    };

    const handleDeleteLot = async (asset, lotId) => {
        if (!confirm("Bu alım kaydını silmek istediğinize emin misiniz?")) return;

        try {
            const updatedLots = asset.lots.filter(lot => lot.id !== lotId);

            if (updatedLots.length === 0) {
                await onDeleteAsset(asset.id);
            } else {
                await onUpdateAsset({ ...asset, lots: updatedLots });
            }
        } catch (error) {
            console.error("Error deleting lot:", error);
            alert("Kayıt silinirken bir hata oluştu.");
        }
    };

    // --- Sale Operations ---
    const handleSale = async (asset) => {
        const { totalAmount, avgCost, currentPrice } = computeAggregatedValues(asset);
        const saleAmount = Number(saleForm.amount);
        const salePrice = Number(saleForm.salePrice) || currentPrice;
        const soldAtTimestamp = dateStringToTimestamp(saleForm.date);

        if (!saleAmount || saleAmount <= 0) {
            alert("Lütfen geçerli bir adet girin.");
            return;
        }

        if (saleAmount > totalAmount) {
            alert(`Yeterli varlık yok! Maksimum ${totalAmount} adet satabilirsiniz.`);
            return;
        }

        try {
            const newSale = {
                id: `sale_${Date.now()}`,
                amount: saleAmount,
                salePrice: salePrice,
                avgCost: avgCost,
                profit: (saleAmount * salePrice) - (saleAmount * avgCost),
                soldAt: soldAtTimestamp
            };

            // Update backward-compat sales array
            const updatedSales = [...(asset.sales || []), newSale];

            // Period-aware update
            let periodAsset = migrateAssetToPeriods(migrateFlatAssetToLots(asset));
            const activePeriod = getActivePeriod(periodAsset);

            if (activePeriod) {
                // Add sale to active period
                const updatedActivePeriod = {
                    ...activePeriod,
                    sales: [...(activePeriod.sales || []), newSale]
                };

                // Check if period should be closed (totalAmount = 0 after sale)
                const remainingAfterSale = totalAmount - saleAmount;
                if (remainingAfterSale <= 0) {
                    updatedActivePeriod.closedAt = Date.now();
                }

                // Update periods array
                const updatedPeriods = periodAsset.periods.map(p =>
                    p.id === activePeriod.id ? updatedActivePeriod : p
                );

                await onUpdateAsset({
                    ...periodAsset,
                    sales: updatedSales,
                    periods: updatedPeriods,
                    currentPeriodId: remainingAfterSale <= 0 ? null : periodAsset.currentPeriodId
                });
            } else {
                // Fallback for non-period assets
                await onUpdateAsset({
                    ...asset,
                    sales: updatedSales
                });
            }

            setIsSelling(null);
            setSaleForm({ amount: '', salePrice: '', date: new Date().toISOString().split('T')[0] });

        } catch (error) {
            console.error("Error processing sale:", error);
            alert("Satış işlemi sırasında bir hata oluştu.");
        }
    };

    const handleDeleteSale = async (asset, saleId) => {
        if (!confirm("Bu satış kaydını silmek istediğinize emin misiniz?")) return;

        try {
            // Update backward-compat sales array
            const updatedSales = (asset.sales || []).filter(s => s.id !== saleId);

            // If no periods, just update sales
            if (!asset.periods || asset.periods.length === 0) {
                await onUpdateAsset({
                    ...asset,
                    sales: updatedSales
                });
                return;
            }

            // Remove the sale from all periods
            let periodsWithSaleRemoved = asset.periods.map(period => {
                const periodSales = (period.sales || []).filter(s => s.id !== saleId);
                const hadThisSale = (period.sales || []).some(s => s.id === saleId);

                // If we removed a sale from a closed period, reopen it
                if (hadThisSale && period.closedAt !== null) {
                    return {
                        ...period,
                        sales: periodSales,
                        closedAt: null // Reopen the period
                    };
                }

                return {
                    ...period,
                    sales: periodSales
                };
            });

            // Now check if we have multiple unclosed periods
            // If so, we need to MERGE them into one period
            const unclosedPeriods = periodsWithSaleRemoved.filter(p => p.closedAt === null);

            if (unclosedPeriods.length > 1) {
                // Merge all unclosed periods into one
                const mergedLots = [];
                const mergedSales = [];

                unclosedPeriods.forEach(period => {
                    mergedLots.push(...(period.lots || []));
                    mergedSales.push(...(period.sales || []));
                });

                // Create a new merged period
                const mergedPeriod = {
                    id: `period_merged_${Date.now()}`,
                    lots: mergedLots,
                    sales: mergedSales,
                    closedAt: null
                };

                // Filter out the unclosed periods and add the merged one
                const closedPeriods = periodsWithSaleRemoved.filter(p => p.closedAt !== null);
                periodsWithSaleRemoved = [...closedPeriods, mergedPeriod];
            }

            // Find the active period (the unclosed one)
            const activePeriod = periodsWithSaleRemoved.find(p => p.closedAt === null);

            // Also update the backward-compat lots array to include all lots from active period
            const allActiveLots = activePeriod ? activePeriod.lots : (asset.lots || []);

            await onUpdateAsset({
                ...asset,
                sales: updatedSales,
                lots: allActiveLots,
                periods: periodsWithSaleRemoved,
                currentPeriodId: activePeriod?.id || null
            });
        } catch (error) {
            console.error("Error deleting sale:", error);
            alert("Satış kaydı silinirken bir hata oluştu.");
        }
    };

    const handleEditSale = (assetId, sale) => {
        setEditingSale({ assetId, saleId: sale.id });
        setEditSaleForm({
            amount: sale.amount,
            salePrice: sale.salePrice
        });
    };

    const handleCancelEditSale = () => {
        setEditingSale(null);
        setEditSaleForm({ amount: '', salePrice: '' });
    };

    const handleSaveSale = async (asset, saleId) => {
        const newAmount = Number(editSaleForm.amount);
        const newSalePrice = Number(editSaleForm.salePrice);

        if (!newAmount || newAmount <= 0) {
            alert("Lütfen geçerli bir adet girin.");
            return;
        }

        if (!newSalePrice || newSalePrice < 0) {
            alert("Lütfen geçerli bir satış fiyatı girin.");
            return;
        }

        const totalPurchased = asset.lots.reduce((sum, lot) => sum + Number(lot.amount), 0);
        const otherSalesTotal = asset.sales
            .filter(s => s.id !== saleId)
            .reduce((sum, sale) => sum + Number(sale.amount), 0);

        if (newAmount + otherSalesTotal > totalPurchased) {
            alert(`Yeterli varlık yok! Maksimum ${totalPurchased - otherSalesTotal} adet satabilirsiniz.`);
            return;
        }

        try {
            const updatedSales = asset.sales.map(sale => {
                if (sale.id === saleId) {
                    return {
                        ...sale,
                        amount: newAmount,
                        salePrice: newSalePrice,
                        profit: (newAmount * newSalePrice) - (newAmount * sale.avgCost)
                    };
                }
                return sale;
            });

            await onUpdateAsset({
                ...asset,
                sales: updatedSales
            });

            handleCancelEditSale();
        } catch (error) {
            console.error("Error updating sale:", error);
            alert("Satış kaydı güncellenirken bir hata oluştu.");
        }
    };

    return {
        // Lot state & handlers
        editingLot,
        editForm,
        setEditForm,
        handleEditLot,
        handleSaveLot,
        handleCancelEdit,
        handleDeleteLot,
        // Sale state & handlers
        isSelling,
        setIsSelling,
        saleForm,
        setSaleForm,
        viewMode,
        setViewMode,
        editingSale,
        editSaleForm,
        setEditSaleForm,
        handleSale,
        handleDeleteSale,
        handleEditSale,
        handleCancelEditSale,
        handleSaveSale,
        // Expansion state
        expandedAssets,
        setExpandedAssets
    };
};

export default usePortfolioOperations;
