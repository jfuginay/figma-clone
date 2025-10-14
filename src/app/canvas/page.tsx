"use client";

import { useState, useCallback, useRef } from "react";
import * as fabric from "fabric";
import Canvas from "@/components/Canvas";
import Toolbar, { Tool } from "@/components/Toolbar";
import { Room } from "@/components/Room";
import { UserButton } from "@clerk/nextjs";
import { useCanvasSync } from "@/lib/useCanvasSync";
import LiveCursors from "@/components/LiveCursors";
import ActiveUsers from "@/components/ActiveUsers";
import { useUpdateMyPresence } from "@/liveblocks.config";

function CanvasContent() {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [activeColor, setActiveColor] = useState("#3B82F6");
  const updateMyPresence = useUpdateMyPresence();
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Initialize canvas sync
  useCanvasSync(canvas);

  // Throttle cursor updates to 60fps (16ms)
  const lastUpdateRef = useRef(0);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 16) return; // Throttle to ~60fps

    lastUpdateRef.current = now;

    updateMyPresence({
      cursor: {
        x: e.clientX,
        y: e.clientY,
      },
    });
  }, [updateMyPresence]);

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({
      cursor: null,
    });
  }, [updateMyPresence]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm z-50">
        <h1 className="text-xl font-semibold text-gray-800">Figma Clone</h1>
        <UserButton afterSignOutUrl="/" />
      </div>

      {/* Toolbar */}
      <Toolbar
        activeTool={activeTool}
        activeColor={activeColor}
        onToolChange={setActiveTool}
        onColorChange={setActiveColor}
      />

      {/* Canvas Area */}
      <div
        ref={canvasContainerRef}
        className="flex-1 relative"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <Canvas
          activeTool={activeTool}
          activeColor={activeColor}
          onCanvasReady={setCanvas}
        />

        {/* Multiplayer Cursors */}
        <LiveCursors />

        {/* Active Users Panel */}
        <ActiveUsers />
      </div>
    </div>
  );
}

export default function CanvasPage() {
  // Use a consistent room ID for testing, or generate per user/project
  const roomId = "figma-clone-demo-room";

  return (
    <Room roomId={roomId}>
      <CanvasContent />
    </Room>
  );
}
