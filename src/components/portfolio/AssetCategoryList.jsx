import React, { useState } from 'react';
import { TrendingUp, Trash2, Coins, Banknote, PieChart, ReceiptTurkishLira, ChevronDown, ChevronUp } from 'lucide-react';
import { migrateFlatAssetToLots, computeAggregatedValues, categoryConfig } from '../../utils/assetHelpers';

/**
 * Asset Category List Component
 * Displays assets grouped by category with collapsible sections
 * Assets sorted alphabetically within each category
 * Renders children for each asset to support lot/sale editing
 */
const AssetCategoryList = ({
    assets,
    privacyMode = false,
    formatCurrency,
    renderAssetCard  // Function to render individual asset cards with full functionality
}) => {
    const [expandedCategories, setExpandedCategories] = useState(new Set());

    if (!assets || assets.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500">
                Henüz yatırım varlığı yok.
            </div>
        );
    }

    // Prepare and group assets
    const preparedAssets = assets.map(rawAsset => {
        const asset = migrateFlatAssetToLots(rawAsset);
        const computed = computeAggregatedValues(asset);
        return { ...asset, ...computed, rawAsset };
    });

    const groupedAssets = preparedAssets.reduce((acc, asset) => {
        const type = asset.type || 'other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(asset);
        return acc;
    }, {});

    // Sort each group alphabetically by name
    Object.keys(groupedAssets).forEach(type => {
        groupedAssets[type].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    });

    // Get active categories sorted by order (only categories with assets)
    const activeCategories = Object.keys(groupedAssets)
        .filter(type => groupedAssets[type]?.length > 0)
        .sort((a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99));

    const toggleCategory = (categoryType) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryType)) {
                next.delete(categoryType);
            } else {
                next.add(categoryType);
            }
            return next;
        });
    };

    return (
        <div className="space-y-4">
            {activeCategories.map((categoryType) => {
                const categoryInfo = categoryConfig[categoryType] || { label: categoryType, order: 99 };
                const categoryAssets = groupedAssets[categoryType];
                const categoryTotal = categoryAssets.reduce((sum, a) => sum + a.totalValue, 0);
                const isCategoryExpanded = expandedCategories.has(categoryType);

                return (
                    <div key={categoryType} className="rounded-xl overflow-hidden">
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(categoryType)}
                            className="w-full p-4 flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${categoryType === 'gold' ? 'bg-amber-500/10 text-amber-400' :
                                    categoryType === 'currency' ? 'bg-emerald-500/10 text-emerald-400' :
                                        categoryType === 'fund' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-indigo-500/10 text-indigo-400'
                                    }`}>
                                    {categoryType === 'gold' ? <Coins className="w-5 h-5" /> :
                                        categoryType === 'currency' ? <Banknote className="w-5 h-5" /> :
                                            categoryType === 'fund' ? <PieChart className="w-5 h-5" /> :
                                                <TrendingUp className="w-5 h-5" />}
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-white">{categoryInfo.label}</div>
                                    <div className="text-xs text-slate-400">{categoryAssets.length} Varlık</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="font-bold text-white">
                                        {privacyMode ? '₺***' : formatCurrency(categoryTotal)}
                                    </div>
                                </div>
                                {isCategoryExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                        </button>

                        {/* Category Assets */}
                        {isCategoryExpanded && (
                            <div className="mt-2 space-y-2">
                                {categoryAssets.map((asset) => renderAssetCard(asset.rawAsset, asset))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default AssetCategoryList;
