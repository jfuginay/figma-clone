import * as fabric from "fabric";
import { CanvasObject, ShapeType } from "@/types/canvas";

/**
 * Serialize a Fabric object to Liveblocks format
 */
export function serializeFabricObject(
  fabricObject: fabric.Object
): CanvasObject | null {
  const id = (fabricObject as fabric.Object & { id?: string }).id;
  if (!id) {
    console.warn("Fabric object missing id, skipping serialization");
    return null;
  }

  const baseObject = {
    id,
    x: fabricObject.left || 0,
    y: fabricObject.top || 0,
    width: (fabricObject.width || 0) * (fabricObject.scaleX || 1),
    height: (fabricObject.height || 0) * (fabricObject.scaleY || 1),
    fill: (fabricObject.fill as string) || "#000000",
    stroke: fabricObject.stroke as string | undefined,
    strokeWidth: fabricObject.strokeWidth,
    scaleX: fabricObject.scaleX,
    scaleY: fabricObject.scaleY,
    angle: fabricObject.angle || 0,
    version: (fabricObject as fabric.Object & { version?: number }).version || 0,
  };

  // Determine shape type and add type-specific properties
  if (fabricObject instanceof fabric.Rect) {
    return {
      ...baseObject,
      type: "rect" as ShapeType,
    };
  } else if (fabricObject instanceof fabric.Circle) {
    return {
      ...baseObject,
      type: "circle" as ShapeType,
    };
  } else if (fabricObject instanceof fabric.Triangle) {
    return {
      ...baseObject,
      type: "triangle" as ShapeType,
    };
  } else if (fabricObject instanceof fabric.Line) {
    return {
      ...baseObject,
      type: "line" as ShapeType,
      x1: (fabricObject as fabric.Line).x1,
      y1: (fabricObject as fabric.Line).y1,
      x2: (fabricObject as fabric.Line).x2,
      y2: (fabricObject as fabric.Line).y2,
    };
  } else if (fabricObject instanceof fabric.IText) {
    return {
      ...baseObject,
      type: "text" as ShapeType,
      text: (fabricObject as fabric.IText).text,
      fontSize: (fabricObject as fabric.IText).fontSize,
      fontFamily: (fabricObject as fabric.IText).fontFamily,
    };
  }

  console.warn("Unknown fabric object type, skipping serialization");
  return null;
}

/**
 * Deserialize a Liveblocks object to Fabric format
 */
export function deserializeLiveblocksObject(
  lbObject: CanvasObject
): fabric.Object | null {
  let fabricObject: fabric.Object | null = null;

  const commonProps = {
    left: lbObject.x,
    top: lbObject.y,
    fill: lbObject.fill,
    stroke: lbObject.stroke,
    strokeWidth: lbObject.strokeWidth,
    scaleX: lbObject.scaleX || 1,
    scaleY: lbObject.scaleY || 1,
    angle: lbObject.angle || 0,
  };

  switch (lbObject.type) {
    case "rect":
      fabricObject = new fabric.Rect({
        ...commonProps,
        width: lbObject.width / (lbObject.scaleX || 1),
        height: lbObject.height / (lbObject.scaleY || 1),
      });
      break;

    case "circle":
      fabricObject = new fabric.Circle({
        ...commonProps,
        radius: lbObject.width / 2 / (lbObject.scaleX || 1),
      });
      break;

    case "triangle":
      fabricObject = new fabric.Triangle({
        ...commonProps,
        width: lbObject.width / (lbObject.scaleX || 1),
        height: lbObject.height / (lbObject.scaleY || 1),
      });
      break;

    case "line":
      fabricObject = new fabric.Line(
        [
          lbObject.x1 || 0,
          lbObject.y1 || 0,
          lbObject.x2 || 0,
          lbObject.y2 || 0,
        ],
        {
          left: lbObject.x,
          top: lbObject.y,
          stroke: lbObject.stroke || lbObject.fill,
          strokeWidth: lbObject.strokeWidth || 2,
          scaleX: lbObject.scaleX || 1,
          scaleY: lbObject.scaleY || 1,
          angle: lbObject.angle || 0,
        }
      );
      break;

    case "text":
      fabricObject = new fabric.IText(lbObject.text || "Text", {
        ...commonProps,
        fontSize: lbObject.fontSize || 20,
        fontFamily: lbObject.fontFamily || "Arial",
      });
      break;

    default:
      console.warn(`Unknown shape type: ${lbObject.type}`);
      return null;
  }

  if (fabricObject) {
    // Store metadata on the fabric object
    (fabricObject as fabric.Object & { id: string; version: number }).id = lbObject.id;
    (fabricObject as fabric.Object & { id: string; version: number }).version = lbObject.version || 0;
  }

  return fabricObject;
}

/**
 * Update an existing Fabric object with data from Liveblocks
 */
export function updateFabricObject(
  fabricObject: fabric.Object,
  lbObject: CanvasObject
): void {
  fabricObject.set({
    left: lbObject.x,
    top: lbObject.y,
    scaleX: lbObject.scaleX || 1,
    scaleY: lbObject.scaleY || 1,
    angle: lbObject.angle || 0,
    fill: lbObject.fill,
    stroke: lbObject.stroke,
    strokeWidth: lbObject.strokeWidth,
  });

  // Update type-specific properties
  if (lbObject.type === "text" && fabricObject instanceof fabric.IText) {
    fabricObject.set({
      text: lbObject.text || "Text",
      fontSize: lbObject.fontSize || 20,
      fontFamily: lbObject.fontFamily || "Arial",
    });
  } else if (lbObject.type === "rect" && fabricObject instanceof fabric.Rect) {
    fabricObject.set({
      width: lbObject.width / (lbObject.scaleX || 1),
      height: lbObject.height / (lbObject.scaleY || 1),
    });
  } else if (lbObject.type === "circle" && fabricObject instanceof fabric.Circle) {
    fabricObject.set({
      radius: lbObject.width / 2 / (lbObject.scaleX || 1),
    });
  } else if (lbObject.type === "triangle" && fabricObject instanceof fabric.Triangle) {
    fabricObject.set({
      width: lbObject.width / (lbObject.scaleX || 1),
      height: lbObject.height / (lbObject.scaleY || 1),
    });
  } else if (lbObject.type === "line" && fabricObject instanceof fabric.Line) {
    fabricObject.set({
      x1: lbObject.x1 || 0,
      y1: lbObject.y1 || 0,
      x2: lbObject.x2 || 0,
      y2: lbObject.y2 || 0,
    });
  }

  // Update metadata
  (fabricObject as fabric.Object & { version: number }).version = lbObject.version || 0;

  fabricObject.setCoords();
}

/**
 * Debounce function to limit update frequency
 */
export function debounce<T extends unknown[]>(
  func: (...args: T) => void,
  wait: number
): (...args: T) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: T) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
