import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, decimalPlaces: number = 3) {
  // Handle very small values (less than 0.01) with more decimal places
  if (value > 0 && value < 0.01) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(value);
  }

  // Standard formatting for normal values
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);

  return formatted;
}

/**
 * Format number with thousand separator (comma)
 * @param value - Number or string number to format
 * @returns Formatted string with thousand separator (e.g., "1,000" or "1,234.56")
 * @example
 * formatNumberWithSeparator(1000) // "1,000"
 * formatNumberWithSeparator("1234.56") // "1,234.56"
 * formatNumberWithSeparator("1000") // "1,000"
 */
export function formatNumberWithSeparator(value: string | number): string {
  if (!value && value !== 0) return "";

  // Convert to string and remove all non-digit characters except decimal point
  const stringValue = String(value);
  const cleanValue = stringValue.replace(/[^\d.]/g, "");

  // Handle empty or invalid input
  if (!cleanValue || cleanValue === ".") return cleanValue;

  // Split by decimal point
  const parts = cleanValue.split(".");
  const integerPart = parts[0] || "";
  const decimalPart = parts[1] || "";

  // Handle case where input starts with decimal point (e.g., ".1" -> "0.1")
  // But preserve user input if they're still typing (e.g., "0." should stay "0.")
  if (!integerPart && decimalPart) {
    return `0.${decimalPart}`;
  }

  // Add thousand separator to integer part (only if there's an integer part)
  const formattedInteger = integerPart
    ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : "";

  // Combine integer and decimal parts
  if (decimalPart !== undefined && decimalPart !== "") {
    // If user typed "0." or similar, preserve it
    return `${formattedInteger || "0"}.${decimalPart}`;
  }

  // If there's a decimal point but no decimal part (e.g., "1000."), preserve it
  if (cleanValue.endsWith(".")) {
    return `${formattedInteger || "0"}.`;
  }

  return formattedInteger || "0";
}

/**
 * Parse number from formatted string (remove thousand separators)
 * @param value - Formatted string with separators
 * @returns Clean number string without separators
 * @example
 * parseNumberFromSeparator("1,000") // "1000"
 * parseNumberFromSeparator("1,234.56") // "1234.56"
 */
export function parseNumberFromSeparator(value: string): string {
  if (!value) return "";

  // Remove all non-digit characters except decimal point
  return value.replace(/[^\d.]/g, "");
}

/**
 * Handle input change for number with separator
 * Formats display value but returns clean numeric value
 * @param value - Raw input value
 * @param onChange - Callback with formatted display value and clean numeric value
 * @example
 * handleNumberInputChange("1000", (display, numeric) => {
 *   setDisplayValue(display); // "1,000"
 *   setNumericValue(numeric); // "1000"
 * });
 */
export function handleNumberInputChange(
  value: string,
  onChange: (displayValue: string, numericValue: string) => void,
): void {
  // Parse to get clean numeric value
  const numericValue = parseNumberFromSeparator(value);

  // Format for display
  const displayValue = formatNumberWithSeparator(numericValue);

  // Call onChange with both values
  onChange(displayValue, numericValue);
}

/**
 * Generate random percentage APR with average around 7-10%
 * @param min - Minimum percentage (default: 5)
 * @param max - Maximum percentage (default: 12)
 * @returns Formatted string with 1 decimal place using comma as separator (e.g., "7,2%", "8,5%")
 * @example
 * generateRandomAPR() // "7,2%"
 * generateRandomAPR(6, 10) // "8,5%"
 */
export function generateRandomAPR(min: number = 5, max: number = 12): string {
  // Generate random number between min and max with 1 decimal place
  const randomValue = Math.random() * (max - min) + min;
  const roundedValue = Math.round(randomValue * 10) / 10; // Round to 1 decimal place

  // Format with comma as decimal separator (matching existing format "7,2%")
  return roundedValue.toFixed(1).replace(".", ",") + "%";
}

/**
 * Format date to "DD MMM YYYY" format (e.g., "22 Oct 2025")
 * @param date - Date object or timestamp
 * @returns Formatted date string
 * @example
 * formatDate(new Date()) // "22 Oct 2025"
 * formatDate(1698000000000) // "22 Oct 2023"
 */
export function formatDate(date: Date | number): string {
  const dateObj = typeof date === "number" ? new Date(date) : date;
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString("en-US", { month: "short" });
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Parse date string from "DD MMM YYYY" format (e.g., "1 Feb 2026") to Date object
 * @param dateString - Date string in "DD MMM YYYY" format
 * @returns Date object or null if invalid
 * @example
 * parseDateString("1 Feb 2026") // Date object for Feb 1, 2026
 */
export function parseDateString(dateString: string): Date | null {
  try {
    // Parse format like "1 Feb 2026" or "19 Jan 2026"
    const parts = dateString.trim().split(" ");
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];
    const year = parseInt(parts[2], 10);

    // Map month abbreviations to month index (0-11)
    const monthMap: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    const month = monthMap[monthStr];
    if (month === undefined || isNaN(day) || isNaN(year)) return null;

    return new Date(year, month, day);
  } catch {
    return null;
  }
}

/**
 * Calculate difference in days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days difference (date2 - date1)
 * @example
 * calculateDaysDifference(new Date(2026, 0, 20), new Date(2026, 1, 1)) // 12
 */
export function calculateDaysDifference(date1: Date, date2: Date): number {
  const timeDiff = date2.getTime() - date1.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}
