// API client
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";
import { APIResponse, APIError, FieldType } from "@/types/api";

/**
 * Axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
  // API keys should be set via environment variables or request interceptors
  // Do not hardcode API keys in the code
});

/**
 * Request interceptor to add API keys from environment variables
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add API key from environment variable if available
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (apiKey && config.headers) {
      config.headers["Authorization"] = `Bearer ${apiKey}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle different types of errors
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout: The API took too long to respond");
    }
    if (error.code === "ERR_NETWORK") {
      throw new Error("Network error: Unable to connect to the API");
    }
    if (error.code === "ERR_CANCELED") {
      throw new Error("Request canceled");
    }
    return Promise.reject(error);
  }
);

/**
 * Determines the type of a field value
 * @param value - The value to determine the type of
 * @returns FieldType enum value
 */
export function getFieldType(value: unknown): FieldType {
  if (value === null || value === undefined) {
    return FieldType.STRING;
  }
  if (typeof value === "string") {
    // Check if it's a date string
    if (!isNaN(Date.parse(value)) && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return FieldType.DATE;
    }
    return FieldType.STRING;
  }
  if (typeof value === "number") {
    return FieldType.NUMBER;
  }
  if (typeof value === "boolean") {
    return FieldType.BOOLEAN;
  }
  if (Array.isArray(value)) {
    return FieldType.ARRAY;
  }
  if (typeof value === "object") {
    return FieldType.OBJECT;
  }
  return FieldType.STRING;
}

/**
 * Recursively extracts all fields from JSON response
 * @param data - The data object to extract fields from
 * @param path - Current path in the object (for nested fields)
 * @returns Array of field objects with name, path, type, and displayName
 */
export function extractFields(
  data: unknown,
  path: string = ""
): Array<{ name: string; path: string; type: FieldType; displayName: string }> {
  const fields: Array<{
    name: string;
    path: string;
    type: FieldType;
    displayName: string;
  }> = [];

  if (data === null || data === undefined) {
    return fields;
  }

  if (Array.isArray(data)) {
    // If it's an array, extract fields from the first element
    if (data.length > 0) {
      const arrayFields = extractFields(data[0], path);
      fields.push(...arrayFields);
    }
    return fields;
  }

  if (typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      const currentPath = path ? `${path}.${key}` : key;
      const fieldType = getFieldType(value);

      // Add the field
      fields.push({
        name: key,
        path: currentPath,
        type: fieldType,
        displayName: key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim(),
      });

      // If it's an object or array, recursively extract nested fields
      if (fieldType === FieldType.OBJECT || fieldType === FieldType.ARRAY) {
        const nestedFields = extractFields(value, currentPath);
        fields.push(...nestedFields);
      }
    }
  } else {
    // Primitive value at root level
    fields.push({
      name: "value",
      path: path || "value",
      type: getFieldType(data),
      displayName: "Value",
    });
  }

  return fields;
}

/**
 * Creates an API error object from various error types
 * @param error - The error to convert
 * @returns APIError object
 */
function createAPIError(error: unknown): APIError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    return {
      message: axiosError.message || "API request failed",
      code: axiosError.code,
      status: axiosError.response?.status,
      details: axiosError.response?.data,
    };
  }
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }
  return {
    message: "Unknown error occurred",
  };
}

/**
 * Fetches data from any API URL
 * @param url - The API URL to fetch from
 * @param config - Optional axios request configuration
 * @returns Promise with APIResponse containing data or error
 */
const requestCache = new Map<string, { promise: Promise<APIResponse<any>>; timestamp: number }>();
const CACHE_TTL = 2000;

export async function fetchAPI<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<APIResponse<T>> {
  const cacheKey = `${url}-${JSON.stringify(config?.params)}`;
  const cached = requestCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.promise as Promise<APIResponse<T>>;
  }

  const executeRequest = async (): Promise<APIResponse<T>> => {
    try {
      if (!url || typeof url !== "string") {
        throw new Error("Invalid URL provided");
      }

      try {
        new URL(url);
      } catch {
        throw new Error("Invalid URL format");
      }

      const response = await apiClient.get<T>(url, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (
          axiosError.code === "ERR_NETWORK" ||
          axiosError.message.includes("CORS")
        ) {
          return {
            success: false,
            error: {
              message: "CORS error: The API does not allow requests from this origin",
              code: "CORS_ERROR",
              status: 0,
            },
          };
        }

        if (axiosError.response?.status === 429) {
          return {
            success: false,
            error: {
              message: "Rate limit exceeded: Too many requests. Please try again later.",
              code: "RATE_LIMIT",
              status: 429,
              details: axiosError.response.data,
            },
          };
        }

        if (axiosError.response) {
          return {
            success: false,
            error: createAPIError(error),
          };
        }
      }

      return {
        success: false,
        error: createAPIError(error),
      };
    }
  };

  const requestPromise = executeRequest();
  requestCache.set(cacheKey, { promise: requestPromise, timestamp: Date.now() });

  requestPromise.finally(() => {
    setTimeout(() => {
      if (requestCache.get(cacheKey)?.timestamp === requestCache.get(cacheKey)?.timestamp) {
        requestCache.delete(cacheKey);
      }
    }, CACHE_TTL);
  });

  return requestPromise;
}

/**
 * Tests if API is accessible and returns available fields
 * @param url - The API URL to test
 * @returns Promise with test result and available fields
 */
export async function testAPIConnection(
  url: string
): Promise<{
  success: boolean;
  accessible: boolean;
  fields: Array<{
    name: string;
    path: string;
    type: FieldType;
    displayName: string;
  }>;
  data?: unknown;
  error?: APIError;
}> {
  try {
    const response = await fetchAPI(url);

    if (!response.success || !response.data) {
      return {
        success: false,
        accessible: false,
        fields: [],
        error: response.error,
      };
    }

    const fields = extractFields(response.data);
    return {
      success: true,
      accessible: true,
      fields,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      accessible: false,
      fields: [],
      error: createAPIError(error),
    };
  }
}

// Export the axios instance for advanced usage
export { apiClient };
