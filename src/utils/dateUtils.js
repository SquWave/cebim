/**
 * Utility functions for date range calculations
 * Used by WalletAnalysis, CashFlowComparison, and SpendingCharts
 */

/**
 * Get the start and end dates for a given date filter
 * @param {string} dateFilter - Filter type ('today', 'week', 'month', 'year', '7days', '30days', '3months', '6months', '1year', 'custom')
 * @param {object} customRange - Custom date range { start: string, end: string }
 * @returns {object} { start: Date, end: Date }
 */
export const getDateRange = (dateFilter, customRange = {}) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (dateFilter) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'week':
            // Start of week (Monday)
            const day = now.getDay() || 7; // Get current day number, converting Sun (0) to 7
            if (day !== 1) start.setHours(-24 * (day - 1));
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'month':
            // Start of month (1st day)
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'year':
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case '7days':
            start.setDate(now.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            end = now;
            break;
        case '30days':
            start.setDate(now.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            end = now;
            break;
        case '3months':
            start.setMonth(now.getMonth() - 3);
            start.setHours(0, 0, 0, 0);
            end = now;
            break;
        case '6months':
            start.setMonth(now.getMonth() - 6);
            start.setHours(0, 0, 0, 0);
            end = now;
            break;
        case '1year':
            start.setFullYear(now.getFullYear() - 1);
            start.setHours(0, 0, 0, 0);
            end = now;
            break;
        case 'custom':
            if (customRange.start) start = new Date(customRange.start);
            if (customRange.end) end = new Date(customRange.end);
            // Adjust end date to end of day if it's just a date string
            if (customRange.end && customRange.end.length <= 10) {
                end.setHours(23, 59, 59, 999);
            }
            break;
        default:
            break;
    }

    return { start, end };
};

/**
 * Get both current and previous period date ranges for comparison
 * @param {string} dateFilter - Filter type
 * @param {object} customRange - Custom date range { start: string, end: string }
 * @returns {object|null} { start, end, prevStart, prevEnd } or null if invalid
 */
export const getPeriodRanges = (dateFilter, customRange = {}) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();

    switch (dateFilter) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            prevStart.setDate(start.getDate() - 1);
            prevStart.setHours(0, 0, 0, 0);
            prevEnd.setDate(end.getDate() - 1);
            prevEnd.setHours(23, 59, 59, 999);
            break;
        case 'week':
            const day = now.getDay() || 7;
            if (day !== 1) start.setHours(-24 * (day - 1));
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            prevStart = new Date(start);
            prevStart.setDate(start.getDate() - 7);
            prevEnd = new Date(end);
            prevEnd.setDate(end.getDate() - 7);
            break;
        case 'month':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            prevStart = new Date(start);
            prevStart.setMonth(start.getMonth() - 1);
            prevEnd = new Date(end);
            prevEnd.setMonth(end.getMonth() - 1);
            // Handle month end overflow
            const lastDayPrevMonth = new Date(prevStart.getFullYear(), prevStart.getMonth() + 1, 0).getDate();
            if (prevEnd.getDate() > lastDayPrevMonth) prevEnd.setDate(lastDayPrevMonth);
            break;
        case 'year':
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            prevStart = new Date(start);
            prevStart.setFullYear(start.getFullYear() - 1);
            prevEnd = new Date(end);
            prevEnd.setFullYear(end.getFullYear() - 1);
            break;
        case '7days':
            start.setDate(now.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            end = now;
            prevStart = new Date(start);
            prevStart.setDate(start.getDate() - 7);
            prevEnd = new Date(end);
            prevEnd.setDate(end.getDate() - 7);
            break;
        case '30days':
            start.setDate(now.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            end = now;
            prevStart = new Date(start);
            prevStart.setDate(start.getDate() - 30);
            prevEnd = new Date(end);
            prevEnd.setDate(end.getDate() - 30);
            break;
        case '3months':
            start.setMonth(now.getMonth() - 3);
            start.setHours(0, 0, 0, 0);
            end = now;
            prevStart = new Date(start);
            prevStart.setMonth(start.getMonth() - 3);
            prevEnd = new Date(end);
            prevEnd.setMonth(end.getMonth() - 3);
            break;
        case '6months':
            start.setMonth(now.getMonth() - 6);
            start.setHours(0, 0, 0, 0);
            end = now;
            prevStart = new Date(start);
            prevStart.setMonth(start.getMonth() - 6);
            prevEnd = new Date(end);
            prevEnd.setMonth(end.getMonth() - 6);
            break;
        case '1year':
            start.setFullYear(now.getFullYear() - 1);
            start.setHours(0, 0, 0, 0);
            end = now;
            prevStart = new Date(start);
            prevStart.setFullYear(start.getFullYear() - 1);
            prevEnd = new Date(end);
            prevEnd.setFullYear(end.getFullYear() - 1);
            break;
        case 'custom':
            if (customRange.start) start = new Date(customRange.start);
            if (customRange.end) end = new Date(customRange.end);
            if (customRange.end && customRange.end.length <= 10) end.setHours(23, 59, 59, 999);

            // For custom, previous period is same duration before start
            const duration = end - start;
            prevEnd = new Date(start.getTime() - 1);
            prevStart = new Date(prevEnd.getTime() - duration);
            break;
        default:
            return null;
    }

    return { start, end, prevStart, prevEnd };
};

/**
 * Filter transactions by date range
 * @param {Array} transactions - Array of transactions with date property
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {Array} Filtered transactions
 */
export const filterTransactionsByDateRange = (transactions, start, end) => {
    return transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= start && tDate <= end;
    });
};
