// API response types

/**
 * Field type enum - defines the data type of a field
 */
export enum FieldType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  DATE = "DATE",
  OBJECT = "OBJECT",
  ARRAY = "ARRAY",
}

/**
 * API error response structure
 */
export interface APIError {
  message: string;
  code?: string | number;
  status?: number;
  details?: unknown;
}

/**
 * Generic API response type
 * @template T - The type of data in the response
 */
export interface APIResponse<T = unknown> {
  data?: T;
  error?: APIError;
  success: boolean;
  message?: string;
}
