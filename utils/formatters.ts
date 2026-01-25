// Data formatting

/**
 * Formats a number as currency
 * @param value - The number to format
 * @param currency - The currency code (defaults to 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = "USD"
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(value);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    return `${currency} ${value.toFixed(2)}`;
  }
}

/**
 * Formats a number as percentage
 * @param value - The number to format (e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places (defaults to 2)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  try {
    const percentage = value * 100;
    return `${percentage.toFixed(decimals)}%`;
  } catch (error) {
    return `${value}%`;
  }
}

/**
 * Formats a date string
 * @param date - Date string or Date object
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      throw new Error("Invalid date");
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    };

    return new Intl.DateTimeFormat("en-US", defaultOptions).format(dateObj);
  } catch (error) {
    return String(date);
  }
}

/**
 * Formats a number with specified decimal places
 * @param value - The number to format
 * @param decimals - Number of decimal places (defaults to 2)
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals: number = 2): string {
  try {
    if (isNaN(value)) {
      return "0";
    }
    return value.toFixed(decimals);
  } catch (error) {
    return String(value);
  }
}

/**
 * Truncates text to a maximum length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  try {
    if (typeof text !== "string") {
      return String(text);
    }
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength)}...`;
  } catch (error) {
    return String(text);
  }
}
