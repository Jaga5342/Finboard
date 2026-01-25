// localStorage helpers

/**
 * Saves data to localStorage as JSON
 * @param key - The storage key
 * @param data - The data to save (will be stringified)
 * @throws Error if localStorage is not available or data cannot be stringified
 */
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      throw new Error("localStorage is not available");
    }
    const jsonString = JSON.stringify(data);
    window.localStorage.setItem(key, jsonString);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to save to localStorage: ${error.message}`);
    }
    throw new Error("Failed to save to localStorage: Unknown error");
  }
}

/**
 * Retrieves and parses JSON data from localStorage
 * @param key - The storage key
 * @returns The parsed data or null if not found
 * @throws Error if localStorage is not available or data cannot be parsed
 */
export function getFromLocalStorage<T>(key: string): T | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      throw new Error("localStorage is not available");
    }
    const item = window.localStorage.getItem(key);
    if (item === null) {
      return null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get from localStorage: ${error.message}`);
    }
    throw new Error("Failed to get from localStorage: Unknown error");
  }
}

/**
 * Removes an item from localStorage
 * @param key - The storage key to remove
 * @throws Error if localStorage is not available
 */
export function removeFromLocalStorage(key: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      throw new Error("localStorage is not available");
    }
    window.localStorage.removeItem(key);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to remove from localStorage: ${error.message}`);
    }
    throw new Error("Failed to remove from localStorage: Unknown error");
  }
}

/**
 * Exports dashboard configuration as a JSON file download
 * @param config - The dashboard configuration to export
 * @param filename - Optional filename (defaults to 'dashboard-config.json')
 * @throws Error if config cannot be stringified or download fails
 */
export function exportConfig<T>(config: T, filename: string = "dashboard-config.json"): void {
  try {
    const jsonString = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to export config: ${error.message}`);
    }
    throw new Error("Failed to export config: Unknown error");
  }
}

/**
 * Imports dashboard configuration from a JSON file
 * @param file - The file to import
 * @returns Promise that resolves to the parsed configuration
 * @throws Error if file cannot be read or parsed
 */
export async function importConfig<T>(file: File): Promise<T> {
  try {
    const text = await file.text();
    const config = JSON.parse(text) as T;
    return config;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to import config: ${error.message}`);
    }
    throw new Error("Failed to import config: Unknown error");
  }
}
