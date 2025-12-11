/**
 * Utility functions for formatting values
 */

/**
 * Format a number as Turkish Lira currency
 * @param {number} value - The value to format
 * @param {boolean} privacyMode - If true, hides the value
 * @returns {string} Formatted currency string (e.g., "₺1.234,56")
 */
export const formatCurrency = (value, privacyMode = false) => {
    if (privacyMode) return '₺***';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(value);
};

/**
 * Safely parse a number, handling Turkish decimal format (comma as decimal separator)
 * @param {any} val - The value to parse
 * @returns {number} Parsed number or 0 if invalid
 */
export const safeNumber = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const strVal = String(val);
    // Handle Turkish format where comma is decimal separator
    if (strVal.includes(',') && !strVal.includes('.')) {
        return Number(strVal.replace(',', '.'));
    }
    return Number(strVal) || 0;
};

/**
 * Format a date for datetime-local input (YYYY-MM-DDTHH:mm)
 * @param {Date|string} dateInput - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateForInput = (dateInput) => {
    const date = dateInput ? (dateInput instanceof Date ? dateInput : new Date(dateInput)) : new Date();
    const pad = (num) => String(num).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};
