export type ShapeType = "rect" | "circle" | "triangle" | "line" | "text";

export interface CanvasObject {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  version?: number;
  // Line-specific properties
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}
