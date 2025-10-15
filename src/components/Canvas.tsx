"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import ZoomControls from "./ZoomControls";
import ConfirmDialog from "./ConfirmDialog";
import { useCanvasSync } from "@/lib/useCanvasSync";

export type Tool = "select" | "pan" | "delete" | "rectangle" | "circle" | "triangle" | "line" | "text";

interface CanvasProps {
  activeTool?: Tool;
  activeColor?: string;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
}

// Helper to generate unique IDs for shapes
function generateShapeId(): string {
  return `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to configure shape selection styling
function configureShapeStyle(shape: fabric.Object, color: string) {
  shape.set({
    borderColor: "#3B82F6",
    cornerColor: "#3B82F6",
    cornerStyle: "circle",
    cornerSize: 8,
    transparentCorners: false,
    borderScaleFactor: 2,
    fill: color,
    stroke: color,
    strokeWidth: 2,
  });
}

export default function Canvas({
  activeTool = "select",
  activeColor = "#3B82F6",
  onCanvasReady,
  onToolChange,
}: CanvasProps & { onToolChange?: (tool: Tool) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isDrawingRef = useRef(false);
  const isPanDraggingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const currentShapeRef = useRef<fabric.Object | null>(null);
  const objectToDeleteRef = useRef<fabric.Object | null>(null);

  // Use refs to track tool and color without triggering canvas re-initialization
  const activeToolRef = useRef(activeTool);
  const activeColorRef = useRef(activeColor);

  // Sync canvas with Liveblocks for persistence
  useCanvasSync(fabricCanvas);

  // Update refs when props change
  useEffect(() => {
    activeToolRef.current = activeTool;

    // Update canvas settings when switching tools
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      if (activeTool === "pan") {
        setIsPanning(true);
        canvas.selection = false;
        canvas.defaultCursor = "grab";
      } else if (activeTool === "delete") {
        setIsPanning(false);
        isPanDraggingRef.current = false;
        canvas.selection = false;
        canvas.defaultCursor = "pointer";
      } else {
        setIsPanning(false);
        isPanDraggingRef.current = false;
        canvas.selection = true;
        canvas.defaultCursor = "default";
      }
    }
  }, [activeTool]);

  useEffect(() => {
    activeColorRef.current = activeColor;
  }, [activeColor]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
      selection: true,
    });

    // Configure selection styling with blue outline
    canvas.selectionColor = "rgba(59, 130, 246, 0.1)"; // Blue with transparency
    canvas.selectionBorderColor = "#3B82F6"; // Solid blue border
    canvas.selectionLineWidth = 2;

    fabricCanvasRef.current = canvas;
    setFabricCanvas(canvas);

    // Add a subtle grid background
    const gridSize = 50;
    const gridColor = "#f0f0f0";

    const drawGrid = () => {
      const width = canvas.width || 0;
      const height = canvas.height || 0;

      // Remove old grid lines
      canvas.getObjects().forEach((obj) => {
        if ((obj as fabric.Object & { data?: { isGrid?: boolean } }).data?.isGrid) {
          canvas.remove(obj);
        }
      });

      // Draw vertical lines
      for (let i = 0; i < width; i += gridSize) {
        const line = new fabric.Line([i, 0, i, height], {
          stroke: gridColor,
          strokeWidth: 1,
          selectable: false,
          evented: false,
        }) as fabric.Object & { data?: { isGrid?: boolean } };
        line.data = { isGrid: true };
        canvas.add(line);
        canvas.sendObjectToBack(line);
      }

      // Draw horizontal lines
      for (let i = 0; i < height; i += gridSize) {
        const line = new fabric.Line([0, i, width, i], {
          stroke: gridColor,
          strokeWidth: 1,
          selectable: false,
          evented: false,
        }) as fabric.Object & { data?: { isGrid?: boolean } };
        line.data = { isGrid: true };
        canvas.add(line);
        canvas.sendObjectToBack(line);
      }
    };

    drawGrid();

    // Pan with Space key
    let isSpacePressed = false;
    let lastPosX = 0;
    let lastPosY = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when editing text
      const activeObject = canvas.getActiveObject();
      const isEditingText = activeObject instanceof fabric.IText && activeObject.isEditing;

      if (e.code === "Space" && !isSpacePressed && !isEditingText) {
        e.preventDefault();
        isSpacePressed = true;
        setIsPanning(true);
        canvas.selection = false;
        canvas.defaultCursor = "grab";
      }

      // Tool shortcuts (only when not editing text)
      if (!isEditingText && onToolChange) {
        if (e.key.toLowerCase() === "v") {
          e.preventDefault();
          onToolChange("select");
        } else if (e.key.toLowerCase() === "r") {
          e.preventDefault();
          onToolChange("rectangle");
        } else if (e.key.toLowerCase() === "c") {
          e.preventDefault();
          onToolChange("circle");
        } else if (e.key.toLowerCase() === "t" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          onToolChange("text");
        } else if (e.key.toLowerCase() === "l") {
          e.preventDefault();
          onToolChange("line");
        }
      }

      // Handle object deletion with Delete or Backspace
      if (e.code === "Delete" || e.code === "Backspace") {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          // Check if we're not editing text
          const isEditingText = activeObjects.some(
            (obj) => obj instanceof fabric.IText && obj.isEditing
          );
          if (!isEditingText) {
            e.preventDefault();
            activeObjects.forEach((obj) => {
              // Don't delete grid lines
              if (!(obj as fabric.Object & { data?: { isGrid?: boolean } }).data?.isGrid) {
                canvas.remove(obj);
              }
            });
            canvas.discardActiveObject();
            canvas.requestRenderAll();
          }
        }
      }

      // Select all with Cmd/Ctrl + A
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a" && !isEditingText) {
        e.preventDefault();
        const allObjects = canvas.getObjects().filter(
          (obj) => !(obj as fabric.Object & { data?: { isGrid?: boolean } }).data?.isGrid
        );
        if (allObjects.length > 0) {
          canvas.discardActiveObject();
          const selection = new fabric.ActiveSelection(allObjects, { canvas });
          canvas.setActiveObject(selection);
          canvas.requestRenderAll();
        }
      }

      // Deselect all with Cmd/Ctrl + D
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d" && !isEditingText) {
        e.preventDefault();
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        isSpacePressed = false;
        isPanDraggingRef.current = false;
        setIsPanning(false);
        canvas.selection = true;
        canvas.defaultCursor = "default";
      }
    };

    const handleMouseDown = (opt: fabric.TEvent) => {
      const evt = opt.e as MouseEvent;
      const isPanMode = isSpacePressed || activeToolRef.current === "pan";

      if (isPanMode) {
        canvas.defaultCursor = "grabbing";
        isPanDraggingRef.current = true;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        return;
      }

      // Handle delete mode
      const hasTarget = "target" in opt && opt.target;
      if (activeToolRef.current === "delete" && hasTarget) {
        const target = opt.target as fabric.Object;
        // Don't delete grid lines
        if (!(target as fabric.Object & { data?: { isGrid?: boolean } }).data?.isGrid) {
          objectToDeleteRef.current = target;
          setShowDeleteConfirm(true);
        }
        return;
      }

      // Handle shape creation
      if (activeToolRef.current !== "select" && activeToolRef.current !== "delete" && !hasTarget) {
        const pointer = canvas.getPointer(evt);
        isDrawingRef.current = true;
        startPointRef.current = { x: pointer.x, y: pointer.y };

        if (activeToolRef.current === "rectangle") {
          const rect = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            selectable: false,
          });
          configureShapeStyle(rect, activeColorRef.current);
          // Assign unique ID
          (rect as fabric.Object & { id: string }).id = generateShapeId();
          currentShapeRef.current = rect;
          canvas.add(rect);
        } else if (activeToolRef.current === "circle") {
          const circle = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 0,
            selectable: false,
          });
          configureShapeStyle(circle, activeColorRef.current);
          (circle as fabric.Object & { id: string }).id = generateShapeId();
          currentShapeRef.current = circle;
          canvas.add(circle);
        } else if (activeToolRef.current === "triangle") {
          const triangle = new fabric.Triangle({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            selectable: false,
          });
          configureShapeStyle(triangle, activeColorRef.current);
          (triangle as fabric.Object & { id: string }).id = generateShapeId();
          currentShapeRef.current = triangle;
          canvas.add(triangle);
        } else if (activeToolRef.current === "line") {
          const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: activeColorRef.current,
            strokeWidth: 3,
            selectable: false,
            borderColor: "#3B82F6",
            cornerColor: "#3B82F6",
            cornerStyle: "circle",
            cornerSize: 8,
            transparentCorners: false,
            borderScaleFactor: 2,
          });
          (line as fabric.Object & { id: string }).id = generateShapeId();
          currentShapeRef.current = line;
          canvas.add(line);
        } else if (activeToolRef.current === "text") {
          const text = new fabric.IText("Text", {
            left: pointer.x,
            top: pointer.y,
            fontSize: 24,
            fill: activeColorRef.current,
            fontFamily: "Arial",
            borderColor: "#3B82F6",
            cornerColor: "#3B82F6",
            cornerStyle: "circle",
            cornerSize: 8,
            transparentCorners: false,
            borderScaleFactor: 2,
          });
          (text as fabric.Object & { id: string }).id = generateShapeId();
          canvas.add(text);
          canvas.setActiveObject(text);
          text.enterEditing();
          text.selectAll();
          canvas.requestRenderAll();
        }
      }
    };

    const handleMouseMove = (opt: fabric.TEvent) => {
      const evt = opt.e as MouseEvent;

      if (isPanDraggingRef.current && opt.e.type === "mousemove") {
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += evt.clientX - lastPosX;
          vpt[5] += evt.clientY - lastPosY;
          canvas.requestRenderAll();
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
        }
        return;
      }

      // Handle shape resizing during creation
      if (isDrawingRef.current && currentShapeRef.current && startPointRef.current) {
        const pointer = canvas.getPointer(evt);
        const shape = currentShapeRef.current;

        if (activeToolRef.current === "rectangle" && shape instanceof fabric.Rect) {
          const width = pointer.x - startPointRef.current.x;
          const height = pointer.y - startPointRef.current.y;

          shape.set({
            width: Math.abs(width),
            height: Math.abs(height),
            left: width > 0 ? startPointRef.current.x : pointer.x,
            top: height > 0 ? startPointRef.current.y : pointer.y,
          });
        } else if (activeToolRef.current === "circle" && shape instanceof fabric.Circle) {
          const deltaX = pointer.x - startPointRef.current.x;
          const deltaY = pointer.y - startPointRef.current.y;
          const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 2;

          shape.set({
            radius: Math.max(0, radius),
            left: startPointRef.current.x,
            top: startPointRef.current.y,
          });
        } else if (activeToolRef.current === "triangle" && shape instanceof fabric.Triangle) {
          const width = pointer.x - startPointRef.current.x;
          const height = pointer.y - startPointRef.current.y;

          shape.set({
            width: Math.abs(width),
            height: Math.abs(height),
            left: width > 0 ? startPointRef.current.x : pointer.x,
            top: height > 0 ? startPointRef.current.y : pointer.y,
          });
        } else if (activeToolRef.current === "line" && shape instanceof fabric.Line) {
          shape.set({
            x2: pointer.x,
            y2: pointer.y,
          });
        }

        canvas.requestRenderAll();
      }
    };

    const handleMouseUp = () => {
      const isPanMode = isSpacePressed || activeToolRef.current === "pan";

      if (isPanMode) {
        canvas.defaultCursor = "grab";
        isPanDraggingRef.current = false;
        return;
      }

      // Finish shape creation
      if (isDrawingRef.current && currentShapeRef.current) {
        const shape = currentShapeRef.current;
        const minSize = 10;
        let isValidShape = true;

        // Validate minimum size for shapes
        if (shape instanceof fabric.Rect || shape instanceof fabric.Triangle) {
          const width = (shape.width || 0) * (shape.scaleX || 1);
          const height = (shape.height || 0) * (shape.scaleY || 1);
          isValidShape = width >= minSize && height >= minSize;
        } else if (shape instanceof fabric.Circle) {
          const radius = (shape.radius || 0) * (shape.scaleX || 1);
          isValidShape = radius >= minSize / 2;
        } else if (shape instanceof fabric.Line) {
          const x1 = shape.x1 || 0;
          const y1 = shape.y1 || 0;
          const x2 = shape.x2 || 0;
          const y2 = shape.y2 || 0;
          const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
          isValidShape = length >= minSize;
        }

        if (isValidShape) {
          // Make shape selectable and set as active
          shape.set({ selectable: true });
          canvas.setActiveObject(shape);
          canvas.requestRenderAll();
        } else {
          // Remove shape if too small
          canvas.remove(shape);
        }

        isDrawingRef.current = false;
        startPointRef.current = null;
        currentShapeRef.current = null;
      }
    };

    // Zoom with mouse wheel
    const handleMouseWheel = (opt: fabric.TEvent) => {
      const evt = opt.e as WheelEvent;
      evt.preventDefault();
      evt.stopPropagation();

      const delta = evt.deltaY;
      let newZoom = canvas.getZoom();

      // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
      const isCmdOrCtrl = evt.metaKey || evt.ctrlKey;

      if (isCmdOrCtrl) {
        // Zoom with Cmd/Ctrl + scroll
        newZoom *= 0.999 ** delta;
      } else {
        // Zoom with regular scroll
        newZoom *= 0.999 ** delta;
      }

      // Clamp zoom between 0.1 and 20
      if (newZoom > 20) newZoom = 20;
      if (newZoom < 0.1) newZoom = 0.1;

      // Zoom to point (cursor position)
      const point = new fabric.Point(evt.offsetX, evt.offsetY);
      canvas.zoomToPoint(point, newZoom);
      setZoom(newZoom);
    };

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);
    canvas.on("mouse:wheel", handleMouseWheel);

    // Handle window resize
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      drawGrid();
      canvas.requestRenderAll();
    };

    window.addEventListener("resize", handleResize);

    // Call onCanvasReady callback
    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    // Cleanup on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      canvas.dispose();
      fabricCanvasRef.current = null;
      setFabricCanvas(null);
    };
  }, [onCanvasReady]);

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    const canvas = fabricCanvasRef.current;
    const objectToDelete = objectToDeleteRef.current;

    if (canvas && objectToDelete) {
      canvas.remove(objectToDelete);
      canvas.requestRenderAll();
    }

    setShowDeleteConfirm(false);
    objectToDeleteRef.current = null;
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    objectToDeleteRef.current = null;
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          cursor: isPanning ? "grab" : "default",
        }}
      />
      <ZoomControls
        canvas={fabricCanvasRef.current}
        zoom={zoom}
        onZoomChange={setZoom}
      />
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Object"
        message="Are you sure you want to delete this object? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
