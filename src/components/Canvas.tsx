"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import ZoomControls from "./ZoomControls";

export type Tool = "select" | "rectangle" | "circle" | "text";

interface CanvasProps {
  activeTool?: Tool;
  activeColor?: string;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
}

export default function Canvas({
  activeTool = "select",
  activeColor = "#3B82F6",
  onCanvasReady,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const currentShapeRef = useRef<fabric.Object | null>(null);

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
      if (e.code === "Space" && !isSpacePressed) {
        e.preventDefault();
        isSpacePressed = true;
        setIsPanning(true);
        canvas.selection = false;
        canvas.defaultCursor = "grab";
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
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        isSpacePressed = false;
        setIsPanning(false);
        canvas.selection = true;
        canvas.defaultCursor = "default";
      }
    };

    const handleMouseDown = (opt: fabric.TEvent) => {
      const evt = opt.e as MouseEvent;
      if (isSpacePressed) {
        canvas.defaultCursor = "grabbing";
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        return;
      }

      // Handle shape creation
      const hasTarget = "target" in opt && opt.target;
      if (activeTool !== "select" && !hasTarget) {
        const pointer = canvas.getPointer(evt);
        isDrawingRef.current = true;
        startPointRef.current = { x: pointer.x, y: pointer.y };

        if (activeTool === "rectangle") {
          const rect = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: activeColor,
            stroke: activeColor,
            strokeWidth: 2,
            selectable: false,
            borderColor: "#3B82F6",
            cornerColor: "#3B82F6",
            cornerStyle: "circle",
            cornerSize: 8,
            transparentCorners: false,
            borderScaleFactor: 2,
          });
          currentShapeRef.current = rect;
          canvas.add(rect);
        } else if (activeTool === "circle") {
          const circle = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 0,
            fill: activeColor,
            stroke: activeColor,
            strokeWidth: 2,
            selectable: false,
            borderColor: "#3B82F6",
            cornerColor: "#3B82F6",
            cornerStyle: "circle",
            cornerSize: 8,
            transparentCorners: false,
            borderScaleFactor: 2,
          });
          currentShapeRef.current = circle;
          canvas.add(circle);
        } else if (activeTool === "text") {
          const text = new fabric.IText("Text", {
            left: pointer.x,
            top: pointer.y,
            fontSize: 24,
            fill: activeColor,
            fontFamily: "Arial",
            borderColor: "#3B82F6",
            cornerColor: "#3B82F6",
            cornerStyle: "circle",
            cornerSize: 8,
            transparentCorners: false,
            borderScaleFactor: 2,
          });
          canvas.add(text);
          canvas.setActiveObject(text);
          text.enterEditing();
          canvas.requestRenderAll();
        }
      }
    };

    const handleMouseMove = (opt: fabric.TEvent) => {
      const evt = opt.e as MouseEvent;
      if (isSpacePressed && opt.e.type === "mousemove") {
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

        if (activeTool === "rectangle" && shape instanceof fabric.Rect) {
          const width = pointer.x - startPointRef.current.x;
          const height = pointer.y - startPointRef.current.y;

          shape.set({
            width: Math.abs(width),
            height: Math.abs(height),
            left: width > 0 ? startPointRef.current.x : pointer.x,
            top: height > 0 ? startPointRef.current.y : pointer.y,
          });
        } else if (activeTool === "circle" && shape instanceof fabric.Circle) {
          const deltaX = pointer.x - startPointRef.current.x;
          const deltaY = pointer.y - startPointRef.current.y;
          const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 2;

          shape.set({
            radius: Math.max(0, radius),
            left: startPointRef.current.x,
            top: startPointRef.current.y,
          });
        }

        canvas.requestRenderAll();
      }
    };

    const handleMouseUp = () => {
      if (isSpacePressed) {
        canvas.defaultCursor = "grab";
        return;
      }

      // Finish shape creation
      if (isDrawingRef.current && currentShapeRef.current) {
        currentShapeRef.current.set({ selectable: true });
        canvas.setActiveObject(currentShapeRef.current);
        isDrawingRef.current = false;
        startPointRef.current = null;
        currentShapeRef.current = null;
        canvas.requestRenderAll();
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
    };
  }, [onCanvasReady, activeTool, activeColor]);

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
    </div>
  );
}
