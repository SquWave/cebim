import React from 'react';
import PortfolioSummary from './PortfolioSummary';
import AssetAllocationChart from './AssetAllocationChart';
import AssetPerformanceCards from './AssetPerformanceCards';

const PortfolioPerformance = ({ assets = [], marketData = {} }) => {
    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <PortfolioSummary assets={assets} marketData={marketData} />

            {/* Asset Allocation Chart */}
            <AssetAllocationChart assets={assets} marketData={marketData} />

            {/* Asset Performance Cards */}
            <AssetPerformanceCards assets={assets} marketData={marketData} />
        </div>
    );
};

export default PortfolioPerformance;
