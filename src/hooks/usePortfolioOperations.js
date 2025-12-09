import { useState } from 'react';
import { computeAggregatedValues } from '../utils/assetHelpers';

/**
 * Custom hook for managing portfolio lot and sale operations
 * Handles lot editing, sale creation, and sale editing
 */
export const usePortfolioOperations = ({ onUpdateAsset, onDeleteAsset }) => {
    // Lot editing state
    const [editingLot, setEditingLot] = useState(null);
    const [editForm, setEditForm] = useState({ amount: '', cost: '' });

    // Sale state
    const [isSelling, setIsSelling] = useState(null);
    const [saleForm, setSaleForm] = useState({ amount: '', salePrice: '' });
    const [viewMode, setViewMode] = useState({});
    const [editingSale, setEditingSale] = useState(null);
    const [editSaleForm, setEditSaleForm] = useState({ amount: '', salePrice: '' });

    // Expanded assets state
    const [expandedAssets, setExpandedAssets] = useState(new Set());

    // --- Lot Operations ---
    const handleEditLot = (assetId, lot) => {
        setEditingLot({ assetId, lotId: lot.id });
        setEditForm({ amount: lot.amount, cost: lot.cost });
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
                    ? { ...lot, amount: newAmount, cost: newCost }
                    : lot
            );

            await onUpdateAsset({ ...asset, lots: updatedLots });
            setEditingLot(null);
            setEditForm({ amount: '', cost: '' });
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
                soldAt: Date.now()
            };

            const updatedSales = [...(asset.sales || []), newSale];

            await onUpdateAsset({
                ...asset,
                sales: updatedSales
            });

            setIsSelling(null);
            setSaleForm({ amount: '', salePrice: '' });

        } catch (error) {
            console.error("Error processing sale:", error);
            alert("Satış işlemi sırasında bir hata oluştu.");
        }
    };

    const handleDeleteSale = async (asset, saleId) => {
        if (!confirm("Bu satış kaydını silmek istediğinize emin misiniz?")) return;

        try {
            const updatedSales = (asset.sales || []).filter(s => s.id !== saleId);

            await onUpdateAsset({
                ...asset,
                sales: updatedSales
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
