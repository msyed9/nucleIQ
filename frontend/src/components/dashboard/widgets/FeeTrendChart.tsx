import React from 'react';

type FeeTrendChartProps = {
    config?: Record<string, any>;
};

export const FeeTrendChart: React.FC<FeeTrendChartProps> = ({ config }) => {
    // Minimal stub for build — replace with real chart implementation
    void config;
    return <div style={{ padding: 8 }}>Fee Trend Chart (stub)</div>;
};

export default FeeTrendChart;
