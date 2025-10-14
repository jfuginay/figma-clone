"use client";

import * as fabric from "fabric";

interface ZoomControlsProps {
  canvas: fabric.Canvas | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export default function ZoomControls({ canvas, zoom, onZoomChange }: ZoomControlsProps) {
  const handleZoomIn = () => {
    if (!canvas) return;
    let newZoom = canvas.getZoom() * 1.1;
    if (newZoom > 20) newZoom = 20;

    const center = canvas.getCenter();
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), newZoom);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    let newZoom = canvas.getZoom() * 0.9;
    if (newZoom < 0.1) newZoom = 0.1;

    const center = canvas.getCenter();
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), newZoom);
    onZoomChange(newZoom);
  };

  const handleResetZoom = () => {
    if (!canvas) return;
    const center = canvas.getCenter();
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), 1);
    onZoomChange(1);
  };

  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
      <button
        onClick={handleZoomOut}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 10H15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <button
        onClick={handleResetZoom}
        className="px-3 py-1 text-sm font-medium hover:bg-gray-100 rounded transition-colors min-w-[60px]"
        title="Reset Zoom"
        aria-label="Reset Zoom"
      >
        {Math.round(zoom * 100)}%
      </button>

      <button
        onClick={handleZoomIn}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Zoom In"
        aria-label="Zoom In"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 5V15M5 10H15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
