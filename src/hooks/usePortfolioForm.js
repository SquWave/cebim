import { useState, useEffect, useRef } from 'react';
import { fetchMarketData, searchStocks, TEFAS_FUNDS } from '../services/marketData';
import { migrateFlatAssetToLots, computeAggregatedValues } from '../utils/assetHelpers';

/**
 * Custom hook for managing portfolio form state and logic
 * Extracts form handling, autocomplete, and asset CRUD operations from Portfolio component
 */
export const usePortfolioForm = ({ assets, onAddAsset, onUpdateAsset, rates }) => {
    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [cost, setCost] = useState('');
    const [type, setType] = useState('');

    // Autocomplete State
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const isSelectionRef = useRef(false);

    // Reset form when opening add dialog
    useEffect(() => {
        if (isAdding) {
            setName('');
            setAmount('');
            setCost('');
            setType('');
            setSuggestions([]);
            setShowSuggestions(false);
            isSelectionRef.current = false;
        }
    }, [isAdding]);

    // Autocomplete Logic
    useEffect(() => {
        if (isSelectionRef.current) {
            isSelectionRef.current = false;
            return;
        }

        if (!name || (type !== 'stock' && type !== 'fund')) {
            setSuggestions([]);
            return;
        }

        const query = name.toUpperCase();

        const fetchSuggestions = async () => {
            if (type === 'stock') {
                try {
                    const stockResults = await searchStocks(query);
                    setSuggestions(stockResults.slice(0, 8));
                    setShowSuggestions(stockResults.length > 0);
                } catch (error) {
                    console.error('Error fetching stock suggestions:', error);
                    setSuggestions([]);
                }
            } else if (type === 'fund') {
                const fundResults = TEFAS_FUNDS.filter(f =>
                    f.code.includes(query) || f.name.includes(query)
                ).slice(0, 8);
                setSuggestions(fundResults.map(f => ({
                    code: f.code,
                    shortName: f.name
                })));
                setShowSuggestions(fundResults.length > 0);
            }
        };

        const debounce = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounce);
    }, [name, type]);

    const handleSelectSuggestion = (code) => {
        isSelectionRef.current = true;
        setName(code);
        setShowSuggestions(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !amount || !cost) return;

        const numAmount = Number(amount);
        const numCost = Number(cost);

        if (numAmount <= 0) {
            alert("Lütfen 0'dan büyük bir adet girin.");
            return;
        }

        if (numCost <= 0) {
            alert("Lütfen 0'dan büyük bir maliyet girin.");
            return;
        }

        let initialPrice = numCost;

        // For currency assets, use live FX rate instead of cost
        if (type === 'currency' && rates) {
            if (name === 'USD') initialPrice = rates.USD;
            else if (name === 'EUR') initialPrice = rates.EUR;
        }
        else if (type === 'gold' && rates) {
            initialPrice = rates.GOLD;
        }
        // If it's a stock, try to fetch the current price immediately
        else if (type === 'stock' && rates && rates.specificPrices) {
            const stockCode = name.toUpperCase();
            const data = await fetchMarketData([{ name: stockCode, type: 'stock' }]);
            if (data.specificPrices && data.specificPrices[stockCode]) {
                initialPrice = data.specificPrices[stockCode];
            }
        }
        // If it's a fund, fetch the current price from TEFAS
        else if (type === 'fund') {
            const fundCode = name.toUpperCase();
            const data = await fetchMarketData([{ name: fundCode, type: 'fund' }]);
            if (data.specificPrices && data.specificPrices[fundCode]) {
                initialPrice = data.specificPrices[fundCode];
            }
        }

        try {
            const assetName = name.toUpperCase();
            const migratedAssets = assets.map(migrateFlatAssetToLots);
            const existingAsset = migratedAssets.find(a => a.name === assetName && a.type === type);

            if (existingAsset) {
                const newLot = {
                    id: `lot_${Date.now()}`,
                    amount: numAmount,
                    cost: numCost,
                    price: initialPrice,
                    addedAt: Date.now()
                };

                const updatedAsset = {
                    ...existingAsset,
                    lots: [...existingAsset.lots, newLot]
                };

                await onUpdateAsset(updatedAsset);
            } else {
                const newAsset = {
                    id: Date.now(),
                    name: assetName,
                    type,
                    expanded: false,
                    lots: [{
                        id: `lot_${Date.now()}`,
                        amount: numAmount,
                        cost: numCost,
                        price: initialPrice,
                        addedAt: Date.now()
                    }]
                };

                await onAddAsset(newAsset);
            }

            // Reset form on success
            setName('');
            setAmount('');
            setCost('');
            setIsAdding(false);
            setSuggestions([]);

        } catch (error) {
            console.error("Error adding/updating asset:", error);
            alert("Varlık eklenirken bir hata oluştu. Lütfen tekrar deneyin.");
        }
    };

    return {
        // Form state
        isAdding,
        setIsAdding,
        name,
        setName,
        amount,
        setAmount,
        cost,
        setCost,
        type,
        setType,
        // Autocomplete
        suggestions,
        showSuggestions,
        setShowSuggestions,
        handleSelectSuggestion,
        // Submit
        handleSubmit
    };
};

export default usePortfolioForm;
