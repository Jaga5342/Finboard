// Widget types
import { FieldType } from "./api";

/**
 * Widget type enum - defines the type of widget
 */
export enum WidgetType {
  CARD = "CARD",
  TABLE = "TABLE",
  CHART = "CHART",
}

/**
 * Display mode enum - defines how the widget should be displayed
 */
export enum DisplayMode {
  CARD = "CARD",
  TABLE = "TABLE",
  CHART = "CHART",
}

/**
 * Widget field definition - defines a field to display from the API response
 */
export interface WidgetField {
  name: string;
  path: string;
  type: FieldType;
  displayName: string;
}

/**
 * Position coordinates for widget placement
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Size dimensions for widget
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Widget configuration - main widget type definition
 */
export interface Widget {
  id: string;
  name: string;
  type: WidgetType;
  apiUrl: string;
  refreshInterval: number; // in milliseconds
  selectedFields: WidgetField[];
  displayMode: DisplayMode;
  position: Position;
  size: Size;
}
