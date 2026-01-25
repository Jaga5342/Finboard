// Data fetching logic
import { fetchAPI } from "./api";
import { APIResponse } from "@/types/api";
import { Widget } from "@/types/widget";

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Rate limit entry interface
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory cache for API responses
 */
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Rate limit tracker (endpoint -> rate limit entry)
 */
const rateLimitTracker = new Map<string, RateLimitEntry>();

/**
 * Maximum requests per minute per endpoint
 */
const MAX_REQUESTS_PER_MINUTE = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

/**
 * Checks if an endpoint has exceeded rate limit
 * @param endpoint - The API endpoint URL
 * @returns true if rate limit is exceeded, false otherwise
 */
function isRateLimited(endpoint: string): boolean {
  const now = Date.now();
  const entry = rateLimitTracker.get(endpoint);

  if (!entry) {
    // First request, create entry
    rateLimitTracker.set(endpoint, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return false;
  }

  // Reset if window has passed
  if (now >= entry.resetTime) {
    rateLimitTracker.set(endpoint, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return false;
  }

  // Check if limit exceeded
  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    return true;
  }

  // Increment count
  entry.count++;
  return false;
}

/**
 * Gets the time until rate limit resets
 * @param endpoint - The API endpoint URL
 * @returns Time in milliseconds until reset, or 0 if not rate limited
 */
function getRateLimitResetTime(endpoint: string): number {
  const entry = rateLimitTracker.get(endpoint);
  if (!entry) return 0;
  const now = Date.now();
  return Math.max(0, entry.resetTime - now);
}

/**
 * Caches API response with TTL (Time To Live)
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttl - Time to live in milliseconds (default: 5 minutes)
 */
export function cacheData<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
  try {
    if (!key || typeof key !== "string") {
      throw new Error("Invalid cache key");
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    cache.set(key, entry as CacheEntry<unknown>);
  } catch (error) {
    console.error("Failed to cache data:", error);
  }
}

/**
 * Retrieves cached data if not expired
 * @param key - Cache key
 * @returns Cached data if available and not expired, null otherwise
 */
export function getCachedData<T>(key: string): T | null {
  try {
    if (!key || typeof key !== "string") {
      return null;
    }

    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if expired
    if (age > entry.ttl) {
      cache.delete(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error("Failed to get cached data:", error);
    return null;
  }
}

/**
 * Clears expired cache entries
 */
function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    const age = now - entry.timestamp;
    if (age > entry.ttl) {
      cache.delete(key);
    }
  }
}

/**
 * Clears all cache entries
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Fetches data for a widget with caching and rate limiting
 * @param apiUrl - The API URL to fetch data from
 * @param widgetId - Optional widget ID for cache key
 * @param useCache - Whether to use cache (default: true)
 * @param cacheTTL - Cache TTL in milliseconds (default: 5 minutes)
 * @returns Promise with APIResponse containing data or error
 */
export async function fetchWidgetData<T = unknown>(
  apiUrl: string,
  widgetId?: string,
  useCache: boolean = true,
  cacheTTL: number = 5 * 60 * 1000
): Promise<APIResponse<T>> {
  try {
    // Validate URL
    if (!apiUrl || typeof apiUrl !== "string") {
      return {
        success: false,
        error: {
          message: "Invalid API URL provided",
        },
      };
    }

    // Check rate limit
    if (isRateLimited(apiUrl)) {
      const resetTime = getRateLimitResetTime(apiUrl);
      return {
        success: false,
        error: {
          message: `Rate limit exceeded. Please wait ${Math.ceil(resetTime / 1000)} seconds before trying again.`,
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            resetTime,
            maxRequests: MAX_REQUESTS_PER_MINUTE,
          },
        },
      };
    }

    // Check cache if enabled
    if (useCache) {
      const cacheKey = widgetId ? `widget_${widgetId}_${apiUrl}` : apiUrl;
      const cachedData = getCachedData<T>(cacheKey);
      if (cachedData !== null) {
        return {
          success: true,
          data: cachedData,
        };
      }
    }

    // Clear expired cache entries periodically
    if (Math.random() < 0.1) {
      // 10% chance to clean up on each request
      clearExpiredCache();
    }

    // Fetch from API
    const response = await fetchAPI<T>(apiUrl);

    // Cache successful responses
    if (response.success && response.data && useCache) {
      const cacheKey = widgetId ? `widget_${widgetId}_${apiUrl}` : apiUrl;
      cacheData(cacheKey, response.data, cacheTTL);
    }

    return response;
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    };
  }
}

/**
 * Fetches data for multiple widgets efficiently
 * @param widgets - Array of widgets to fetch data for
 * @returns Promise with array of APIResponse results
 */
export async function fetchMultipleWidgetData(
  widgets: Widget[]
): Promise<Array<APIResponse<unknown>>> {
  try {
    // Fetch all widgets in parallel (respecting rate limits)
    const promises = widgets.map((widget) =>
      fetchWidgetData(widget.apiUrl, widget.id, true, widget.refreshInterval)
    );

    const results = await Promise.allSettled(promises);

    return results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      return {
        success: false,
        error: {
          message: result.reason?.message || "Failed to fetch widget data",
        },
      };
    });
  } catch (error) {
    return widgets.map(() => ({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    }));
  }
}
