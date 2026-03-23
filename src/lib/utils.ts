import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}..${address.slice(-chars)}`;
}

/**
 * Truncate (floor) a number to N decimal places and format with thousand separators.
 * Unlike toLocaleString/toFixed which round, this always floors — safe for balance display.
 */
export function truncateBalance(value: number, decimals: number = 3): string {
  const factor = Math.pow(10, decimals);
  const truncated = Math.floor(value * factor) / factor;
  return truncated.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
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
 * Format a number with thousand separators but no currency symbol.
 * Use this when displaying amounts alongside a token symbol (e.g. "1,000.00 USDC").
 */
export function formatNumber(value: number, decimalPlaces: number = 3): string {
  if (value > 0 && value < 0.01) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
}

export function formatCompactCurrency(
  value: number,
  decimalPlaces: number = 2,
): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  const tiers: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
  ];

  for (const [threshold, suffix] of tiers) {
    if (abs >= threshold) {
      const scaled = Math.abs(value / threshold);
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(scaled);
      return `${sign}$${formatted}${suffix}`;
    }
  }

  return formatCurrency(value, decimalPlaces);
}

/**
 * Returns { integer, decimal } so UI can style decimal part (e.g. muted).
 * Uses formatCurrency internally.
 * @param value - Number to format
 * @param decimalPlaces - Optional decimal places (default from formatCurrency)
 * @returns Object with integer and decimal parts; decimal is empty if no decimal
 */
export function formatCurrencyParts(
  value: number,
  decimalPlaces: number = 3,
): { integer: string; decimal: string } {
  const formatted = formatCurrency(value, decimalPlaces);
  const idx = formatted.lastIndexOf(".");
  if (idx === -1) return { integer: formatted, decimal: "" };
  return {
    integer: formatted.slice(0, idx),
    decimal: formatted.slice(idx),
  };
}

/**
 * Map token symbol to URL slug for market page.
 * @param symbol - Token symbol (e.g. "USDC", "xsgd")
 * @returns Slug for ?token= query (e.g. "usdc"), fallback "usdc"
 */
export function getTokenSlug(symbol: string): string {
  return symbol.toLowerCase();
}

/**
 * Check if a nav href is active given current pathname and optional path aliases.
 * @param pathname - Current pathname
 * @param href - Nav item href
 * @param pathAliases - Optional map href -> paths that count as active (e.g. "/" -> ["/", "/market"])
 */
export function isPathActive(
  pathname: string,
  href: string,
  pathAliases?: Record<string, string[]>,
): boolean {
  const aliases = pathAliases?.[href];
  if (aliases) return aliases.includes(pathname);
  return pathname === href;
}

/**
 * Detect if the platform is Mac/iOS (for modifier key in shortcuts).
 */
export function isMacPlatform(): boolean {
  return typeof navigator !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
}

/**
 * Random integer in range [min, max] (inclusive).
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 */
export function randomIntInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get selected token from list by URL param; fallback to preferredValue then first item.
 * @param tokenList - List of tokens with .value
 * @param param - searchParams.get("token") (or null)
 * @param preferredValue - Fallback value if param missing/invalid (e.g. "usdc")
 */
export function getSelectedTokenFromParams<T extends { value: string }>(
  tokenList: T[],
  param: string | null,
  preferredValue: string,
): T {
  const value = (param ?? preferredValue).toLowerCase();
  const found = tokenList.find((t) => t.value === value);
  if (found) return found;
  const preferred = tokenList.find((t) => t.value === preferredValue);
  return preferred ?? tokenList[0];
}

/**
 * Get token from list by preferred value, else first item.
 * @param list - List with .value
 * @param preferredValue - e.g. "usdc" or "usdt"
 */
export function getDefaultTokenFromList<T extends { value: string }>(
  list: T[],
  preferredValue: string,
): T | undefined {
  return list.find((t) => t.value === preferredValue) ?? list[0];
}

/**
 * Get token value (slug) from list by symbol/label (e.g. "USDC" -> "usdc").
 * @param list - List with .label and .value
 * @param symbol - Token symbol or label (case-insensitive)
 * @returns Token value or symbol lowercased when not found
 */
export function getTokenValueFromList<T extends { label: string; value: string }>(
  list: T[],
  symbol: string,
): string {
  const token = list.find(
    (t) =>
      t.label.toUpperCase() === symbol.toUpperCase() ||
      t.value.toUpperCase() === symbol.toUpperCase(),
  );
  return token?.value ?? symbol.toLowerCase();
}

/**
 * Read a number from localStorage (SSR-safe). Returns defaultValue if missing, invalid, or not in browser.
 */
export function getLocalStorageNumber(key: string, defaultValue: number): number {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  if (stored == null) return defaultValue;
  const n = parseFloat(stored);
  return Number.isFinite(n) ? n : defaultValue;
}

/**
 * Read JSON from localStorage (SSR-safe). Optionally transform (e.g. migrate) after parse. Returns defaultValue if missing, invalid, or not in browser.
 */
export function getLocalStorageJson<T>(
  key: string,
  defaultValue: T,
  migrate?: (parsed: T) => T,
): T {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  if (stored == null) return defaultValue;
  try {
    let parsed = JSON.parse(stored) as T;
    if (migrate) parsed = migrate(parsed);
    return parsed;
  } catch {
    return defaultValue;
  }
}

/**
 * Migrate portfolio object from storage (key renames and add missing default keys). Does not mutate input.
 */
export function migratePortfolioFromStorage(
  parsed: Record<string, number>,
  defaultPortfolio: Record<string, number>,
): Record<string, number> {
  const copy = { ...parsed };
  if (copy.aave != null && copy.xaut === undefined) {
    copy.xaut = copy.aave;
    delete copy.aave;
  }
  if (parsed.nvda !== undefined && copy.nvdaon === undefined) {
    copy.nvdaon = parsed.nvda;
    delete copy.nvda;
  }
  for (const key of Object.keys(defaultPortfolio)) {
    if (copy[key] === undefined || (key === "slvon" && copy[key] === 0)) {
      copy[key] = defaultPortfolio[key];
    }
  }
  return copy;
}

/**
 * Percentage of part of total, rounded (0 if total <= 0).
 */
export function toPercent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/**
 * Map health factor number to status label.
 */
export function getHealthFactorStatus(
  healthFactor: number,
): "Safe" | "Good" | "Warning" | "Critical" {
  if (healthFactor >= 2.0) return "Safe";
  if (healthFactor >= 1.5) return "Good";
  if (healthFactor >= 1.0) return "Warning";
  return "Critical";
}

export type HealthFactorDisplayStatus =
  | "Excellent"
  | "Good"
  | "Warning"
  | "Critical"
  | "Danger";

export type HealthFactorBadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive";

/**
 * Map health factor number to display status and badge variant.
 * Thresholds: >= 2.5 Excellent, >= 1.5 Good, >= 1.2 Warning, >= 1.0 Critical, < 1.0 Danger
 */
export function getHealthFactorDisplayStatus(
  healthFactor: number,
): {
  value: string;
  status: HealthFactorDisplayStatus;
  variant: HealthFactorBadgeVariant;
} {
  const hf = healthFactor;
  if (hf >= 2.5)
    return { value: hf.toFixed(2), status: "Excellent", variant: "success" };
  if (hf >= 1.5) return { value: hf.toFixed(2), status: "Good", variant: "default" };
  if (hf >= 1.2)
    return { value: hf.toFixed(2), status: "Warning", variant: "warning" };
  if (hf >= 1.0)
    return { value: hf.toFixed(2), status: "Critical", variant: "warning" };
  return { value: hf.toFixed(2), status: "Danger", variant: "destructive" };
}

/**
 * Map health factor to percentage for progress bar display.
 * Thresholds: HF >= 2.5 (100%), >= 1.5 (75-100%), >= 1.2 (50-75%), >= 1.0 (25-50%), < 1.0 (0-25%)
 */
export function getHealthFactorPercentage(healthFactor: number): number {
  if (healthFactor <= 0) return 0;
  if (healthFactor >= 2.5) return 100;
  if (healthFactor >= 1.5) return 75 + ((healthFactor - 1.5) / 1.0) * 25;
  if (healthFactor >= 1.2) return 50 + ((healthFactor - 1.2) / 0.3) * 25;
  if (healthFactor >= 1.0) return 25 + ((healthFactor - 1.0) / 0.2) * 25;
  return (healthFactor / 1.0) * 25;
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
  return `${roundedValue.toFixed(1).replace(".", ",")}%`;
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
    if (month === undefined || Number.isNaN(day) || Number.isNaN(year)) return null;

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

/**
 * Calculate future amount with simple interest.
 * Formula: amount + (amount * rate% / 365 * (maturity date - current date))
 *
 * @param amount - Principal amount
 * @param aprPercent - APR as percentage (e.g., 6.9 for 6.9%, 10 for 10%)
 * @param maturityTimestamp - Maturity date as Unix timestamp (ms)
 * @returns Future amount (principal + interest), or amount if invalid inputs
 */
export function calculateFutureAmount(
  amount: number,
  aprPercent: number,
  maturityTimestamp: number,
): number {
  if (amount <= 0 || aprPercent <= 0) return amount;

  const currentDate = new Date();
  const maturityDateObj = new Date(maturityTimestamp);

  const days = calculateDaysDifference(currentDate, maturityDateObj);
  if (days <= 0) return amount;

  return Number((amount + (amount * (aprPercent / 100) / 365 * days)).toFixed(2));
}

/**
 * Calculate profit (interest only) over an elapsed period with simple interest.
 * Formula: amount * rate% / 365 * (end date - start date in days)
 *
 * @param amount - Principal amount
 * @param aprPercent - APR as percentage (e.g., 6.9 for 6.9%, 10 for 10%)
 * @param startTimestamp - Start date as Unix timestamp (ms)
 * @param endTimestamp - End date as Unix timestamp (ms); defaults to now when omitted
 * @returns Profit (interest) amount, or 0 if invalid inputs or non-positive elapsed days
 */
export function calculateProfitAmount(
  amount: number,
  aprPercent: number,
  startTimestamp: number,
  endTimestamp?: number,
): number {
  if (amount <= 0 || aprPercent <= 0) return 0;

  const startDateObj = new Date(startTimestamp);
  const endDateObj = new Date(endTimestamp ?? Date.now());

  const days = calculateDaysDifference(startDateObj, endDateObj);
  if (days <= 0) return 0;

  return Number((amount * (aprPercent / 100) / 365 * days).toFixed(2));
}
