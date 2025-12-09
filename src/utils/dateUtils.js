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
            start = new Date(now);
            start.setDate(now.getDate() - (day - 1));
            start.setHours(0, 0, 0, 0);
            // End is capped at now if week hasn't ended
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            if (end > now) end = new Date(now);
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
    let start, end, prevStart, prevEnd;

    switch (dateFilter) {
        case 'today':
            // Today: 00:00 - 23:59
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            // Previous: Yesterday
            prevStart = new Date(start);
            prevStart.setDate(prevStart.getDate() - 1);
            prevEnd = new Date(prevStart);
            prevEnd.setHours(23, 59, 59, 999);
            break;

        case 'week':
            // This week: Monday 00:00 - Now (or Sunday 23:59 if week ended)
            const dayOfWeek = now.getDay() || 7; // Convert Sunday (0) to 7
            start = new Date(now);
            start.setDate(now.getDate() - (dayOfWeek - 1));
            start.setHours(0, 0, 0, 0);
            end = new Date(now); // End is now (current moment)
            // Previous week: Previous Monday 00:00 - Previous Sunday 23:59
            prevStart = new Date(start);
            prevStart.setDate(prevStart.getDate() - 7);
            prevEnd = new Date(prevStart);
            prevEnd.setDate(prevEnd.getDate() + 6);
            prevEnd.setHours(23, 59, 59, 999);
            break;

        case 'month':
            // This month: 1st of month 00:00 - Now
            start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            end = new Date(now);
            // Previous month: 1st of previous month - Last day of previous month
            prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999); // Day 0 = last day of prev month
            break;

        case 'year':
            // This year: Jan 1st 00:00 - Now
            start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            end = new Date(now);
            // Previous year: Jan 1st - Dec 31st of previous year
            prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
            prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
            break;

        case '7days':
            // Last 7 days: 7 days ago 00:00 - Now
            start = new Date(now);
            start.setDate(now.getDate() - 6); // Include today = 7 days
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            // Previous 7 days: 14 days ago - 8 days ago
            prevStart = new Date(start);
            prevStart.setDate(prevStart.getDate() - 7);
            prevEnd = new Date(start);
            prevEnd.setDate(prevEnd.getDate() - 1);
            prevEnd.setHours(23, 59, 59, 999);
            break;

        case '30days':
            // Last 30 days: 30 days ago 00:00 - Now
            start = new Date(now);
            start.setDate(now.getDate() - 29); // Include today = 30 days
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            // Previous 30 days: 60 days ago - 31 days ago
            prevStart = new Date(start);
            prevStart.setDate(prevStart.getDate() - 30);
            prevEnd = new Date(start);
            prevEnd.setDate(prevEnd.getDate() - 1);
            prevEnd.setHours(23, 59, 59, 999);
            break;

        case '3months':
            // Last 3 months: 3 months ago - Now
            start = new Date(now);
            start.setMonth(now.getMonth() - 3);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            // Previous 3 months: 6 months ago - 3 months ago
            prevStart = new Date(start);
            prevStart.setMonth(prevStart.getMonth() - 3);
            prevEnd = new Date(start);
            prevEnd.setDate(prevEnd.getDate() - 1);
            prevEnd.setHours(23, 59, 59, 999);
            break;

        case '6months':
            // Last 6 months: 6 months ago - Now
            start = new Date(now);
            start.setMonth(now.getMonth() - 6);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            // Previous 6 months: 12 months ago - 6 months ago
            prevStart = new Date(start);
            prevStart.setMonth(prevStart.getMonth() - 6);
            prevEnd = new Date(start);
            prevEnd.setDate(prevEnd.getDate() - 1);
            prevEnd.setHours(23, 59, 59, 999);
            break;

        case '1year':
            // Last 1 year: 1 year ago - Now
            start = new Date(now);
            start.setFullYear(now.getFullYear() - 1);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            // Previous 1 year: 2 years ago - 1 year ago
            prevStart = new Date(start);
            prevStart.setFullYear(prevStart.getFullYear() - 1);
            prevEnd = new Date(start);
            prevEnd.setDate(prevEnd.getDate() - 1);
            prevEnd.setHours(23, 59, 59, 999);
            break;

        case 'custom':
            if (customRange.start) start = new Date(customRange.start);
            if (customRange.end) end = new Date(customRange.end);
            if (!start || !end) return null;
            if (customRange.end && customRange.end.length <= 10) end.setHours(23, 59, 59, 999);

            // For custom, previous period is same duration before start
            const duration = end.getTime() - start.getTime();
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
